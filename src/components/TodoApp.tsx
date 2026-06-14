import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchTodoContent, saveTodoContent, getSelectedFileId, clearSelectedFile, archiveTasks, fetchArchiveContent, saveArchiveContent, restoreTasks, syncPendingChanges, hasPendingSync, fetchConfigContent, saveConfigContent, getTodoFileHandle, getArchiveFileHandle, setTodoFileHandle, setArchiveFileHandle, requestFileHandlePermission, getWebDavCredentials, hasWebDavFileSelected, hasGDriveFileSelected, getElectronPaths, setElectronPaths, selectElectronFile, getGitCredentials } from '../services/storageService';
import { parseTodos, serializeTodos, completeTask, updateTaskDueDate, serializeTask } from '../services/todoParser';
import type { TodoTask } from '../services/todoParser';
import { TodoList } from './TodoList';
import { TodoInput } from './TodoInput';
import { Sidebar } from './Sidebar';
import { OneDrivePicker } from './OneDrivePicker';
import { WebDavPicker } from './WebDavPicker';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import { LocalPicker } from './LocalPicker';
import { GitPicker } from './GitPicker';
import { KanbanBoard } from './KanbanBoard';
import { DashboardView } from './DashboardView';
import { Archive, Wifi, RefreshCw, Rows, LayoutGrid, Menu, Undo, ArrowUpDown, Settings, Filter, HelpCircle, Layers, CheckCircle, Sliders, Palette, Database, Smile, Globe } from 'lucide-react';
import { getTheme, setTheme } from '../services/themeService';
import { getDensity, setDensity, applyDensity, type Density } from '../services/densityService';
import { HelpModal } from './HelpModal';
import { playTaskCreatedSound, playTaskCompletedSound } from '../utils/audio';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

export interface CustomView {
  id: string;
  name: string;
  project: string | null;
  context: string | null;
  searchQuery: string;
}

interface TodoAppProps {
  storageMode: 'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive';
  onLogout: () => void;
  username: string | null;
  avatarUrl?: string | null;
}

export type SmartViewType = 'my-day' | 'important' | 'planned' | 'all' | 'completed' | 'assigned' | 'tasks-no-context' | 'gtd-projects' | 'family' | 'future-threshold' | null;

const localTexts = {
  de: {
    logoTitle: 'Aktive Hauptseite laden und Filter zurücksetzen',
    tasks: 'Aufgaben',
    help: 'Hilfe',
    noContexts: 'Keine Kontexte'
  },
  en: {
    logoTitle: 'Load active main page and reset filters',
    tasks: 'Tasks',
    help: 'Help',
    noContexts: 'No Contexts'
  },
  la: {
    logoTitle: 'Redire ad paginam principalem et purgare filtra',
    tasks: 'Pensa',
    help: 'Auxilium',
    noContexts: 'Nulli Contextus'
  },
  fr: {
    logoTitle: 'Charger la page principale active et réinitialiser les filtres',
    tasks: 'Tâches',
    help: 'Aide',
    noContexts: 'Aucun contexte'
  },
  it: {
    logoTitle: 'Carica la pagina principale attiva e resetta i filtri',
    tasks: 'Compiti',
    help: 'Aiuto',
    noContexts: 'Nessun contesto'
  },
  es: {
    logoTitle: 'Cargar la página principal activa y restablecer los filtros',
    tasks: 'Tareas',
    help: 'Ayuda',
    noContexts: 'Sin contextos'
  },
  zh: {
    logoTitle: '加载活动主页并重置过滤器',
    tasks: '任务',
    help: '帮助',
    noContexts: '无情境'
  },
  ar: {
    logoTitle: 'تحميل الصفحة الرئيسية النشطة وإعادة تعيين التصفيات',
    tasks: 'مهام',
    help: 'مساعدة',
    noContexts: 'بلا سياق'
  },
  hi: {
    logoTitle: 'सक्रिय मुख्य पृष्ठ लोड करें और फ़िल्टर रीसेट करें',
    tasks: 'कार्य',
    help: 'सहायता',
    noContexts: 'कोई संदर्भ नहीं'
  },
  pt: {
    logoTitle: 'Carregar a página principal activa e redefinir os filtros',
    tasks: 'Tarefas',
    help: 'Ajuda',
    noContexts: 'Nenhum contexto'
  },
  sw: {
    logoTitle: 'Aktive Hauptseit lada und Filter zricksetza',
    tasks: 'Uffgaba',
    help: 'Hilf',
    noContexts: 'Kei Kontexte'
  },
  uk: {
    logoTitle: 'Завантажити активну головну сторінку та скинути фільтри',
    tasks: 'Завдання',
    help: 'Довідка',
    noContexts: 'Немає контекстів'
  },
  he: {
    logoTitle: 'טען דף ראשי פעיל ואפס מסננים',
    tasks: 'משימות',
    help: 'עזרה',
    noContexts: 'אין הקשרים'
  },
  el: {
    logoTitle: 'Φόρτωση ενεργής αρχικής σελίδας και επαναφορά φίλτρων',
    tasks: 'Εργασίες',
    help: 'Βοήθεια',
    noContexts: 'Χωρίς πλαίσιο'
  },
  tr: {
    logoTitle: 'Aktif ana sayfayı yükle ve filtreleri sıfırla',
    tasks: 'Görevler',
    help: 'Yardım',
    noContexts: 'Kapsam yok'
  }
};

const colorNames: Record<Language, Record<string, string>> = {
  de: { purple: 'Lila', blue: 'Blau', emerald: 'Grün', orange: 'Orange', amber: 'Bernstein', slate: 'Schiefer', zinc: 'Zink' },
  en: { purple: 'Purple', blue: 'Blue', emerald: 'Green', orange: 'Orange', amber: 'Amber', slate: 'Slate', zinc: 'Zinc' },
  la: { purple: 'Purpureus', blue: 'Caeruleus', emerald: 'Smaragdinus', orange: 'Aurantius', amber: 'Electrinus', slate: 'Lapis', zinc: 'Zincum' },
  fr: { purple: 'Violet', blue: 'Bleu', emerald: 'Vert', orange: 'Orange', amber: 'Ambre', slate: 'Ardoise', zinc: 'Zinc' },
  it: { purple: 'Viola', blue: 'Blu', emerald: 'Verde', orange: 'Arancione', amber: 'Ambra', slate: 'Ardesia', zinc: 'Zinco' },
  es: { purple: 'Púrpura', blue: 'Azul', emerald: 'Verde', orange: 'Naranja', amber: 'Ámbar', slate: 'Pizarra', zinc: 'Zinc' },
  zh: { purple: '紫色', blue: '蓝色', emerald: '绿色', orange: '橙色', amber: '琥珀色', slate: '板岩灰', zinc: '锌色' },
  ar: { purple: 'بنفسجي', blue: 'أزرق', emerald: 'أخضر', orange: 'برتقالي', amber: 'كهرماني', slate: 'أردوازي', zinc: 'زنك' },
  hi: { purple: 'बैंगनी', blue: 'नीला', emerald: 'हरा', orange: 'नारंगी', amber: 'एम्बर', slate: 'स्लेट', zinc: 'जस्ता' },
  pt: { purple: 'Roxo', blue: 'Azul', emerald: 'Verde', orange: 'Laranja', amber: 'Âmbar', slate: 'Cinza', zinc: 'Zinco' },
  sw: { purple: 'Lila', blue: 'Blau', emerald: 'Grü', orange: 'Orange', amber: 'Bernstein', slate: 'Schiefer', zinc: 'Zink' },
  uk: { purple: 'Фіолетовий', blue: 'Синій', emerald: 'Зелений', orange: 'Помаранчевий', amber: 'Бурштиновий', slate: 'Сланцевий', zinc: 'Цинковий' },
  he: { purple: 'סגול', blue: 'כחול', emerald: 'ירוק', orange: 'כתום', amber: 'ענבר', slate: 'צפחה', zinc: 'אבץ' },
  el: { purple: 'Μοβ', blue: 'Μπλε', emerald: 'Πράσινο', orange: 'Πορτοκαλί', amber: 'Κεχριμπάρι', slate: 'Σχιστόλιθος', zinc: 'Ψευδάργυρος' },
  tr: { purple: 'Mor', blue: 'Mavi', emerald: 'Yeşil', orange: 'Turuncu', amber: 'Kehribar', slate: 'Arduvaz', zinc: 'Çinko' }
};

