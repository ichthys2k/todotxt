import { ArchiveRestore, User, EyeOff, Check, Calendar } from 'lucide-react';
import type { TodoTask } from '../services/todoParser';

import { serializeTask } from '../services/todoParser';
import { useRef, useState, useEffect } from 'react';
import { PROJECT_COLOR_PRESETS, CONTEXT_COLOR_PRESETS, DATE_COLOR_PRESETS } from '../utils/themeStyles';
import { TaskEditor } from './TaskEditor';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';


interface TodoItemProps {
  task: TodoTask;
  onToggle: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onUpdateDueDate: (newDueDate: string | null) => void;
  onUpdateTaskText: (newText: string) => void;
  knownProjects: string[];
  knownContexts: string[];
  knownAssignees: string[];
  showCreationDate: boolean;
  projectPreset: string;
  contextPreset: string;
  datePreset: string;
  isKanban?: boolean;
  contextEmojis?: Record<string, string>;
  activeSmartView?: string | null;
  hiddenTags?: string[];
  language: Language;
  showMetadataTags?: boolean;
}

interface PriorityDropdownProps {
  currentValue: string;
  onSelect: (value: string | null) => void;
  onClose: () => void;
  language: Language;
}

const PriorityDropdown = ({ currentValue, onSelect, onClose, language }: PriorityDropdownProps) => {
  const options = ['A', 'B', 'C', 'D'];
  const [customValue, setCustomValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = () => onClose();
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [onClose]);

  useEffect(() => {
    // Focus first button on mount
    const firstBtn = containerRef.current?.querySelector('button');
    if (firstBtn) {
      firstBtn.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      // Restore focus to task card
      (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const focusables = Array.from(containerRef.current?.querySelectorAll('button, input') || []);
      const index = focusables.indexOf(document.activeElement as any);
      if (index !== -1 && index < focusables.length - 1) {
        (focusables[index + 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const focusables = Array.from(containerRef.current?.querySelectorAll('button, input') || []);
      const index = focusables.indexOf(document.activeElement as any);
      if (index > 0) {
        (focusables[index - 1] as HTMLElement).focus();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 py-1"
    >
      <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-700 font-sans">
        {t('changePriority', language)}
      </div>
      <ul className="py-1 font-sans">
        {options.filter(o => o !== currentValue).map(option => (
          <li key={option}>
            <button
              onClick={() => {
                onSelect(option);
                setTimeout(() => {
                  (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
                }, 50);
              }}
              className="w-full text-left px-3 py-1 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold text-red-600 dark:text-red-400 focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
            >
              ({option})
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-200 dark:border-slate-700 p-1 space-y-1 font-sans">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-center text-[10px] text-indigo-650 dark:text-indigo-400 hover:underline py-0.5 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
          >
            {t('otherLetter', language)}
          </button>
        ) : (
          <div className="flex gap-1">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value.toUpperCase().slice(0, 1))}
              placeholder="A-Z"
              className="w-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-xs text-center focus:outline-none text-slate-900 dark:text-slate-55 focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <button
              onClick={() => {
                onSelect(customValue);
                setTimeout(() => {
                  (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
                }, 50);
              }}
              disabled={!customValue.trim() || !/[A-Z]/.test(customValue)}
              className="flex-1 bg-indigo-600 text-white px-1 py-0.5 rounded text-[10px] hover:bg-indigo-700 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              Ok
            </button>
          </div>
        )}
        <button
          onClick={() => {
            onSelect(null);
            setTimeout(() => {
              (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
            }, 50);
          }}
          className="w-full text-center text-xs text-red-655 hover:text-red-700 py-1 border-t border-slate-200 dark:border-slate-700 mt-1 block cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
        >
          {t('remove', language)}
        </button>
      </div>
    </div>
  );
};

interface TagDropdownProps {
  type: 'project' | 'context' | 'assignee';
  currentValue: string;
  options: string[];
  onSelect: (value: string | null) => void;
  onClose: () => void;
  language: Language;
}

const TagDropdown = ({ type, currentValue, options, onSelect, onClose, language }: TagDropdownProps) => {
  const [customValue, setCustomValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = () => onClose();
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [onClose]);

  useEffect(() => {
    const firstElement = containerRef.current?.querySelector('button, input');
    if (firstElement) {
      (firstElement as HTMLElement).focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      // Restore focus to task card
      (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const focusables = Array.from(containerRef.current?.querySelectorAll('button, input') || []);
      const index = focusables.indexOf(document.activeElement as any);
      if (index !== -1 && index < focusables.length - 1) {
        (focusables[index + 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const focusables = Array.from(containerRef.current?.querySelectorAll('button, input') || []);
      const index = focusables.indexOf(document.activeElement as any);
      if (index > 0) {
        (focusables[index - 1] as HTMLElement).focus();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 py-1"
    >
      <div className="px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-700">
        {type === 'project' ? t('changeProject', language) : type === 'context' ? t('changeContext', language) : t('changeAssignee', language)}
      </div>
      <ul className="max-h-32 overflow-y-auto py-1">
        {options.filter(o => o !== currentValue).map(option => (
          <li key={option}>
            <button
              onClick={() => {
                onSelect(option);
                setTimeout(() => {
                  (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
                }, 50);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
            >
              {type === 'project' ? '+' : type === 'context' ? '@' : 'who:'}{option}
            </button>
          </li>
        ))}
        {options.filter(o => o !== currentValue).length === 0 && (
          <li className="px-3 py-1.5 text-xs text-slate-400 italic">{t('noAlternatives', language)}</li>
        )}
      </ul>
      <div className="border-t border-slate-200 dark:border-slate-700 p-1.5 space-y-1">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full text-center text-xs text-indigo-650 dark:text-indigo-400 hover:underline py-1 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
          >
            {t('customValue', language)}
          </button>
        ) : (
          <div className="flex gap-1">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={t('placeholderNew', language)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs focus:outline-none text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <button
              onClick={() => {
                onSelect(customValue);
                setTimeout(() => {
                  (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
                }, 50);
              }}
              disabled={!customValue.trim()}
              className="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              Ok
            </button>
          </div>
        )}
        <button
          onClick={() => {
            onSelect(null);
            setTimeout(() => {
              (containerRef.current?.closest('[tabindex="0"].group') as HTMLElement)?.focus();
            }, 50);
          }}
          className="w-full text-center text-xs text-red-650 hover:text-red-700 py-1 border-t border-slate-200 dark:border-slate-700 mt-1 block cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
        >
          {t('remove', language)}
        </button>
      </div>
    </div>
  );
};

export const TodoItem = ({ 
  task, 
  onToggle, 
  onDelete, 
  onRestore, 
  onUpdateDueDate, 
  onUpdateTaskText,
  knownProjects,
  knownContexts,
  knownAssignees,
  showCreationDate,
  projectPreset,
  contextPreset,
  datePreset,
  isKanban = false,
  knownAssignees: _,
  contextEmojis = {},
  activeSmartView,
  hiddenTags = [],
  language,
  showMetadataTags = false
}: TodoItemProps & { knownAssignees: string[] }) => {
  const projectStyles = PROJECT_COLOR_PRESETS[projectPreset] || PROJECT_COLOR_PRESETS['purple'];
  const contextStyles = CONTEXT_COLOR_PRESETS[contextPreset] || CONTEXT_COLOR_PRESETS['emerald'];
  const dateStyles = DATE_COLOR_PRESETS[datePreset] || DATE_COLOR_PRESETS['slate'];

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('sv-SE');
  })();
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('sv-SE');
  })();

  const dateInputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [activeEditTag, setActiveEditTag] = useState<{ type: 'project' | 'context' | 'assignee'; originalWord: string; index: number } | null>(null);
  
  const [isEditingPriority, setIsEditingPriority] = useState(false);

  // Inline-Textbearbeitung
  const [isEditingText, setIsEditingText] = useState(false);
  const prevIsEditingText = useRef(isEditingText);

  useEffect(() => {
    if (prevIsEditingText.current && !isEditingText) {
      itemRef.current?.focus();
    }
    prevIsEditingText.current = isEditingText;
  }, [isEditingText]);

  // Touch Swipe Gestures
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditingText) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    if (!isSwiping.current) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isSwiping.current = true;
      } else if (Math.abs(diffY) > 10) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
    }

    if (isSwiping.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
      let offset = diffX;
      // Dampen swipe
      if (offset > 120) {
        offset = 120 + (offset - 120) * 0.2;
      } else if (offset < -120) {
        offset = -120 + (offset + 120) * 0.2;
      }
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    
    if (isSwiping.current) {
      if (swipeOffset > 80) {
        onToggle();
      } else if (swipeOffset < -80) {
        dateInputRef.current?.showPicker();
      }
    }

    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  };


  const handleUpdatePriority = (newPriority: string | null) => {
    const updatedTask = { ...task, priority: newPriority };
    const newText = serializeTask(updatedTask);
    onUpdateTaskText(newText);
    setIsEditingPriority(false);
  };



  const handleUpdateTag = (oldWord: string, newWord: string | null) => {
    let newDesc = task.description;
    if (newWord) {
      newDesc = newDesc.replace(oldWord, newWord);
    } else {
      newDesc = newDesc.replace(oldWord, '').replace(/\s+/g, ' ').trim();
    }
    onUpdateTaskText(newDesc);
    setActiveEditTag(null);
  };

  const handleMakeVisible = () => {
    let newDesc = task.description;
    // Surgical regex replacement to clean up h:1 tag and extra spaces
    newDesc = newDesc.replace(/\s*\bh:1\b\s*/g, ' ').replace(/\s+/g, ' ').trim();

    const updatedTask = { ...task };
    const newTags = { ...task.tags };
    delete newTags['h'];
    updatedTask.tags = newTags;
    updatedTask.description = newDesc;

    const newText = serializeTask(updatedTask);
    onUpdateTaskText(newText);
  };


  const renderDescription = (text: string, isCompleted: boolean) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      // Metadata tags filter
      if (!showMetadataTags) {
        const trimmed = word.trim();
        if (trimmed.startsWith('id:') || trimmed.startsWith('upd:')) {
          return null;
        }
      }

      // Hidden tags filter
      if (hiddenTags.length > 0) {
        const lowerWord = word.trim().toLowerCase();
        if (hiddenTags.some(t => {
          const lt = t.toLowerCase();
          if (lt === lowerWord) return true;
          // Support comma-separated assignee checks (e.g. who:cornelius,diana contains who:cornelius)
          if (lowerWord.startsWith('who:') && lt.startsWith('who:')) {
            const wordVals = lowerWord.substring(4).split(',');
            const tVal = lt.substring(4);
            return wordVals.includes(tVal);
          }
          return false;
        })) {
          return null;
        }
      }

      // URL Link detection
      if (word.startsWith('http://') || word.startsWith('https://')) {
        return (
          <a
            key={index}
            href={word}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline break-all cursor-pointer ${
              isCompleted 
                ? 'text-slate-400 dark:text-slate-555 line-through hover:text-slate-500' 
                : 'text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
            }`}
          >
            {word}
          </a>
        );
      }

      // Hide +family project tag when in the family smart list
      if (word.startsWith('+') && word.length > 1 && activeSmartView === 'family' && word === '+family') {
        return null;
      }

      if (isCompleted) {
        return <span key={index} className="line-through text-slate-400 dark:text-slate-500">{word}</span>;
      }

      // Projekt Tag
      if (word.startsWith('+') && word.length > 1) {
        const isEditing = activeEditTag?.index === index;
        return (
          <span key={index} className="relative inline-block">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setActiveEditTag(isEditing ? null : { type: 'project', originalWord: word, index });
              }}
              className={`px-1 py-0.5 rounded-md font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity inline-block mx-0.5 ${projectStyles.normal}`}
              title={`${t('changeProject', language)} / ${t('remove', language)}`}
            >
              {word}
            </span>
            {isEditing && (
              <TagDropdown 
                type="project"
                currentValue={word.substring(1)}
                options={knownProjects}
                onSelect={(newVal) => handleUpdateTag(word, newVal ? `+${newVal}` : null)}
                onClose={() => setActiveEditTag(null)}
                language={language}
              />
            )}
          </span>
        );
      }
      
      // Kontext Tag
      if (word.startsWith('@') && word.length > 1) {
        const isEditing = activeEditTag?.index === index;
        const ctxName = word.substring(1);
        const emoji = contextEmojis[ctxName];
        return (
          <span key={index} className="relative inline-block">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                setActiveEditTag(isEditing ? null : { type: 'context', originalWord: word, index });
              }}
              className={`px-1 py-0.5 rounded-md font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center gap-1 mx-0.5 ${contextStyles.normal}`}
              title={`${t('changeContext', language)} / ${t('remove', language)}`}
            >
              {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
              <span>{word}</span>
            </span>
            {isEditing && (
              <TagDropdown 
                type="context"
                currentValue={word.substring(1)}
                options={knownContexts}
                onSelect={(newVal) => handleUpdateTag(word, newVal ? `@${newVal}` : null)}
                onClose={() => setActiveEditTag(null)}
                language={language}
              />
            )}
          </span>
        );
      }

      // Fälligkeits- und Schwellenwertdatum
      if (word.includes(':')) {
        const [key] = word.split(':');
        if (key === 'due' || key === 't') {
          const wordDate = word.substring(4);
          const isOverdue = key === 'due' && wordDate < todayStr;
          const isToday = key === 'due' && wordDate === todayStr;
          const isTomorrow = key === 'due' && wordDate === tomorrowStr;

          let dotColor = "";
          let dotTitle = "";

          if (isOverdue) {
            dotColor = "bg-red-500 dark:bg-red-400";
            dotTitle = t('groupOverdue', language) + "!";
          } else if (isToday) {
            dotColor = "bg-orange-500 dark:bg-orange-400";
            dotTitle = t('groupToday', language) + "!";
          } else if (isTomorrow) {
            dotColor = "bg-yellow-500 dark:bg-yellow-400";
            dotTitle = t('groupTomorrow', language);
          }

          let displayWord = word;
          if (key === 'due') {
            if (isToday) displayWord = `due:${t('inputDateToday', language)}`;
            else if (isTomorrow) displayWord = `due:${t('inputDateTomorrow', language)}`;
            else if (wordDate === yesterdayStr) displayWord = `due:${t('dueYesterday', language)}`;
          }

          return (
            <span 
              key={index} 
              onClick={(e) => {
                if (key === 'due') {
                  e.stopPropagation();
                  dateInputRef.current?.showPicker();
                }
              }}
              className={`relative inline-block font-semibold px-1 py-0.5 rounded-md cursor-pointer hover:opacity-85 select-none text-sm ${dateStyles.normal}`}
              title={key === 'due' ? t('reschedule', language) : t('startHelper', language)}
            >
              {displayWord}
              {dotColor && !isCompleted && (
                <span 
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-sm ${dotColor}`} 
                  title={dotTitle}
                />
              )}
            </span>
          );
        }
        if (key === 'who') {
          const assigneeName = word.substring(4);
          const isEditing = activeEditTag?.index === index;
          return (
            <span key={index} className="relative inline-block">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEditTag(isEditing ? null : { type: 'assignee', originalWord: word, index });
                }}
                className="px-1 py-0.5 rounded-md font-semibold text-sm cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center gap-1 mx-0.5 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900"
                title={`${t('changeAssignee', language)} / ${t('remove', language)}`}
              >
                <User size={13} className="text-amber-500" />
                <span>{assigneeName}</span>
              </span>
              {isEditing && (
                <TagDropdown
                  type="assignee"
                  currentValue={assigneeName}
                  options={knownAssignees}
                  onSelect={(newVal) => handleUpdateTag(word, newVal ? `who:${newVal}` : null)}
                  onClose={() => setActiveEditTag(null)}
                  language={language}
                />
              )}
            </span>
          );
        }
        if (key === 'rec') {
           return <span key={index} className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-105 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-sm">{word}</span>;
        }
        if (key === 'status') {
          const statusVal = word.substring(7);
          let badgeStyles = "bg-slate-50 text-slate-750 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-900/30";
          let prefix = "";
          if (statusVal === 'planned') {
            badgeStyles = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
            prefix = "🔵 ";
          } else if (statusVal === 'continue') {
            badgeStyles = "bg-[#efebe9] text-[#5d4037] border-[#d7ccc8] dark:bg-[#3e2723]/40 dark:text-[#d7ccc8] dark:border-[#5d4037]/30";
            prefix = "🟤 ";
          } else if (statusVal === 'details') {
            badgeStyles = "bg-orange-50 text-orange-850 border-orange-200 dark:bg-orange-950/40 dark:text-orange-455 dark:border-orange-900/30";
            prefix = "🟠 ";
          }
          return (
            <span key={index} className={`font-semibold px-1 py-0.5 rounded-md text-sm inline-flex items-center gap-0.5 mx-0.5 ${badgeStyles}`}>
              <span>{prefix}status:{statusVal}</span>
            </span>
          );
        }
        return <span key={index} className="text-indigo-650 dark:text-indigo-400 text-sm">{word}</span>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDueDate(e.target.value || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditingText) return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      const taskSelector = '[tabindex="0"].group';
      const items = Array.from(document.querySelectorAll(taskSelector));
      const index = items.indexOf(e.currentTarget);
      if (index !== -1 && index < items.length - 1) {
        (items[index + 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      const taskSelector = '[tabindex="0"].group';
      const items = Array.from(document.querySelectorAll(taskSelector));
      const index = items.indexOf(e.currentTarget);
      if (index > 0) {
        (items[index - 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const firstSidebarItem = document.querySelector('.w-68 button, .w-68 input') as HTMLElement | null;
      if (firstSidebarItem) {
        firstSidebarItem.focus();
      }
    } else if (e.key === ' ' || e.key.toLowerCase() === 'x') {
      e.preventDefault();
      onToggle();
    } else if (e.key.toLowerCase() === 'e') {
      e.preventDefault();
      if (!task.isCompleted) {
        setIsEditingText(true);
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete();
    }
  };

  const editorEl = (
    <TaskEditor
      initialTask={task}
      onSave={(newTaskText) => {
        if (newTaskText.trim()) {
          onUpdateTaskText(newTaskText.trim());
        }
        setIsEditingText(false);
      }}
      onCancel={() => setIsEditingText(false)}
      knownProjects={knownProjects}
      knownContexts={knownContexts}
      knownAssignees={knownAssignees}
      isInline={!isKanban}
      contextEmojis={contextEmojis}
      projectPreset={projectPreset}
      contextPreset={contextPreset}
      language={language}
    />
  );
  if (isEditingText && !isKanban) {
    return (
      <div 
        className="border-b border-slate-200/60 dark:border-slate-800/80 last:border-b-0 w-full animate-expand"
        style={{
          gap: 'var(--density-task-gap)',
          paddingTop: 'var(--density-task-py)',
          paddingBottom: 'var(--density-task-py)',
          paddingLeft: 'var(--density-task-px)',
          paddingRight: 'var(--density-task-px)',
        }}
      >
        {editorEl}
      </div>
    );
  }


  return (
    <div 
      ref={itemRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`task-focus-border group relative overflow-hidden transition-all duration-200 focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/40 after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-indigo-650 dark:after:bg-indigo-400 after:opacity-0 focus-visible:after:opacity-100 after:transition-opacity after:z-20 after:pointer-events-none ${
        isKanban 
          ? `w-full ${
              task.isCompleted 
                ? 'opacity-75' 
                : ''
            }` 
          : `border-b border-slate-200 dark:border-slate-800 last:border-b-0 ${
              task.isCompleted 
                ? 'opacity-65' 
                : ''
            }`
      }`}
    >
      {/* Background Actions for Swipe */}
      {swipeOffset !== 0 && (
        <div className={`absolute inset-0 flex items-center justify-between px-4 text-white z-0 transition-colors duration-150 ${
          swipeOffset > 0 ? 'bg-emerald-500' : 'bg-indigo-650 dark:bg-indigo-700'
        }`}>
          {swipeOffset > 0 ? (
            <div className="flex items-center gap-2">
              <Check size={18} className="animate-pulse" />
              <span className="text-xs font-bold font-sans">{t('complete', language)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold font-sans">{t('reschedule', language)}</span>
              <Calendar size={18} className="animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Sliding Content Container */}
      <div 
        className={`w-full flex items-center z-10 relative transition-colors duration-200 ${
          isKanban
            ? task.isCompleted
              ? 'bg-slate-50/20 dark:bg-slate-900/10'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            : task.isCompleted
              ? 'bg-slate-50/50 dark:bg-slate-900/40'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          gap: 'var(--density-task-gap)',
          paddingTop: isKanban ? 'var(--density-kanban-py)' : 'var(--density-task-py)',
          paddingBottom: isKanban ? 'var(--density-kanban-py)' : 'var(--density-task-py)',
          paddingLeft: isKanban ? 'var(--density-kanban-px)' : 'var(--density-task-px)',
          paddingRight: isKanban ? 'var(--density-kanban-px)' : 'var(--density-task-px)',
        }}
      >
        {/* Hidden Date Picker Input */}
        <input 
          ref={dateInputRef}
          type="date"
          value={task.tags['due'] || ''}
          onChange={handleDateChange}
          className="sr-only absolute pointer-events-none"
        />

        {/* Checkbox */}
        <button 
          onClick={onToggle}
          className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
            task.isCompleted 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-400 dark:border-slate-500 hover:border-indigo-500 dark:hover:border-indigo-400 text-transparent hover:text-indigo-650 dark:hover:text-indigo-400/50'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {task.priority && !task.isCompleted && !hiddenTags.some(t => t.toLowerCase() === `priority:${task.priority?.toLowerCase()}`) && (
            <div className="relative">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingPriority(!isEditingPriority);
                }}
                className="flex items-center justify-center w-5 h-5 rounded bg-red-100 dark:bg-red-905/40 text-red-700 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-500/30 flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                title={t('changePriority', language)}
              >
                {task.priority}
              </span>
              {isEditingPriority && (
                <PriorityDropdown 
                  currentValue={task.priority}
                  onSelect={handleUpdatePriority}
                  onClose={() => setIsEditingPriority(false)}
                  language={language}
                />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0 text-sm">
            <div 
              onClick={() => {
                if (!task.isCompleted) setIsEditingText(true);
              }}
              className="text-slate-800 dark:text-slate-200 break-words cursor-pointer flex items-center gap-2 flex-wrap"
              title={t('placeholderClickToEdit', language)}
            >
              <span>{renderDescription(task.description, task.isCompleted)}</span>
              
              {((showCreationDate && task.creationDate) || (task.isCompleted && task.completionDate)) && (
                <span className="inline-flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 select-none ml-2">
                  {showCreationDate && task.creationDate && (
                    <span title={t('createdOn', language)}>★ {task.creationDate}</span>
                  )}
                  {task.isCompleted && task.completionDate && (
                    <span title={t('completedOn', language)} className="text-emerald-655 dark:text-emerald-500">✓ {task.completionDate}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 transition-all flex-shrink-0">
          {task.tags['h'] === '1' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleMakeVisible();
              }}
              className="p-1 text-slate-400 dark:text-slate-505 hover:text-indigo-650 dark:hover:text-indigo-455 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded transition-all cursor-pointer"
              title={t('makeVisible', language)}
            >
              <EyeOff size={15} />
            </button>
          )}
          {onRestore && (
            <button 
              onClick={onRestore}
              className="p-1 text-slate-500 hover:text-indigo-650 dark:hover:text-indigo-450 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
              title={t('restoreTask', language)}
            >
              <ArchiveRestore size={15} />
            </button>
          )}
        </div>
      </div>
      {isKanban && isEditingText && editorEl}
    </div>
  );
};
