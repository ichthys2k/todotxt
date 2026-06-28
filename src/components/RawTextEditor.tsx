import React, { useState, useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@uiw/react-codemirror';
import { HighlightStyle, syntaxHighlighting, StreamLanguage } from '@codemirror/language';
import { Tag, tags as tTag } from '@lezer/highlight';
import { fetchTodoContent, saveTodoContent, fetchArchiveContent, saveArchiveContent } from '../services/storageService';
import { Save, FileText, Archive, RefreshCw } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

// Define custom tags for todo.txt metadata elements
const dueTag = Tag.define();
const thresholdTag = Tag.define();
const hiddenTag = Tag.define();
const whoTag = Tag.define();
const statusTag = Tag.define();

// Custom StreamLanguage tokenizer for todo.txt with tokenTable mapping
const todoTxtTokenizer = StreamLanguage.define({
  token(stream) {
    const isLineStart = stream.sol();

    if (isLineStart) {
      // 1. Completed task: 'x ' at the beginning of the line
      // Matches 'x ' and everything after it up to the end of the line
      if (stream.match(/^x\s.*/)) {
        return 'comment';
      }

      // 2. Priority: '(A)' at the beginning of the line
      if (stream.match(/^\([A-Z]\)/)) {
        return 'keyword';
      }
    }

    // 3. Projects: +ProjectName (starts with + followed by non-whitespace)
    if (stream.match(/^\+\S+/)) {
      return 'variableName';
    }

    // URL Link detection
    if (stream.match(/^https?:\/\/\S+/)) {
      return 'link';
    }

    // 4. Contexts: @ContextName (starts with @ followed by non-whitespace)
    if (stream.match(/^@\S+/)) {
      return 'typeName';
    }

    // 5. Specific metadata tags: due:, t:, h:, who:
    if (stream.match(/^due:\S+/)) {
      return 'todoDue';
    }
    if (stream.match(/^t:\S+/)) {
      return 'todoThreshold';
    }
    if (stream.match(/^h:\S+/)) {
      return 'todoHidden';
    }
    if (stream.match(/^who:\S+/)) {
      return 'todoWho';
    }
    if (stream.match(/^status:\S+/)) {
      return 'todoStatus';
    }

    // 6. Dates: YYYY-MM-DD
    if (stream.match(/^\d{4}-\d{2}-\d{2}/)) {
      return 'number';
    }

    // 7. General metadata tags: key:value (e.g. rec:1d)
    if (stream.match(/^\b\w+:\S+/)) {
      return 'meta';
    }

    // Default: consume next character and return no token style
    stream.next();
    return null;
  },
  tokenTable: {
    todoDue: dueTag,
    todoThreshold: thresholdTag,
    todoHidden: hiddenTag,
    todoWho: whoTag,
    todoStatus: statusTag
  }
});

// Custom syntax highlighting styling matching our theme (with CSS Variables support for light/dark)
const todoTxtHighlightStyle = HighlightStyle.define([
  { tag: tTag.keyword, color: '#f59e0b', fontWeight: 'bold' }, // Priority (A) -> Yellow
  { tag: tTag.comment, color: '#64748b', textDecoration: 'line-through', fontStyle: 'italic' }, // Completed x -> Slate & strikethrough
  { tag: tTag.number, color: '#60a5fa' }, // Date -> Blue
  { tag: tTag.meta, color: '#fb923c', fontFamily: 'monospace' }, // Tag key:val -> Orange
  { tag: tTag.link, color: '#3b82f6', textDecoration: 'underline' },

  // Badges styling with background colors
  { 
    tag: tTag.variableName, // Projects (+) -> Lila/Purple
    color: 'var(--todo-project-color)', 
    backgroundColor: 'var(--todo-project-bg)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid var(--todo-project-border)',
    fontWeight: '600'
  },
  { 
    tag: tTag.typeName, // Contexts (@) -> Green/Emerald
    color: 'var(--todo-context-color)', 
    backgroundColor: 'var(--todo-context-bg)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid var(--todo-context-border)',
    fontWeight: '600'
  },
  { 
    tag: dueTag, // Due (due:) -> Blue
    color: 'var(--todo-due-color)', 
    backgroundColor: 'var(--todo-due-bg)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid var(--todo-due-border)',
    fontWeight: '600'
  },
  { 
    tag: thresholdTag, // Threshold (t:) -> Blue
    color: 'var(--todo-due-color)', 
    backgroundColor: 'var(--todo-due-bg)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid var(--todo-due-border)',
    fontWeight: '600'
  },
  { 
    tag: hiddenTag, 
    color: '#f87171', 
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontWeight: '600'
  },
  { 
    tag: whoTag, // Who (who:) -> Orange
    color: 'var(--todo-who-color)', 
    backgroundColor: 'var(--todo-who-bg)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid var(--todo-who-border)',
    fontWeight: '600'
  },
  { 
    tag: statusTag, 
    color: '#38bdf8', // sky-400
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    padding: '1px 4px',
    borderRadius: '4px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    fontWeight: '600'
  }
]);

// Theme customization for CodeMirror
const todoTxtEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "var(--todo-editor-bg)",
    color: "var(--todo-editor-text)"
  },
  ".cm-scroller": {
    fontFamily: "Fira Code, Menlo, Monaco, Consolas, Courier New, monospace",
    lineHeight: "1.6"
  },
  ".cm-content": {
    caretColor: "var(--todo-editor-caret)"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--todo-editor-caret)"
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--todo-editor-selection) !important"
  },
  ".cm-gutters": {
    backgroundColor: "var(--todo-editor-gutter-bg)",
    color: "var(--todo-editor-gutter-text)",
    border: "none"
  }
});