export const TodoApp = ({ storageMode, onLogout, username: _username, avatarUrl: _avatarUrl }: TodoAppProps) => {
  const isLocalMode = storageMode === 'local';
  const isWebDavMode = storageMode === 'webdav';
  const isGitMode = storageMode === 'git';
  const isGDriveMode = storageMode === 'gdrive';
  const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalFileLinked, setIsLocalFileLinked] = useState(false);

  const checkLocalFile = async () => {
    if (storageMode === 'local') {
      if (isElectron) {
        const paths = await getElectronPaths();
        setIsLocalFileLinked(!!paths.todo);
      } else {
        const handle = await getTodoFileHandle();
        setIsLocalFileLinked(!!handle);
      }
    } else {
      setIsLocalFileLinked(false);
    }
  };

  useEffect(() => {
    checkLocalFile();
  }, [storageMode]);

  const [archiving, setArchiving] = useState(false);
  const [isPickingArchive, setIsPickingArchive] = useState(false);
  const [currentView, setCurrentView] = useState<'todo' | 'archive' | 'dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'dashboard') return 'dashboard';
    if (viewParam === 'archive') return 'archive';
    return 'todo';
  });
  const [activeSmartView, setActiveSmartView] = useState<SmartViewType>(null);
  const [archivedTasks, setArchivedTasks] = useState<TodoTask[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'accents' | 'files' | 'filters'>('general');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };

  // Undo history state
  const [history, setHistory] = useState<{ tasks: TodoTask[]; archivedTasks: TodoTask[]; view: 'todo' | 'archive' | 'dashboard' }[]>([]);

  const pushToHistory = (currentTasks: TodoTask[], currentArchivedTasks: TodoTask[], view: 'todo' | 'archive' | 'dashboard') => {
    setHistory(prev => {
      const next = [...prev, { tasks: currentTasks, archivedTasks: currentArchivedTasks, view }];
      if (next.length > 20) {
        next.shift();
      }
      return next;
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Connection / PWA Sync States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [hasPending, setHasPending] = useState(hasPendingSync());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('todo_txt_last_sync_timestamp'));

  // Ticker state for dynamic relative sync time updates
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, []);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState(getTheme());

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setCurrentTheme(newTheme);
  };

  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('todo_txt_language') as Language;
    const validLanguages: Language[] = ['de', 'en', 'la', 'fr', 'it', 'es', 'zh', 'ar', 'hi', 'pt', 'sw', 'uk', 'he', 'el', 'tr'];
    if (validLanguages.includes(saved)) return saved;
    const browserLang = navigator.language.split('-')[0] as Language;
    if (validLanguages.includes(browserLang)) return browserLang;
    return 'de';
  });

  const handleLanguageChange = (newLang: Language) => {
    localStorage.setItem('todo_txt_language', newLang);
    setLanguage(newLang);
  };

  useEffect(() => {
    document.documentElement.dir = (language === 'ar' || language === 'he') ? 'rtl' : 'ltr';
  }, [language]);

  const texts = localTexts[language] || localTexts['en'];
  const colors = colorNames[language] || colorNames['en'];

  // Density State
  const [currentDensity, setCurrentDensity] = useState<Density>(getDensity());

  const handleDensityChange = (newDensity: Density) => {
    setDensity(newDensity);
    setCurrentDensity(newDensity);
  };

  useEffect(() => {
    applyDensity();
  }, [currentDensity]);

  // Erstelldatum Einstellung
  const [showCreationDate, setShowCreationDate] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_show_creation_date') === 'true'; // default false
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_show_creation_date', showCreationDate ? 'true' : 'false');
  }, [showCreationDate]);

  // Erstelldatum automatisch hinzufügen Einstellung (Standard: aus)
  const [autoAddCreationDate, setAutoAddCreationDate] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_auto_add_creation_date') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_auto_add_creation_date', autoAddCreationDate ? 'true' : 'false');
  }, [autoAddCreationDate]);

  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'context' | 'priority' | 'due' | 'assignee'>(() => {
    return (localStorage.getItem('todo_txt_group_by') as any) || 'due';
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_group_by', groupBy);
  }, [groupBy]);

  // Sortierung
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'due' | 'creation' | 'alphabetical'>(() => {
    return (localStorage.getItem('todo_txt_sort_by') as any) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_sort_by', sortBy);
  }, [sortBy]);

  // Layout-Modus (Liste vs. Kanban)
  const [layoutMode, setLayoutMode] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem('todo_txt_layout_mode') as any) || 'list';
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_layout_mode', layoutMode);
  }, [layoutMode]);

  // Filters to hide tasks
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_hide_completed') === 'true';
  });
  const [hideHidden, setHideHidden] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_hide_hidden') !== 'false'; // default true
  });
  const [hideFutureThreshold, setHideFutureThreshold] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_hide_future_threshold') === 'true';
  });
  const [hideFutureDue, setHideFutureDue] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_hide_future_due') === 'true';
  });

  // Selected Attributes Filters
  const [selectedDue, setSelectedDue] = useState<string | null>(null);
  const [selectedCreationDate, setSelectedCreationDate] = useState<string | null>(null);
  const [selectedThresholdDate, setSelectedThresholdDate] = useState<string | null>(null);
  const [selectedCompletionDate, setSelectedCompletionDate] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('todo_txt_hide_completed', hideCompleted ? 'true' : 'false');
  }, [hideCompleted]);

  useEffect(() => {
    localStorage.setItem('todo_txt_hide_hidden', hideHidden ? 'true' : 'false');
  }, [hideHidden]);

  useEffect(() => {
    localStorage.setItem('todo_txt_hide_future_threshold', hideFutureThreshold ? 'true' : 'false');
  }, [hideFutureThreshold]);

  useEffect(() => {
    localStorage.setItem('todo_txt_hide_future_due', hideFutureDue ? 'true' : 'false');
  }, [hideFutureDue]);

  // Custom Views State
  const [customViews, setCustomViews] = useState<CustomView[]>(() => {
    try {
      const saved = localStorage.getItem('todo_txt_custom_views');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_custom_views', JSON.stringify(customViews));
  }, [customViews]);

  // Color Accent Presets
  const [projectPreset, setProjectPreset] = useState<string>(() => localStorage.getItem('todo_txt_preset_project') || 'purple');
  const [contextPreset, setContextPreset] = useState<string>(() => localStorage.getItem('todo_txt_preset_context') || 'emerald');
  const [datePreset, setDatePreset] = useState<string>(() => localStorage.getItem('todo_txt_preset_date') || 'slate');

  // Linked File System Handles States
  const [todoFileName, setTodoFileName] = useState<string | null>(null);
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  // Full paths (Electron only)
  const [todoFilePath, setTodoFilePath] = useState<string | null>(null);
  const [archiveFilePath, setArchiveFilePath] = useState<string | null>(null);

  // Helper: extract filename from a full path (works without Node.js path module)
  const getFileName = (filePath: string) => filePath.split(/[\\/]/).pop() || filePath;

  useEffect(() => {
    const checkLinkedFiles = async () => {
      if (isElectron) {
        // Electron: load persisted paths from native config file
        const paths = await getElectronPaths();
        setTodoFilePath(paths.todo);
        setArchiveFilePath(paths.archive);
        setTodoFileName(paths.todo ? getFileName(paths.todo) : null);
        setArchiveFileName(paths.archive ? getFileName(paths.archive) : null);
      } else {
        // Web/PWA: load FileSystem Handle from IndexedDB
        const todoH = await getTodoFileHandle();
        const archiveH = await getArchiveFileHandle();
        setTodoFileName(todoH ? todoH.name : null);
        setArchiveFileName(archiveH ? archiveH.name : null);
      }
    };
    if (isLocalMode) {
      checkLinkedFiles();
    }
  }, [isLocalMode]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'todo' | 'archive') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const text = await file.text();
      if (type === 'todo') {
        await saveTodoContent(storageMode, text);
        if (currentView === 'todo') {
          const parsed = parseTodos(text);
          setTasks(parsed);
        }
      } else {
        await saveArchiveContent(storageMode, text);
        if (currentView === 'archive') {
          const parsed = parseTodos(text);
          setTasks(parsed);
        }
      }
      showToast(t('importSuccess', language));
    } catch (err: any) {
      console.error(err);
      setError(t('importError', language));
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleExportFile = async (type: 'todo' | 'archive') => {
    try {
      setLoading(true);
      setError(null);
      const content = type === 'todo'
        ? await fetchTodoContent(storageMode)
        : await fetchArchiveContent(storageMode);
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'todo' ? 'todo.txt' : 'archive.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Exportieren.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkFile = async (type: 'todo' | 'archive') => {
    if (isElectron) {
      // Electron: open native OS file dialog (persistent, no permission prompts)
      try {
        const title = type === 'todo' ? 'todo.txt auswählen' : 'archive.txt auswählen';
        const filePath = await selectElectronFile(title);
        if (!filePath) return; // user cancelled
        const currentPaths = await getElectronPaths();
        await setElectronPaths(
          type === 'todo' ? filePath : currentPaths.todo,
          type === 'archive' ? filePath : currentPaths.archive
        );
        if (type === 'todo') {
          setTodoFilePath(filePath);
          setTodoFileName(getFileName(filePath));
        } else {
          setArchiveFilePath(filePath);
          setArchiveFileName(getFileName(filePath));
        }
        loadTasks();
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Fehler beim Verknüpfen der Datei.');
      }
      return;
    }
    // Web/PWA: use File System Access API
    try {
      if (!('showOpenFilePicker' in window)) {
        setError(t('browserFileApiNotSupported', language));
        return;
      }
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: type === 'todo' ? 'todo.txt' : 'archive.txt',
          accept: { 'text/plain': ['.txt'] }
        }],
        multiple: false
      });
      if (handle) {
        if (type === 'todo') {
          await setTodoFileHandle(handle);
          setTodoFileName(handle.name);
        } else {
          await setArchiveFileHandle(handle);
          setArchiveFileName(handle.name);
        }
        loadTasks();
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        setError(err.message || 'Fehler beim Verknüpfen der Datei.');
      }
    }
  };

  const handleUnlinkFile = async (type: 'todo' | 'archive') => {
    if (isElectron) {
      // Electron: clear path from persistent config
      try {
        const currentPaths = await getElectronPaths();
        await setElectronPaths(
          type === 'todo' ? null : currentPaths.todo,
          type === 'archive' ? null : currentPaths.archive
        );
        if (type === 'todo') {
          setTodoFilePath(null);
          setTodoFileName(null);
        } else {
          setArchiveFilePath(null);
          setArchiveFileName(null);
        }
        loadTasks();
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Fehler beim Trennen der Datei.');
      }
      return;
    }
    // Web/PWA: clear the FileSystem Handle from IndexedDB
    try {
      if (type === 'todo') {
        await setTodoFileHandle(null);
        setTodoFileName(null);
      } else {
        await setArchiveFileHandle(null);
        setArchiveFileName(null);
      }
      loadTasks();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Trennen der Datei.');
    }
  };

  useEffect(() => {
    localStorage.setItem('todo_txt_preset_project', projectPreset);
  }, [projectPreset]);

  useEffect(() => {
    localStorage.setItem('todo_txt_preset_context', contextPreset);
  }, [contextPreset]);

  useEffect(() => {
    localStorage.setItem('todo_txt_preset_date', datePreset);
  }, [datePreset]);

  // System-Benachrichtigungen
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_notifications_enabled') === 'true';
  });

  // Context Emojis State
  const [contextEmojis, setContextEmojis] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('todo_txt_context_emojis');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('todo_txt_context_emojis', JSON.stringify(contextEmojis));
  }, [contextEmojis]);

  useEffect(() => {
    localStorage.setItem('todo_txt_notifications_enabled', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification("Mitteilungen aktiviert", {
            body: "Du wirst nun über fällige Aufgaben informiert.",
            icon: "favicon.svg"
          });
        } else {
          alert("Berechtigung verweigert. Bitte aktiviere Mitteilungen in den Browsereinstellungen.");
          setNotificationsEnabled(false);
        }
      } else {
        alert("Dieser Browser unterstützt keine System-Benachrichtigungen.");
        setNotificationsEnabled(false);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  // Cloud Config load/save states and functions
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const loadConfig = async () => {
    try {
      const configStr = await fetchConfigContent(storageMode);
      if (configStr && configStr.trim() !== '{}' && configStr.trim() !== '') {
        const config = JSON.parse(configStr);
        if (config) {
          if (Array.isArray(config.customViews)) {
            setCustomViews(config.customViews);
          }
          if (config.contextEmojis) {
            setContextEmojis(config.contextEmojis);
          }
          if (config.settings) {
            const s = config.settings;
            if (typeof s.hideCompleted === 'boolean') setHideCompleted(s.hideCompleted);
            if (typeof s.hideHidden === 'boolean') setHideHidden(s.hideHidden);
            if (typeof s.hideFutureThreshold === 'boolean') setHideFutureThreshold(s.hideFutureThreshold);
            if (typeof s.hideFutureDue === 'boolean') setHideFutureDue(s.hideFutureDue);
            if (s.sortBy) setSortBy(s.sortBy);
            if (s.groupBy) setGroupBy(s.groupBy);
            if (s.layoutMode) setLayoutMode(s.layoutMode);
            if (typeof s.showCreationDate === 'boolean') setShowCreationDate(s.showCreationDate);
            if (typeof s.autoAddCreationDate === 'boolean') setAutoAddCreationDate(s.autoAddCreationDate);
            if (s.projectPreset) setProjectPreset(s.projectPreset);
            if (s.contextPreset) setContextPreset(s.contextPreset);
            if (s.datePreset) setDatePreset(s.datePreset);
            if (s.density) handleDensityChange(s.density);
            if (typeof s.notificationsEnabled === 'boolean') setNotificationsEnabled(s.notificationsEnabled);
            const validLanguages = ['de', 'en', 'la', 'fr', 'it', 'es', 'zh', 'ar', 'hi', 'pt', 'sw', 'uk', 'he', 'el', 'tr'];
            if (s.language && validLanguages.includes(s.language)) handleLanguageChange(s.language as Language);
          }
        }
      }
    } catch (e) {
      console.warn("Fehler beim Laden der Konfiguration:", e);
    } finally {
      setIsConfigLoaded(true);
    }
  };


  // Format Helper für Sync-Zeit (relativ)
  const formatSyncTime = (dateStr: string | null) => {
    if (!dateStr) return 'Nie';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Nie';
      
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 10) {
        return 'gerade eben';
      }
      if (diffSecs < 60) {
        return `vor ${diffSecs} Sekunden`;
      }
      if (diffMins === 1) {
        return 'vor 1 Minute';
      }
      if (diffMins < 60) {
        return `vor ${diffMins} Minuten`;
      }
      if (diffHours === 1) {
        return 'vor 1 Stunde';
      }
      if (diffHours < 24) {
        return `vor ${diffHours} Stunden`;
      }
      if (diffDays === 1) {
        return 'vor 1 Tag';
      }
      if (diffDays < 7) {
        return `vor ${diffDays} Tagen`;
      }
      return `am ${date.toLocaleDateString()}`;
    } catch (e) {
      return 'Nie';
    }
  };

  // Connection Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasPending(hasPendingSync());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when transitioning to online
  useEffect(() => {
    if (isOnline && hasPending && !isLocalMode) {
      handleSync();
    }
  }, [isOnline, hasPending]);

  // Periodic poll of pending state
  useEffect(() => {
    const interval = setInterval(() => {
      setHasPending(hasPendingSync());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Globale Tastatur-Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // N -> Neue Aufgabe
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const inputEl = document.querySelector('input[placeholder^="Aufgabe hinzufügen"]') as HTMLInputElement | null;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }

      // Alt + 1 -> Aktive Aufgaben
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setCurrentView('todo');
      }

      // Alt + 2 -> Archiv
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setCurrentView('archive');
      }

      // Alt + K -> Layout wechseln
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setLayoutMode(prev => prev === 'list' ? 'kanban' : 'list');
      }

      // Alt + S -> Sidebar fokussieren/öffnen
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSidebarOpen(true);
        setTimeout(() => {
          const sidebarBtn = document.querySelector('.w-68 button') as HTMLElement | null;
          if (sidebarBtn) {
            sidebarBtn.focus();
          }
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView, setLayoutMode, setIsSidebarOpen]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSidebarOpenRef = useRef(isSidebarOpen);
  useEffect(() => {
    isSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Horizontal swipe check
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
        if (deltaX > 0) {
          // Swipe right from left edge (x < 50px) to open
          if (touchStartRef.current.x < 50) {
            setIsSidebarOpen(true);
          }
        } else {
          // Swipe left to close if currently open
          if (isSidebarOpenRef.current) {
            setIsSidebarOpen(false);
          }
        }
      }
      
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
  }, []);

  const handleSync = async () => {
    if (!isOnline || isLocalMode) return;
    try {
      setSyncing(true);
      setError(null);
      await syncPendingChanges(storageMode);
      await loadTasks();
      if (!isLocalMode && navigator.onLine) {
        const syncTime = new Date().toISOString();
        localStorage.setItem('todo_txt_last_sync_timestamp', syncTime);
        setLastSyncTime(syncTime);
      }
      setHasPending(hasPendingSync());
      showToast("Erfolgreich synchronisiert!");
    } catch (err: any) {
      console.error("Synchronisation fehlgeschlagen:", err);
      setError("Synchronisation fehlgeschlagen. Versuche es später erneut.");
    } finally {
      setSyncing(false);
    }
  };


  
  // Filter States
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // File Selection State
  const hasLocalFileSelected = () => localStorage.getItem('todo_txt_local_setup_complete') === 'true';
  const hasGitFileSelected = () => !!getGitCredentials().repo;

  const [hasFileSelected, setHasFileSelected] = useState<boolean>(
    (isLocalMode && hasLocalFileSelected()) || 
    (isGitMode && hasGitFileSelected()) || 
    (isGDriveMode && hasGDriveFileSelected()) || 
    (isWebDavMode && hasWebDavFileSelected()) || 
    (storageMode === 'onedrive' && getSelectedFileId() !== null)
  );

  useEffect(() => {
    if ((isLocalMode && hasLocalFileSelected()) || 
        (isGitMode && hasGitFileSelected()) || 
        (isGDriveMode && hasGDriveFileSelected()) || 
        (isWebDavMode && hasWebDavFileSelected()) || 
        (storageMode === 'onedrive' && getSelectedFileId())) {
      setHasFileSelected(true);
      if (currentView !== 'dashboard') {
        loadTasks();
      }
    } else {
      setHasFileSelected(false);
      setLoading(false);
    }
  }, [isLocalMode, isWebDavMode, isGitMode, isGDriveMode, currentView, hasFileSelected, storageMode]);

  // Automatischer Sync bei Tab-Fokus
  useEffect(() => {
    const handleFocus = () => {
      if (isOnline && !isLocalMode && hasFileSelected && !syncing) {
        handleSync();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOnline, isLocalMode, hasFileSelected, syncing]);

  // Periodischer Sync alle 5 Minuten
  useEffect(() => {
    if (isLocalMode || !hasFileSelected) return;
    const interval = setInterval(() => {
      if (isOnline && !syncing) {
        handleSync();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOnline, isLocalMode, hasFileSelected, syncing]);

  // Auto-focus first task when view/filters change
  useEffect(() => {
    if (loading) return;
    
    const activeEl = document.activeElement;
    if (
      activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      )
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const firstTask = document.querySelector('[tabindex="0"].group') as HTMLElement | null;
      if (firstTask) {
        firstTask.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentView, activeSmartView, selectedProject, selectedContext, selectedDue, selectedAssignee, loading]);

  // Sync settings/views back to OneDrive config file
  useEffect(() => {
    if (!isConfigLoaded || !hasFileSelected) return;

    const config = {
      customViews,
      contextEmojis,
      settings: {
        hideCompleted,
        hideHidden,
        hideFutureThreshold,
        hideFutureDue,
        sortBy,
        groupBy,
        layoutMode,
        showCreationDate,
        autoAddCreationDate,
        projectPreset,
        contextPreset,
        datePreset,
        density: currentDensity,
        notificationsEnabled,
        language
      }
    };
    
    saveConfigContent(storageMode, JSON.stringify(config)).then(() => {
      setHasPending(hasPendingSync());
    }).catch(err => {
      console.warn("Fehler beim automatischen Speichern der Konfiguration:", err);
    });
  }, [
    isConfigLoaded,
    hasFileSelected,
    isLocalMode,
    customViews,
    contextEmojis,
    hideCompleted,
    hideHidden,
    hideFutureThreshold,
    hideFutureDue,
    sortBy,
    groupBy,
    layoutMode,
    showCreationDate,
    autoAddCreationDate,
    projectPreset,
    contextPreset,
    datePreset,
    currentDensity,
    notificationsEnabled,
    language
  ]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      checkLocalFile();
      setTasks([]);
      if (!isConfigLoaded) {
        await loadConfig();
      }
      const content = currentView === 'todo' 
        ? await fetchTodoContent(storageMode)
        : await fetchArchiveContent(storageMode);
      const parsedTasks = parseTodos(content);
      setTasks(parsedTasks);

      // System-Benachrichtigung Briefing
      if (currentView === 'todo' && notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const todayStr = new Date().toLocaleDateString('sv-SE');
        const activeTasks = parsedTasks.filter(t => !t.isCompleted);
        const overdueCount = activeTasks.filter(t => t.tags['due'] && t.tags['due'] < todayStr).length;
        const todayCount = activeTasks.filter(t => t.tags['due'] === todayStr).length;
        
        if (overdueCount > 0 || todayCount > 0) {
          const lastBriefing = localStorage.getItem('todo_txt_last_briefing_date');
          if (lastBriefing !== todayStr) {
            let body = "";
            if (overdueCount > 0 && todayCount > 0) {
              body = t('notificationBodyOverdueToday', language, todayCount, overdueCount);
            } else if (todayCount > 0) {
              body = t('notificationBodyToday', language, todayCount);
            } else if (overdueCount > 0) {
              body = t('notificationBodyOverdue', language, overdueCount);
            }
            
            new Notification(t('notificationTitle', language), {
              body,
              icon: "favicon.svg"
            });
            localStorage.setItem('todo_txt_last_briefing_date', todayStr);
          }
        }
      }

      if (!isLocalMode && navigator.onLine) {
        const syncTime = new Date().toISOString();
        localStorage.setItem('todo_txt_last_sync_timestamp', syncTime);
        setLastSyncTime(syncTime);
      }
    } catch (err: any) {
      if (currentView === 'archive' && err.message.includes('NO_FILE_SELECTED')) {
        setError(t('errorNoArchive', language));
      } else if (err.message === 'FILE_PERMISSION_REQUIRED' || err.message === 'ARCHIVE_FILE_PERMISSION_REQUIRED') {
        setError(err.message);
      } else if (err.message === 'WEBDAV_AUTH_FAILED') {
        setError('WebDAV: Authentifizierung fehlgeschlagen. Bitte Benutzername und Passwort prüfen.');
      } else if (err.message === 'WEBDAV_HTML_RESPONSE') {
        setError('WebDAV: Der Server hat eine HTML-Seite statt einer WebDAV-Antwort geliefert. Bitte prüfe die URL (korrekter Port, HTTPS).');
      } else if (err.message === 'WEBDAV_CONNECTION_FAILED') {
        setError('WebDAV: Verbindung fehlgeschlagen. Bitte URL und Netzwerkverbindung prüfen.');
      } else if (err.message === 'WEBDAV_NOT_CONFIGURED') {
        setError('WebDAV: Keine Verbindungsdaten konfiguriert. Bitte erneut anmelden.');
      } else if (err.message === 'GIT_NOT_CONFIGURED') {
        setError('GitHub: Keine Verbindungsdaten konfiguriert. Bitte erneut anmelden.');
      } else if (err.message === 'GDRIVE_NOT_AUTHENTICATED' || err.message === 'GDRIVE_TOKEN_EXPIRED') {
        setError('Google Drive: Nicht angemeldet oder Sitzung abgelaufen. Bitte erneut anmelden.');
      } else if (err.message?.includes('403')) {
        setError(`Google Drive: Zugriff verweigert (403). Details: ${err.message}. Bitte melde dich erneut an und stelle sicher, dass du auf dem Google-Consent-Bildschirm das Häkchen für den Drive-Dateizugriff gesetzt hast.`);
      } else if (err.message?.startsWith('CONFLICT:')) {
        setError(err.message);
      } else if (err.message?.startsWith('WEBDAV_ERROR:')) {
        const status = err.message.split(':')[1];
        setError(`WebDAV: Server-Fehler (HTTP ${status}). Bitte URL und Zugangsdaten prüfen.`);
      } else {
        setError(err.message || 'Fehler beim Laden der Aufgaben.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((activeSmartView === 'completed' || currentView === 'dashboard') && archivedTasks.length === 0 && !loadingArchive) {
      const loadArchive = async () => {
        try {
          setLoadingArchive(true);
          const content = await fetchArchiveContent(storageMode);
          const parsed = parseTodos(content);
          setArchivedTasks(parsed);
        } catch (e) {
          console.warn("Fehler beim Laden des Archivs für Smart-View oder Dashboard:", e);
        } finally {
          setLoadingArchive(false);
        }
      };
      loadArchive();
    }
  }, [activeSmartView, currentView, isLocalMode, archivedTasks.length, loadingArchive]);

  const saveTasks = async (newTasks: TodoTask[], bypassHistory = false) => {
    try {
      if (!bypassHistory) {
        pushToHistory(tasks, archivedTasks, currentView);
      }
      setTasks(newTasks);
      const content = serializeTodos(newTasks);
      if (currentView === 'todo') {
        const savedContent = await saveTodoContent(storageMode, content);
        if (savedContent !== content) {
          const parsed = parseTodos(savedContent);
          setTasks(parsed);
          showToast("Konflikt erkannt: Änderungen wurden automatisch zusammengeführt!");
        }
      } else {
        const savedContent = await saveArchiveContent(storageMode, content);
        if (savedContent !== content) {
          const parsed = parseTodos(savedContent);
          setTasks(parsed);
          showToast("Konflikt erkannt: Änderungen wurden automatisch zusammengeführt!");
        }
      }
      if (!isLocalMode && navigator.onLine) {
        const syncTime = new Date().toISOString();
        localStorage.setItem('todo_txt_last_sync_timestamp', syncTime);
        setLastSyncTime(syncTime);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Aufgaben.');
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    try {
      setLoading(true);
      setError(null);
      setTasks(previousState.tasks);
      setArchivedTasks(previousState.archivedTasks);
      setCurrentView(previousState.view);

      await saveTodoContent(storageMode, serializeTodos(previousState.tasks));
      await saveArchiveContent(storageMode, serializeTodos(previousState.archivedTasks));

      if (!isLocalMode && navigator.onLine) {
        const syncTime = new Date().toISOString();
        localStorage.setItem('todo_txt_last_sync_timestamp', syncTime);
        setLastSyncTime(syncTime);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Rückgängigmachen.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (rawText: string) => {
    setCurrentView('todo');
    
    let processedText = rawText;
    if (selectedProject && !processedText.includes(`+${selectedProject}`)) {
      processedText += ` +${selectedProject}`;
    }
    if (selectedContext && !processedText.includes(`@${selectedContext}`)) {
      processedText += ` @${selectedContext}`;
    }

    const { parseTask } = await import('../services/todoParser');
    const newTask = parseTask(processedText);
    if (autoAddCreationDate && !newTask.creationDate) {
      const { getTodayDate } = await import('../services/todoParser');
      newTask.creationDate = getTodayDate();
      newTask.originalText = `${newTask.creationDate} ${newTask.originalText}`;
    }
    await saveTasks([newTask, ...tasks]);
    showToast(t('toastTaskCreated', language, newTask.description));
    playTaskCreatedSound();
  };

  const handleToggleTask = async (taskId: string) => {
    const isArchiveTask = archivedTasks.some(t => t.id === taskId);
    if (isArchiveTask) {
      await handleRestore(taskId);
      return;
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskToToggle = tasks[taskIndex];
    let newTasks = [...tasks];

    if (!taskToToggle.isCompleted) {
      const resultingTasks = completeTask(taskToToggle);
      newTasks.splice(taskIndex, 1, ...resultingTasks);
      playTaskCompletedSound();
    } else {
      newTasks[taskIndex] = {
        ...taskToToggle,
        isCompleted: false,
        completionDate: null
      };
    }

    await saveTasks(newTasks);
  };

  const handleDeleteTask = async (taskId: string) => {
    const isArchiveTask = archivedTasks.some(t => t.id === taskId);
    if (isArchiveTask) {
      pushToHistory(tasks, archivedTasks, currentView);
      const newArchive = archivedTasks.filter(t => t.id !== taskId);
      setArchivedTasks(newArchive);
      await saveArchiveContent(storageMode, serializeTodos(newArchive));
    } else {
      const newTasks = tasks.filter(t => t.id !== taskId);
      await saveTasks(newTasks);
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDueDate: string | null) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const updatedTask = updateTaskDueDate(tasks[taskIndex], newDueDate);
    updatedTask.originalText = serializeTask(updatedTask);

    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;

    await saveTasks(newTasks);
  };

  const handleUpdateTaskText = async (taskId: string, newText: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const originalTask = tasks[taskIndex];
    const { parseTask, serializeTask: serializeTaskFn } = await import('../services/todoParser');
    
    // Parse den editierten Text direkt als todo.txt Zeile
    let textToParse = newText;
    if (originalTask.isCompleted && !textToParse.startsWith('x ')) {
      textToParse = `x ${originalTask.completionDate ? originalTask.completionDate + ' ' : ''}${textToParse}`;
    }
    
    const fullyParsed = parseTask(textToParse);
    fullyParsed.id = taskId;

    // Falls das Erstellungsdatum im editierten Text fehlt, aber vorher existierte, stellen wir es wieder her
    if (!fullyParsed.creationDate && originalTask.creationDate) {
      fullyParsed.creationDate = originalTask.creationDate;
      fullyParsed.originalText = serializeTaskFn(fullyParsed);
    }

    const newTasks = [...tasks];
    newTasks[taskIndex] = fullyParsed;

    await saveTasks(newTasks);
  };

  const handleMoveTask = async (taskId: string, targetColumnId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    let newTasks = [...tasks];
    let updatedTask = { ...task };

    const [groupType, columnValue] = targetColumnId.includes(':') 
      ? targetColumnId.split(':') 
      : [targetColumnId, ''];

    const { getTodayDate } = await import('../services/todoParser');
    const todayStr = getTodayDate();
    
    const getTomorrowStr = () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    };
    
    const getYesterdayStr = () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    };

    const getInDaysStr = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    };

    if (groupType === 'todo' || groupType === 'status' || groupType === 'doing' || groupType === 'done') {
      // Clean up any existing status tags
      if (updatedTask.tags['status']) {
        const newTags = { ...updatedTask.tags };
        delete newTags['status'];
        updatedTask.tags = newTags;
        updatedTask.description = updatedTask.description
          .replace(/\bstatus:\S+/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (groupType === 'done') {
        if (!updatedTask.isCompleted) {
          const { completeTask: completeTaskFn } = await import('../services/todoParser');
          const resultingTasks = completeTaskFn(updatedTask);
          resultingTasks.forEach(t => {
            t.originalText = serializeTask(t);
          });
          newTasks.splice(taskIndex, 1, ...resultingTasks);
          await saveTasks(newTasks);
          playTaskCompletedSound();
          return;
        }
      } else {
        updatedTask.isCompleted = false;
        updatedTask.completionDate = null;

        const targetStatus = groupType === 'status' ? columnValue : null;
        if (targetStatus) {
          updatedTask.tags = { ...updatedTask.tags, status: targetStatus };
          updatedTask.description = updatedTask.description.trim() 
            ? `${updatedTask.description.trim()} status:${targetStatus}` 
            : `status:${targetStatus}`;
        }
      }
    } else if (groupType === 'due') {
      let newDueDate: string | null = null;
      if (columnValue === 'today') newDueDate = todayStr;
      else if (columnValue === 'tomorrow') newDueDate = getTomorrowStr();
      else if (columnValue === 'overdue') {
        const currentDue = updatedTask.tags['due'];
        if (currentDue && currentDue < todayStr) {
          newDueDate = currentDue;
        } else {
          newDueDate = getYesterdayStr();
        }
      }
      else if (columnValue === 'soon') newDueDate = getInDaysStr(3);
      else if (columnValue === 'later') newDueDate = getInDaysStr(8);
      else if (columnValue === 'none') newDueDate = null;

      const { updateTaskDueDate: updateTaskDueDateFn } = await import('../services/todoParser');
      updatedTask = updateTaskDueDateFn(updatedTask, newDueDate);
    } else if (groupType === 'project') {
      const words = updatedTask.description.split(/\s+/);
      const cleanWords = words.filter(w => !(w.startsWith('+') && w.length > 1));
      
      if (columnValue && columnValue !== 'none') {
        cleanWords.push(`+${columnValue}`);
        updatedTask.projects = [columnValue];
      } else {
        updatedTask.projects = [];
      }
      updatedTask.description = cleanWords.join(' ').replace(/\s+/g, ' ').trim();
    } else if (groupType === 'context') {
      const words = updatedTask.description.split(/\s+/);
      const cleanWords = words.filter(w => !(w.startsWith('@') && w.length > 1));

      if (columnValue && columnValue !== 'none') {
        cleanWords.push(`@${columnValue}`);
        updatedTask.contexts = [columnValue];
      } else {
        updatedTask.contexts = [];
      }
      updatedTask.description = cleanWords.join(' ').replace(/\s+/g, ' ').trim();
    } else if (groupType === 'assignee') {
      const words = updatedTask.description.split(/\s+/);
      const cleanWords = words.filter(w => !w.startsWith('who:'));
      
      if (columnValue && columnValue !== 'none') {
        cleanWords.push(`who:${columnValue}`);
        updatedTask.tags = { ...updatedTask.tags, who: columnValue };
      } else {
        const newTags = { ...updatedTask.tags };
        delete newTags['who'];
        updatedTask.tags = newTags;
      }
      updatedTask.description = cleanWords.join(' ').replace(/\s+/g, ' ').trim();
    } else if (groupType === 'priority') {
      if (columnValue === 'none') {
        updatedTask.priority = null;
      } else if (columnValue === 'other') {
        if (updatedTask.priority && updatedTask.priority.localeCompare('C') > 0) {
          // keep existing other priority
        } else {
          updatedTask.priority = 'D';
        }
      } else {
        updatedTask.priority = columnValue;
      }
    }

    updatedTask.originalText = serializeTask(updatedTask);
    newTasks[taskIndex] = updatedTask;
    await saveTasks(newTasks);
  };

  const handleArchive = async () => {
    const completedTasks = tasks.filter(t => t.isCompleted);
    if (completedTasks.length === 0) return;
    
    try {
      setArchiving(true);
      setError(null);
      
      pushToHistory(tasks, archivedTasks, currentView);
      
      const contentToArchive = serializeTodos(completedTasks);
      await archiveTasks(storageMode, contentToArchive);
      
      const activeTasks = tasks.filter(t => !t.isCompleted);
      await saveTasks(activeTasks, true);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Archivieren.');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (taskId: string) => {
    const taskToRestore = tasks.find(t => t.id === taskId) || archivedTasks.find(t => t.id === taskId);
    if (!taskToRestore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      pushToHistory(tasks, archivedTasks, currentView);
      
      const contentToRestore = serializeTodos([taskToRestore]);
      await restoreTasks(storageMode, contentToRestore);
      
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
      const newTasks = tasks.filter(t => t.id !== taskId);
      await saveTasks(newTasks, true);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Wiederherstellen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveView = (name: string) => {
    if (!name.trim()) return;
    const newView: CustomView = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      project: selectedProject,
      context: selectedContext,
      searchQuery: inputText,
    };
    setCustomViews([...customViews, newView]);
  };

  const handleDeleteView = (id: string) => {
    setCustomViews(customViews.filter(v => v.id !== id));
  };

  const handleSelectView = (view: CustomView) => {
    setCurrentView('todo');
    setActiveSmartView(null);
    setSelectedProject(view.project);
    setSelectedContext(view.context);
    setSelectedAssignee(null);
    setInputText(view.searchQuery);
    setHideHidden(true);
    setIsSidebarOpen(false);
  };

  const handleSelectSmartView = (view: SmartViewType) => {
    setCurrentView('todo');
    setActiveSmartView(view);
    if (view === 'gtd-projects') {
      setHideHidden(false);
    } else {
      setHideHidden(true);
    }
    if (view) {
      if (view === 'family') {
        setLayoutMode('kanban');
      }
      setSelectedProject(null);
      setSelectedContext(null);
      setSelectedDue(null);
      setSelectedCreationDate(null);
      setSelectedThresholdDate(null);
      setSelectedCompletionDate(null);
      setSelectedAssignee(null);
      setInputText('');
    }
    setIsSidebarOpen(false);
  };

  const allProjects = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.flatMap(t => t.projects).forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [tasks]);

  const allContexts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.flatMap(t => t.contexts).forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [tasks]);

  const allAssignees = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.flatMap(t => t.tags['who'] ? t.tags['who'].split(',') : []).forEach(a => { counts[a] = (counts[a] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [tasks]);

  const effectiveGroupBy = useMemo(() => {
    if (activeSmartView === 'important') return 'priority';
    if (activeSmartView === 'all') return 'context';
    if (activeSmartView === 'family') return 'assignee';
    if (activeSmartView === 'gtd-projects') return 'none';
    if (activeSmartView === 'planned') return 'due';
    return groupBy;
  }, [activeSmartView, groupBy]);

  const effectiveSortBy = useMemo(() => {
    if (sortBy !== 'default') return sortBy;
    
    // Standardsortierung je nach Ansicht / Smart-View
    if (activeSmartView === 'important') return 'priority';
    if (activeSmartView === 'gtd-projects') return 'alphabetical';
    
    return 'priority'; // Allgemeiner Standard: zuerst Priorität, dann Fälligkeit
  }, [activeSmartView, sortBy]);

  const filteredTasks = useMemo(() => {
    const todayStr = (() => {
      const d = new Date();
      return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
    })();

    // Suchanfrage hat Priorität über alle anderen Filter
    if (inputText.trim()) {
      const query = inputText.toLowerCase().trim();
      return tasks.filter(task => task.originalText.toLowerCase().includes(query));
    }

    const baseFiltered = tasks.filter(task => {
      // Globaler Filter für erledigte Aufgaben (ausgenommen der "Abgeschlossen" Smart-View)
      if (activeSmartView !== 'completed' && hideCompleted && task.isCompleted) {
        return false;
      }

      // 1. Smart View Filter Override
      if (activeSmartView) {
        if (activeSmartView === 'my-day') {
          if (task.priority !== 'A' && task.tags['due'] !== todayStr) return false;
        } else if (activeSmartView === 'important') {
          if (!['A', 'B', 'C'].includes(task.priority || '')) return false;
        } else if (activeSmartView === 'planned') {
          if (!task.tags['due']) return false;
        } else if (activeSmartView === 'all') {
          // Keine weiteren Filter für "Alle" außer dem globalen hideCompleted
        } else if (activeSmartView === 'completed') {
          if (!task.isCompleted) return false;
        } else if (activeSmartView === 'assigned') {
          if (!task.tags['who'] || !task.tags['who'].split(',').includes('cornelius')) return false;
        } else if (activeSmartView === 'tasks-no-context') {
          if (task.contexts.length > 0) return false;
        } else if (activeSmartView === 'gtd-projects') {
          if (!task.projects.includes('gtd/projekt')) return false;
        } else if (activeSmartView === 'family') {
          if (!task.projects.includes('family')) return false;
        } else if (activeSmartView === 'future-threshold') {
          if (!task.tags['t'] || task.tags['t'] <= todayStr) return false;
        }
      } else {
        // Normal filters if no smart view is active
        if (selectedProject && !task.projects.includes(selectedProject)) return false;
        if (selectedContext && !task.contexts.includes(selectedContext)) return false;
        if (selectedAssignee && (!task.tags['who'] || !task.tags['who'].split(',').includes(selectedAssignee))) return false;
        if (selectedDue && task.tags['due'] !== selectedDue) return false;
        if (selectedCreationDate && task.creationDate !== selectedCreationDate) return false;
        if (selectedThresholdDate && task.tags['t'] !== selectedThresholdDate) return false;
        if (selectedCompletionDate && task.completionDate !== selectedCompletionDate) return false;
      }

      if (hideHidden && task.tags['h'] === '1' && activeSmartView !== 'gtd-projects') return false;
      if (hideFutureThreshold && task.tags['t'] && task.tags['t'] > todayStr && activeSmartView !== 'future-threshold') return false;
      if (hideFutureDue && task.tags['due'] && task.tags['due'] > todayStr) return false;

      return true;
    });

    if (activeSmartView === 'completed') {
      return [...baseFiltered, ...archivedTasks];
    }
    return baseFiltered;
  }, [tasks, archivedTasks, activeSmartView, selectedProject, selectedContext, inputText, hideCompleted, hideHidden, hideFutureThreshold, hideFutureDue, selectedDue, selectedCreationDate, selectedThresholdDate, selectedCompletionDate]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hasFileSelected) {
    if (isLocalMode) {
      return (
        <LocalPicker 
          onFileSelected={() => {
            setIsConfigLoaded(false);
            setHasFileSelected(true);
            loadTasks();
          }} 
          onCancel={onLogout}
        />
      );
    }
    if (isGitMode) {
      return (
        <GitPicker 
          onFileSelected={() => {
            setIsConfigLoaded(false);
            setHasFileSelected(true);
            loadTasks();
          }}
          onCancel={onLogout}
        />
      );
    }
    if (isWebDavMode) {
      return (
        <WebDavPicker 
          onFileSelected={() => {
            setIsConfigLoaded(false);
            setHasFileSelected(true);
            loadTasks();
          }} 
          onCancel={onLogout}
        />
      );
    }
    if (isGDriveMode) {
      return (
        <GoogleDrivePicker 
          onFileSelected={() => {
            setIsConfigLoaded(false);
            setHasFileSelected(true);
            loadTasks();
          }} 
          onCancel={onLogout}
        />
      );
    }
    return (
      <OneDrivePicker 
        onFileSelected={() => {
          setIsConfigLoaded(false);
          setHasFileSelected(true);
          loadTasks();
        }} 
        onCancel={onLogout}
      />
    );
  }

  if (isPickingArchive) {
    return (
      <OneDrivePicker 
        mode="archive" 
        onFileSelected={() => {
          setIsPickingArchive(false);
        }} 
        onCancel={() => {
          setIsPickingArchive(false);
        }}
      />
    );
  }

  const handleSwitchFile = () => {
    clearSelectedFile();
    localStorage.removeItem('todo_txt_gdrive_todo_id');
    localStorage.removeItem('todo_txt_gdrive_archive_id');
    setIsConfigLoaded(false);
    setHasFileSelected(false);
  };

  const handleGoHome = () => {
    setCurrentView('todo');
    setActiveSmartView(null);
    setHideHidden(true);
    setSelectedProject(null);
    setSelectedContext(null);
    setSelectedDue(null);
    setSelectedCreationDate(null);
    setSelectedThresholdDate(null);
    setSelectedCompletionDate(null);
    setSelectedAssignee(null);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-40 flex-shrink-0">
        <div className="w-full px-4 md:px-6 py-2.5 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
          
          <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-[248px] flex-shrink-0 md:pt-1">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap w-full">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-md text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer flex-shrink-0"
                aria-label="Menü öffnen"
              >
                <Menu size={18} />
              </button>
              <button
                onClick={handleGoHome}
                className="p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer flex-shrink-0 flex items-center justify-center"
                title={texts.logoTitle}
              >
                <img src="./favicon.png" className="w-6 h-6 object-contain" alt="Home" />
              </button>
               <h1 
                onClick={handleGoHome}
                className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent cursor-pointer select-none"
                title={texts.logoTitle}
              >
                Todo.txt
              </h1>
            </div>


          </div>

          {/* Central TodoInput component in header */}
          <div className="flex-1 w-full md:mx-4 z-10">
            <TodoInput 
              value={inputText}
              onChange={setInputText}
              onAdd={handleAddTask} 
              knownProjects={allProjects} 
              knownContexts={allContexts} 
              knownAssignees={allAssignees}
              language={language}
            />
          </div>

          {/* Right section: Sync status and desktop buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 md:pt-1 ml-auto md:ml-0 overflow-x-auto no-scrollbar max-w-full">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850">
                {storageMode === 'local' ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {isLocalFileLinked ? t('localFileMode', language) : t('browserStorageMode', language)}
                  </span>
                ) : (
                  <button 
                    onClick={handleSync}
                    disabled={syncing || !isOnline}
                    className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors cursor-pointer border-none bg-transparent p-0 font-semibold"
                    title="Jetzt synchronisieren"
                  >
                    <RefreshCw size={11} className={syncing ? "animate-spin text-indigo-500" : "text-slate-400"} />
                    {storageMode === 'webdav' ? (
                      <span>WebDAV Sync</span>
                    ) : storageMode === 'git' ? (
                      <span>GitHub Sync</span>
                    ) : storageMode === 'gdrive' ? (
                      <span>Google Drive Sync</span>
                    ) : (
                      <span>OneDrive Sync</span>
                    )}
                  </button>
                )}
              </div>
              {!isLocalMode && lastSyncTime && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">{t('lastSync', language)}: {formatSyncTime(lastSyncTime)}</span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>
              <button
                onClick={() => setIsHelpOpen(true)}
                className={`p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${isHelpOpen ? 'text-indigo-650 dark:text-indigo-400' : ''}`}
                title="Hilfe & Anleitung"
              >
                <HelpCircle size={18} />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${isSettingsOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                title="Einstellungen & Optionen"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 bg-black/45 z-25 md:hidden transition-opacity duration-300"
            aria-hidden="true"
          />
        )}
        <Sidebar 
          currentView={currentView}
          language={language}
          onViewChange={(view) => {
            setCurrentView(view);
            if (view === 'dashboard') {
              setActiveSmartView(null);
              setSelectedProject(null);
              setSelectedContext(null);
              setSelectedAssignee(null);
              setSelectedDue(null);
              setSelectedCreationDate(null);
              setSelectedThresholdDate(null);
              setSelectedCompletionDate(null);
            }
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedProject={selectedProject}
          selectedContext={selectedContext}
          onSelectProject={(p) => {
            setCurrentView('todo');
            setSelectedProject(p === selectedProject ? null : p);
            setActiveSmartView(null);
            setHideHidden(true);
            setSelectedAssignee(null);
            setIsSidebarOpen(false);
          }}
          onSelectContext={(c) => {
            setCurrentView('todo');
            setSelectedContext(c === selectedContext ? null : c);
            setActiveSmartView(null);
            setHideHidden(true);
            setSelectedAssignee(null);
            setIsSidebarOpen(false);
          }}
          selectedAssignee={selectedAssignee}
          onSelectAssignee={(a) => {
            setCurrentView('todo');
            setSelectedAssignee(a === selectedAssignee ? null : a);
            setActiveSmartView(null);
            setHideHidden(true);
            setSelectedProject(null);
            setSelectedContext(null);
            setIsSidebarOpen(false);
          }}
          customViews={customViews}
          activeSearchQuery={inputText}
          onSaveView={handleSaveView}
          onDeleteView={handleDeleteView}
          onSelectView={handleSelectView}
          showCreationDate={showCreationDate}
          onToggleShowCreationDate={setShowCreationDate}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          allTasks={tasks}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hideCompleted={hideCompleted}
          onToggleHideCompleted={setHideCompleted}
          hideHidden={hideHidden}
          onToggleHideHidden={setHideHidden}
          hideFutureThreshold={hideFutureThreshold}
          onToggleHideFutureThreshold={setHideFutureThreshold}
          hideFutureDue={hideFutureDue}
          onToggleHideFutureDue={setHideFutureDue}
          autoAddCreationDate={autoAddCreationDate}
          onToggleAutoAddCreationDate={setAutoAddCreationDate}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          storageMode={storageMode}
          onSwitchFile={handleSwitchFile}
          contextEmojis={contextEmojis}
          onUpdateContextEmoji={(ctx, emoji) => setContextEmojis(prev => ({ ...prev, [ctx]: emoji }))}
          onLogout={onLogout}
          isOnline={isOnline}
          syncing={syncing}
          hasPending={hasPending}
          onSync={handleSync}
          lastSyncTime={lastSyncTime}
          formatSyncTime={formatSyncTime}
          selectedDue={selectedDue}
          onSelectDue={(due) => {
            setSelectedDue(due);
            setIsSidebarOpen(false);
          }}
          selectedCreationDate={selectedCreationDate}
          onSelectCreationDate={(date) => {
            setSelectedCreationDate(date);
            setIsSidebarOpen(false);
          }}
          selectedThresholdDate={selectedThresholdDate}
          onSelectThresholdDate={(date) => {
            setSelectedThresholdDate(date);
            setIsSidebarOpen(false);
          }}
          selectedCompletionDate={selectedCompletionDate}
          onSelectCompletionDate={(date) => {
            setSelectedCompletionDate(date);
            setIsSidebarOpen(false);
          }}
          projectPreset={projectPreset}
          contextPreset={contextPreset}
          datePreset={datePreset}
          onProjectPresetChange={setProjectPreset}
          onContextPresetChange={setContextPreset}
          onDatePresetChange={setDatePreset}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          activeSmartView={activeSmartView}
          onSelectSmartView={handleSelectSmartView}
        />

        <div className={`flex-1 flex flex-col ${layoutMode === 'kanban' && currentView === 'todo' ? 'max-w-none px-4 md:px-6 overflow-hidden' : 'max-w-4xl mx-auto overflow-y-auto'} w-full p-4 md:p-6 relative`}>
          
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-sans">
              <span className="font-medium">
                {error === 'FILE_PERMISSION_REQUIRED' || error === 'ARCHIVE_FILE_PERMISSION_REQUIRED'
                  ? t('filePermissionRequiredToast', language)
                  : error}
              </span>
              {(error === 'FILE_PERMISSION_REQUIRED' || error === 'ARCHIVE_FILE_PERMISSION_REQUIRED') && (
                <button
                  onClick={async () => {
                    const type = error === 'FILE_PERMISSION_REQUIRED' ? 'todo' : 'archive';
                    const success = await requestFileHandlePermission(type);
                    if (success) {
                      loadTasks();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                >
                  {t('grantPermissionBtn', language)}
                </button>
              )}
            </div>
          )}

          <div className={`${layoutMode === 'kanban' && currentView === 'todo' ? 'mt-2 mb-2' : 'mt-2 mb-4'} flex justify-between items-center flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {currentView === 'todo' ? t('tasksTitle', language) : currentView === 'archive' ? t('archiveTitle', language) : t('dashboardTitle', language)}
              </h2>
              
              {currentView === 'todo' && (
                <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`p-1 rounded transition-colors cursor-pointer ${layoutMode === 'list' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    title="Listenansicht"
                  >
                    <Rows size={13} />
                  </button>
                  <button
                    onClick={() => setLayoutMode('kanban')}
                    className={`p-1 rounded transition-colors cursor-pointer ${layoutMode === 'kanban' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    title="Kanban-Board"
                  >
                    <LayoutGrid size={13} />
                  </button>
                </div>
              )}
            </div>

            {currentView !== 'dashboard' && (
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button 
                    onClick={handleUndo}
                    className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title={t('undoWithCount', language, history.length)}
                  >
                    <Undo size={15} />
                  </button>
                )}

                <div className="relative flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" title={`${t('sortLabel', language)}: ${sortBy === 'default' ? t('sortDefault', language) : sortBy === 'due' ? t('sortDue', language) : sortBy === 'priority' ? t('sortPriority', language) : sortBy === 'creation' ? t('sortCreation', language) : t('sortAlphabetical', language)}`}>
                  <ArrowUpDown size={15} className="text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="default" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('sortDefault', language)}</option>
                    <option value="due" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('sortDue', language)}</option>
                    <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('sortPriority', language)}</option>
                    <option value="creation" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('sortCreation', language)}</option>
                    <option value="alphabetical" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('sortAlphabetical', language)}</option>
                  </select>
                </div>

                <div className="relative flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" title={`${t('groupLabel', language)}: ${groupBy === 'none' ? t('groupNone', language) : groupBy === 'due' ? t('groupDue', language) : groupBy === 'priority' ? t('groupPriority', language) : groupBy === 'project' ? t('groupProject', language) : groupBy === 'context' ? t('groupContext', language) : t('groupAssignee', language)}`}>
                  <Layers size={15} className="text-slate-500" />
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="none" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupNone', language)}</option>
                    <option value="due" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupDue', language)}</option>
                    <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupPriority', language)}</option>
                    <option value="project" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupProject', language)}</option>
                    <option value="context" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupContext', language)}</option>
                    <option value="assignee" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t('groupAssignee', language)}</option>
                  </select>
                </div>

                {currentView === 'todo' && tasks.filter(t => t.isCompleted).length > 0 && (
                  <button 
                    onClick={handleArchive}
                    disabled={archiving}
                    className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-305 p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
                    title={archiving ? t('archiving', language) : t('archiveCompletedTitle', language, tasks.filter(t => t.isCompleted).length)}
                  >
                    <Archive size={16} className={archiving ? 'animate-pulse text-indigo-500 dark:text-indigo-400' : ''} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className={`transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''} ${layoutMode === 'kanban' && currentView === 'todo' ? 'flex-1 min-h-0 flex flex-col' : 'h-full'}`}>
            {currentView === 'dashboard' ? (
              <DashboardView 
                tasks={tasks}
                archivedTasks={archivedTasks}
                projectPreset={projectPreset}
                contextPreset={contextPreset}
                language={language}
              />
            ) : layoutMode === 'kanban' && currentView === 'todo' ? (
              <KanbanBoard 
                tasks={filteredTasks}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateTaskText={handleUpdateTaskText}
                onMoveTask={handleMoveTask}
                knownProjects={allProjects}
                knownContexts={allContexts}
                knownAssignees={allAssignees}
                showCreationDate={showCreationDate}
                groupBy={effectiveGroupBy}
                projectPreset={projectPreset}
                contextPreset={contextPreset}
                datePreset={datePreset}
                contextEmojis={contextEmojis}
                onAddTask={handleAddTask}
                activeSmartView={activeSmartView}
                language={language}
              />
            ) : (
               <TodoList 
                tasks={filteredTasks} 
                onToggle={handleToggleTask} 
                onDelete={handleDeleteTask}
                onRestore={currentView === 'archive' || activeSmartView === 'completed' ? handleRestore : undefined}
                onUpdateDueDate={handleUpdateDueDate}
                onUpdateTaskText={handleUpdateTaskText}
                knownProjects={allProjects}
                knownContexts={allContexts}
                knownAssignees={allAssignees}
                showCreationDate={showCreationDate}
                groupBy={effectiveGroupBy}
                sortBy={effectiveSortBy}
                projectPreset={projectPreset}
                contextPreset={contextPreset}
                datePreset={datePreset}
                contextEmojis={contextEmojis}
                activeSmartView={activeSmartView}
                onAddTask={handleAddTask}
                language={language}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 py-2.5 px-4 flex items-center justify-around z-20 flex-shrink-0">
        <button
          onClick={() => {
            setCurrentView('todo');
            setActiveSmartView(null);
            setIsSidebarOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            currentView === 'todo' && !activeSmartView
              ? 'text-indigo-650 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-255'
          }`}
        >
          <Rows size={18} />
          <span className="text-[10px] tracking-wide font-sans">{texts.tasks}</span>
        </button>
        
        <button
          onClick={() => {
            setCurrentView('dashboard');
            setIsSidebarOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            currentView === 'dashboard'
              ? 'text-indigo-650 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-255'
          }`}
        >
          <LayoutGrid size={18} />
          <span className="text-[10px] tracking-wide font-sans">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setIsHelpOpen(true);
            setIsSidebarOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            isHelpOpen
              ? 'text-indigo-650 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-255'
          }`}
        >
          <HelpCircle size={18} />
          <span className="text-[10px] tracking-wide font-sans">{texts.help}</span>
        </button>

        <button
          onClick={() => {
            setIsSettingsOpen(true);
            setIsSidebarOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            isSettingsOpen
              ? 'text-indigo-650 dark:text-indigo-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-255'
          }`}
        >
          <Settings size={18} />
          <span className="text-[10px] tracking-wide font-sans">{t('settingsTitle', language)}</span>
        </button>
      </div>

      {/* Responsive Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} />
          
          <div className="settings-modal relative z-10 w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up text-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-205 flex items-center gap-2">
                <Settings size={20} className="text-indigo-500 animate-[spin_4s_linear_infinite]" /> {t('settingsTitle', language)}
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs sm:text-sm font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                {t('ready', language)}
              </button>
            </div>

            {/* Split layout: tabs sidebar/header + scrollable content */}
            <div className="flex flex-col sm:flex-row flex-1 overflow-hidden min-h-0">
              {/* Tab Navigation */}
              {/* Mobile: Horizontal scrollable row, Desktop: Vertical sidebar */}
              <div className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-slate-250/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-2 sm:p-4 gap-1.5 flex-shrink-0 w-full sm:w-52 no-scrollbar">
                <button
                  onClick={() => setActiveSettingsTab('general')}
                  className={`flex items-center gap-2 px-3 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeSettingsTab === 'general'
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Sliders size={16} />
                  <span>Allgemein</span>
                </button>
                <button
                  onClick={() => setActiveSettingsTab('accents')}
                  className={`flex items-center gap-2 px-3 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeSettingsTab === 'accents'
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Palette size={16} />
                  <span>Farben & Emojis</span>
                </button>
                <button
                  onClick={() => setActiveSettingsTab('files')}
                  className={`flex items-center gap-2 px-3 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeSettingsTab === 'files'
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Database size={16} />
                  <span>Cloud & Dateien</span>
                </button>
                <button
                  onClick={() => setActiveSettingsTab('filters')}
                  className={`flex items-center gap-2 px-3 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeSettingsTab === 'filters'
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Filter size={16} />
                  <span>Filter & Ansicht</span>
                </button>
              </div>

              {/* Tab Content Panel */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                
                {/* 1. GENERAL SETTINGS */}
                {activeSettingsTab === 'general' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Language Switcher */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe size={13} className="text-indigo-500" />
                        {t('languageLabel', language)}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                        <option value="la">Latina (Latein)</option>
                        <option value="fr">Français (Französisch)</option>
                        <option value="it">Italiano (Italienisch)</option>
                        <option value="es">Español (Spanisch)</option>
                        <option value="zh">中文 (Mandarin)</option>
                        <option value="ar">العربية (Arabisch)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="pt">Português (Portugiesisch)</option>
                        <option value="sw">Schwäbisch</option>
                        <option value="uk">Українська (Ukrainisch)</option>
                        <option value="he">עברית (Hebräisch)</option>
                        <option value="el">Ελληνικά (Griechisch)</option>
                        <option value="tr">Türkçe (Türkisch)</option>
                      </select>
                    </div>

                    {/* Theme Switcher */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('themeLabel', language)}
                      </label>
                      <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl p-1 w-full gap-1">
                        {(['light', 'dark', 'system'] as const).map((tName) => (
                          <button
                            key={tName}
                            onClick={() => handleThemeChange(tName)}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                              currentTheme === tName
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                          >
                            {tName === 'light' ? t('themeLight', language) : tName === 'dark' ? t('themeDark', language) : t('themeSystem', language)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Design Density Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('densityLabel', language)}
                      </label>
                      <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl p-1 w-full gap-1">
                        {(['loose', 'normal', 'compact'] as const).map((dName) => (
                          <button
                            key={dName}
                            onClick={() => handleDensityChange(dName)}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                              currentDensity === dName
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                          >
                            {dName === 'loose' ? t('densityLoose', language) : dName === 'normal' ? t('densityNormal', language) : t('densityCompact', language)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* System-Benachrichtigungen */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-750 dark:text-slate-200">{t('notificationsLabel', language)}</span>
                        <button
                          onClick={() => handleToggleNotifications(!notificationsEnabled)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        {t('notificationsDesc', language)}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. COLORS & EMOJIS */}
                {activeSettingsTab === 'accents' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Farbakzente bearbeiten */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette size={13} className="text-indigo-500" />
                        {t('colorAccentsLabel', language)}
                      </span>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{t('projectsAccent', language)}</span>
                          <select 
                            value={projectPreset} 
                            onChange={(e) => setProjectPreset(e.target.value)}
                            className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-100 text-xs font-semibold cursor-pointer"
                          >
                            <option value="purple">{colors.purple}</option>
                            <option value="blue">{colors.blue}</option>
                            <option value="indigo">Indigo</option>
                            <option value="pink">Pink</option>
                            <option value="rose">Rose</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{t('contextsAccent', language)}</span>
                          <select 
                            value={contextPreset} 
                            onChange={(e) => setContextPreset(e.target.value)}
                            className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-100 text-xs font-semibold cursor-pointer"
                          >
                            <option value="emerald">{colors.emerald}</option>
                            <option value="teal">Teal</option>
                            <option value="cyan">Cyan</option>
                            <option value="orange">{colors.orange}</option>
                            <option value="amber">{colors.amber}</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-700 dark:text-slate-200 font-medium">{t('datesAccent', language)}</span>
                          <select 
                            value={datePreset} 
                            onChange={(e) => setDatePreset(e.target.value)}
                            className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-slate-100 text-xs font-semibold cursor-pointer"
                          >
                            <option value="slate">{colors.slate}</option>
                            <option value="zinc">{colors.zinc}</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Kontext Emojis */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Smile size={13} className="text-indigo-500" />
                        {t('contextEmojisLabel', language)}
                      </span>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {allContexts.length === 0 ? (
                          <p className="text-slate-400 italic text-xs text-center py-4">{texts.noContexts}</p>
                        ) : (
                          allContexts.map(ctx => (
                            <div key={ctx} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-slate-750 dark:text-slate-200 font-bold">@{ctx}</span>
                              <input
                                type="text"
                                value={contextEmojis[ctx] || ''}
                                onChange={(e) => setContextEmojis(prev => ({ ...prev, [ctx]: e.target.value }))}
                                placeholder="..."
                                className="w-16 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CLOUD & FILES */}
                {activeSettingsTab === 'files' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi size={13} className="text-indigo-500" /> {t('cloudAndFilesLabel', language)}
                      </span>
                      <div className="text-sm space-y-3 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                          <span>{t('modeLabel', language)}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {storageMode === 'local' ? (isLocalFileLinked ? t('localFileMode', language) : t('browserStorageMode', language)) : storageMode === 'webdav' ? 'WebDAV' : storageMode === 'git' ? 'GitHub' : storageMode === 'gdrive' ? 'Google Drive' : t('cloudMode', language)}
                          </span>
                        </div>
                        
                        {storageMode === 'onedrive' && (
                          <>
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2.5">
                              <span>{t('syncTimeLabel', language)}</span>
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{formatSyncTime(lastSyncTime)}</span>
                            </div>
                            <button
                              onClick={handleSync}
                              disabled={syncing || !isOnline}
                              className="w-full text-sm bg-indigo-650 hover:bg-indigo-700 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 py-3 rounded-xl font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                              {syncing ? t('syncingStatus', language) : hasPending ? t('syncPendingStatus', language) : t('syncButton', language)}
                            </button>
                          </>
                        )}
                        
                        {storageMode === 'webdav' && (
                          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-1 space-y-3">
                            <span className="font-bold text-slate-700 dark:text-slate-350">WebDAV Verbindung</span>
                            <div className="space-y-1 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Server-URL</div>
                              <div className="text-xs text-slate-700 dark:text-slate-250 truncate select-all font-mono">
                                {getWebDavCredentials().url}
                              </div>
                            </div>
                            <div className="space-y-1 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Benutzername</div>
                              <div className="text-xs text-slate-700 dark:text-slate-250 truncate">
                                {getWebDavCredentials().user}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {storageMode === 'git' && (
                          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-1 space-y-3">
                            <span className="font-bold text-slate-700 dark:text-slate-350">GitHub Verbindung</span>
                            <div className="space-y-1 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Repository</div>
                              <div className="text-xs text-slate-700 dark:text-slate-250 truncate font-mono">
                                {getGitCredentials().repo} ({getGitCredentials().branch})
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isLocalMode && (
                          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 mt-1 space-y-4">
                            {/* Manual Import/Export */}
                            <div className="space-y-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Datei Import / Export</span>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                                  <label className="block text-xs text-slate-450 font-bold uppercase tracking-wider text-center">todo.txt</label>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => handleExportFile('todo')}
                                      className="w-full text-xs bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl font-bold transition-colors cursor-pointer text-center"
                                    >
                                      Export
                                    </button>
                                    <label className="w-full text-xs bg-white dark:bg-slate-855 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-205 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer text-center flex items-center justify-center">
                                      Import
                                      <input
                                        type="file"
                                        accept=".txt"
                                        onChange={(e) => handleImportFile(e, 'todo')}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                                  <label className="block text-xs text-slate-450 font-bold uppercase tracking-wider text-center">archive.txt</label>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => handleExportFile('archive')}
                                      className="w-full text-xs bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl font-bold transition-colors cursor-pointer text-center"
                                    >
                                      Export
                                    </button>
                                    <label className="w-full text-xs bg-white dark:bg-slate-855 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-205 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer text-center flex items-center justify-center">
                                      Import
                                      <input
                                        type="file"
                                        accept=".txt"
                                        onChange={(e) => handleImportFile(e, 'archive')}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Direct File System Sync */}
                            <div className="space-y-2 pt-3 border-t border-slate-205 dark:border-slate-800/80">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-750 dark:text-slate-300">Direkte Datei-Verknüpfung</span>
                                {isElectron ? (
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    Permanent
                                  </span>
                                ) : !('showOpenFilePicker' in window) && (
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-705 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    PWA Limitation
                                  </span>
                                )}
                              </div>

                              {isElectron || 'showOpenFilePicker' in window ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="truncate pr-2">
                                      <div className="text-[9px] text-slate-400 uppercase font-bold">todo.txt</div>
                                      <div
                                        className="text-xs font-bold text-slate-700 dark:text-slate-250 truncate"
                                        title={isElectron ? todoFilePath || '' : ''}
                                      >
                                        {todoFileName
                                          ? isElectron ? todoFilePath || todoFileName : todoFileName
                                          : t('fileNotLinkedStatus', language)}
                                      </div>
                                    </div>
                                    {todoFileName ? (
                                      <button
                                        onClick={() => handleUnlinkFile('todo')}
                                        className="text-xs text-red-600 dark:text-red-405 hover:underline font-bold cursor-pointer flex-shrink-0"
                                      >
                                        Trennen
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleLinkFile('todo')}
                                        className="text-xs text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer flex-shrink-0 font-bold"
                                      >
                                        {t('linkTodoLabel', language)}
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="truncate pr-2">
                                      <div className="text-[9px] text-slate-400 uppercase font-bold">archive.txt</div>
                                      <div
                                        className="text-xs font-bold text-slate-700 dark:text-slate-250 truncate"
                                        title={isElectron ? archiveFilePath || '' : ''}
                                      >
                                        {archiveFileName
                                          ? isElectron ? archiveFilePath || archiveFileName : archiveFileName
                                          : t('fileNotLinkedStatus', language)}
                                      </div>
                                    </div>
                                    {archiveFileName ? (
                                      <button
                                        onClick={() => handleUnlinkFile('archive')}
                                        className="text-xs text-red-600 dark:text-red-405 hover:underline font-bold cursor-pointer flex-shrink-0"
                                      >
                                        Trennen
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleLinkFile('archive')}
                                        className="text-xs text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer flex-shrink-0 font-bold"
                                      >
                                        {t('linkArchiveLabel', language)}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-855">
                                  {t('browserFileApiNotSupported', language)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3 pt-3">
                          {(storageMode === 'onedrive' || storageMode === 'gdrive') && (
                            <button
                              onClick={handleSwitchFile}
                              className="flex-1 text-xs bg-white dark:bg-slate-900 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold transition-all cursor-pointer text-center"
                            >
                              {t('switch', language)}
                            </button>
                          )}
                          <button
                            onClick={onLogout}
                            className="flex-1 text-xs bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-655 dark:text-red-400 py-3 rounded-xl border border-red-200/50 dark:border-red-900/30 font-bold transition-all cursor-pointer text-center"
                          >
                            {storageMode === 'local' ? t('back', language) : (storageMode === 'webdav' || storageMode === 'git' || storageMode === 'gdrive') ? 'Trennen' : t('logout', language)}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. FILTERS & VIEWS */}
                {activeSettingsTab === 'filters' && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                      <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter size={13} /> {t('filtersTitle', language)}
                      </span>
                      <div className="space-y-3">
                        {[
                          { key: 'hideCompleted', checked: hideCompleted, onChange: (val: boolean) => setHideCompleted(val), label: t('hideCompleted', language), tooltip: '' },
                          { key: 'hideHidden', checked: hideHidden, onChange: (val: boolean) => setHideHidden(val), label: t('hideHidden', language), tooltip: 'Aufgaben mit h:1 ausblenden' },
                          { key: 'hideFutureThreshold', checked: hideFutureThreshold, onChange: (val: boolean) => setHideFutureThreshold(val), label: t('hideFutureThreshold', language), tooltip: 'Zukünftige Startdaten (t:YYYY-MM-DD) ausblenden' },
                          { key: 'hideFutureDue', checked: hideFutureDue, onChange: (val: boolean) => setHideFutureDue(val), label: t('hideFutureDue', language), tooltip: 'Zukünftige Fälligkeiten (due:YYYY-MM-DD) ausblenden' },
                        ].map((fItem) => (
                          <label key={fItem.key} className="flex items-center gap-3 bg-white dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-850/50 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 cursor-pointer select-none transition-colors" title={fItem.tooltip}>
                            <input
                              type="checkbox"
                              checked={fItem.checked}
                              onChange={(e) => fItem.onChange(e.target.checked)}
                              className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500 w-5 h-5 cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-semibold text-slate-750 dark:text-slate-200">{fItem.label}</span>
                          </label>
                        ))}

                        <div className="border-t border-slate-205 dark:border-slate-805/80 my-3 pt-3 space-y-3">
                          {[
                            { key: 'showCreationDate', checked: showCreationDate, onChange: (val: boolean) => setShowCreationDate(val), label: t('showCreationDate', language) },
                            { key: 'autoAddCreationDate', checked: autoAddCreationDate, onChange: (val: boolean) => setAutoAddCreationDate(val), label: t('autoAddCreationDate', language) },
                          ].map((cItem) => (
                            <label key={cItem.key} className="flex items-center gap-3 bg-white dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-850/50 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 cursor-pointer select-none transition-colors">
                              <input
                                type="checkbox"
                                checked={cItem.checked}
                                onChange={(e) => cItem.onChange(e.target.checked)}
                                className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-655 focus:ring-indigo-500 w-5 h-5 cursor-pointer accent-indigo-600"
                              />
                              <span className="text-sm font-semibold text-slate-750 dark:text-slate-200">{cItem.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500/20 animate-fade-in transition-all">
          <CheckCircle size={15} className="flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-1.5 text-white/80 hover:text-white cursor-pointer font-bold text-sm leading-none focus:outline-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} language={language} />
    </div>
  );
};