interface RawTextEditorProps {
  storageMode: 'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive';
  onReloadTasks: () => void;
  language: Language;
}

export const RawTextEditor: React.FC<RawTextEditorProps> = ({ storageMode, onReloadTasks, language }) => {
  const [activeTab, setActiveTab] = useState<'todo' | 'archive'>('todo');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Load files from storage provider
  const loadData = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'todo' 
        ? await fetchTodoContent(storageMode) 
        : await fetchArchiveContent(storageMode);
      setContent(data || '');
    } catch (e) {
      console.error("Fehler beim Laden:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, storageMode]);

  // Save files to storage provider
  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'todo') {
        await saveTodoContent(storageMode, content);
      } else {
        await saveArchiveContent(storageMode, content);
      }
      onReloadTasks(); // Reload the App task context
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    } finally {
      setSaving(false);
    }
  };

  // Memoize CodeMirror extensions to prevent re-initializing CodeMirror state on every keystroke
  const editorExtensions = useMemo(() => [
    todoTxtTokenizer,
    syntaxHighlighting(todoTxtHighlightStyle),
    todoTxtEditorTheme,
    EditorView.lineWrapping
  ], []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Editor Tab Navigation and Actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 select-none">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('todo')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'todo' ? 'bg-indigo-600 dark:bg-indigo-650 text-white shadow-md' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>todo.txt</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'archive' ? 'bg-indigo-600 dark:bg-indigo-650 text-white shadow-md' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>archive.txt</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={loadData} 
            disabled={loading} 
            title={language === 'de' ? 'Aktualisieren' : 'Reload'}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200 dark:hover:bg-slate-750 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-md text-sm font-semibold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (language === 'de' ? 'Speichert...' : 'Saving...') : t('save', language)}</span>
          </button>
        </div>
      </div>

      {/* Editor Work Area */}
      <div className="relative flex-1 overflow-auto bg-[var(--todo-editor-bg)]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--todo-editor-bg)]/80 z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          </div>
        )}

        <CodeMirror
          value={content}
          height="100%"
          theme="none"
          extensions={editorExtensions}
          onChange={(value) => setContent(value)}
          className="h-full text-left"
        />
      </div>
    </div>
  );
};
