import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, User, Tag, X, Bookmark, Repeat, EyeOff, Clock } from 'lucide-react';
import { parseTask } from '../services/todoParser';
import type { TodoTask } from '../services/todoParser';
import { PROJECT_COLOR_PRESETS, CONTEXT_COLOR_PRESETS } from '../utils/themeStyles';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface TaskEditorProps {
  initialTask?: TodoTask;
  onSave: (taskText: string) => void;
  onCancel: () => void;
  knownProjects: string[];
  knownContexts: string[];
  knownAssignees: string[];
  isInline?: boolean;
  contextEmojis?: Record<string, string>;
  projectPreset?: string;
  contextPreset?: string;
  language: Language;
}

// Helper functions for precise string updates within the raw todo.txt line
const updatePriorityInText = (text: string, newPriority: string | null): string => {
  let clean = text.trim();
  let completionPrefix = '';

  if (clean.startsWith('x ')) {
    const matches = clean.match(/^x\s+(\d{4}-\d{2}-\d{2}\s+)?(\d{4}-\d{2}-\d{2}\s+)?/);
    if (matches) {
      completionPrefix = matches[0];
      clean = clean.substring(completionPrefix.length);
    } else {
      completionPrefix = 'x ';
      clean = clean.substring(2);
    }
  }

  // Remove existing priority prefix (e.g. "(A) ")
  clean = clean.replace(/^\(([A-Z])\)\s*/, '');

  if (newPriority) {
    clean = `(${newPriority}) ${clean}`;
  }

  return (completionPrefix + clean).trim();
};

const updateDueDateInText = (text: string, newDueDate: string | null): string => {
  let clean = text.trim();
  const dueRegex = /\bdue:\S+/g;
  if (newDueDate) {
    if (dueRegex.test(clean)) {
      clean = clean.replace(dueRegex, `due:${newDueDate}`);
    } else {
      clean = `${clean} due:${newDueDate}`;
    }
  } else {
    clean = clean.replace(dueRegex, '').replace(/\s+/g, ' ').trim();
  }
  return clean;
};

const updateAssigneeInText = (text: string, newAssignee: string | null): string => {
  let clean = text.trim();
  const whoRegex = /\bwho:\S+/g;
  if (newAssignee) {
    if (whoRegex.test(clean)) {
      clean = clean.replace(whoRegex, `who:${newAssignee}`);
    } else {
      clean = `${clean} who:${newAssignee}`;
    }
  } else {
    clean = clean.replace(whoRegex, '').replace(/\s+/g, ' ').trim();
  }
  return clean;
};

const updateTagInText = (text: string, key: string, value: string | null): string => {
  let clean = text.trim();
  const tagRegex = new RegExp(`\\b${key}:\\S+`, 'g');
  if (value) {
    if (tagRegex.test(clean)) {
      clean = clean.replace(tagRegex, `${key}:${value}`);
    } else {
      clean = `${clean} ${key}:${value}`;
    }
  } else {
    clean = clean.replace(tagRegex, '').replace(/\s+/g, ' ').trim();
  }
  return clean;
};

const addProjectToText = (text: string, project: string): string => {
  let clean = text.trim();
  const projPattern = new RegExp(`\\+${project}\\b`, 'i');
  if (!projPattern.test(clean)) {
    clean = `${clean} +${project}`;
  }
  return clean;
};

const removeProjectFromText = (text: string, project: string): string => {
  let clean = text.trim();
  const projPattern = new RegExp(`\\+${project}\\b`, 'gi');
  clean = clean.replace(projPattern, '').replace(/\s+/g, ' ').trim();
  return clean;
};

const addContextToText = (text: string, context: string): string => {
  let clean = text.trim();
  const ctxPattern = new RegExp(`@${context}\\b`, 'i');
  if (!ctxPattern.test(clean)) {
    clean = `${clean} @${context}`;
  }
  return clean;
};

const removeContextFromText = (text: string, context: string): string => {
  let clean = text.trim();
  const ctxPattern = new RegExp(`@${context}\\b`, 'gi');
  clean = clean.replace(ctxPattern, '').replace(/\s+/g, ' ').trim();
  return clean;
};

const localTexts = {
  de: {
    editTask: 'Aufgabe bearbeiten',
    description: 'Beschreibung',
    priority: 'Priorität',
    visibility: 'Sichtbarkeit',
    taskHidden: 'Aufgabe versteckt (h:1)',
    hideTask: 'Aufgabe verstecken',
    todo: 'Zu tun',
    dueDate: 'Fällig am',
    plus1Week: '+1 Woche',
    startDate: 'Startdatum (t:)',
    assignee: 'Zuständigkeit',
    recurrence: 'Wiederholung (rec)',
    recurrencePlaceholder: 'z.B. 1d, +1w, 2m',
    projects: 'Projekte',
    contexts: 'Kontexte',
    suggestions: 'Vorschläge:'
  },
  en: {
    editTask: 'Edit Task',
    description: 'Description',
    priority: 'Priority',
    visibility: 'Visibility',
    taskHidden: 'Task hidden (h:1)',
    hideTask: 'Hide task',
    todo: 'To do',
    dueDate: 'Due date',
    plus1Week: '+1 week',
    startDate: 'Start date (t:)',
    assignee: 'Assignee',
    recurrence: 'Recurrence (rec)',
    recurrencePlaceholder: 'e.g. 1d, +1w, 2m',
    projects: 'Projects',
    contexts: 'Contexts',
    suggestions: 'Suggestions:'
  },
  la: {
    editTask: 'Recensere Pensum',
    description: 'Descriptio',
    priority: 'Prioritas',
    visibility: 'Visibilitas',
    taskHidden: 'Pensum occultum (h:1)',
    hideTask: 'Celare pensum',
    todo: 'Agendum',
    dueDate: 'Dies Finitus',
    plus1Week: '+1 Septimana',
    startDate: 'Dies Initii (t:)',
    assignee: 'Curator',
    recurrence: 'Repetitio (rec)',
    recurrencePlaceholder: 'ex. 1d, +1w, 2m',
    projects: 'Proiecta',
    contexts: 'Contextus',
    suggestions: 'Consilia:'
  },
  fr: {
    editTask: 'Modifier la tâche',
    description: 'Description',
    priority: 'Priorité',
    visibility: 'Visibilité',
    taskHidden: 'Tâche cachée (h:1)',
    hideTask: 'Cacher la tâche',
    todo: 'À faire',
    dueDate: 'Date d\'échéance',
    plus1Week: '+1 semaine',
    startDate: 'Date de début (t:)',
    assignee: 'Responsable',
    recurrence: 'Récurrence (rec)',
    recurrencePlaceholder: 'ex. 1d, +1w, 2m',
    projects: 'Projets',
    contexts: 'Contextes',
    suggestions: 'Suggestions :'
  },
  it: {
    editTask: 'Modifica attività',
    description: 'Descrizione',
    priority: 'Priorità',
    visibility: 'Visibilità',
    taskHidden: 'Attività nascosta (h:1)',
    hideTask: 'Nascondi attività',
    todo: 'Da fare',
    dueDate: 'Scadenza',
    plus1Week: '+1 settimana',
    startDate: 'Data d\'inizio (t:)',
    assignee: 'Assegnatario',
    recurrence: 'Ricorrenza (rec)',
    recurrencePlaceholder: 'es. 1d, +1w, 2m',
    projects: 'Progetti',
    contexts: 'Contesti',
    suggestions: 'Suggerimenti:'
  },
  es: {
    editTask: 'Editar tarea',
    description: 'Descripción',
    priority: 'Prioridad',
    visibility: 'Visibilidad',
    taskHidden: 'Tarea oculta (h:1)',
    hideTask: 'Ocultar tarea',
    todo: 'Por hacer',
    dueDate: 'Fecha vencimiento',
    plus1Week: '+1 semana',
    startDate: 'Fecha inicio (t:)',
    assignee: 'Asignado',
    recurrence: 'Recurrencia (rec)',
    recurrencePlaceholder: 'ej. 1d, +1w, 2m',
    projects: 'Proyectos',
    contexts: 'Contextos',
    suggestions: 'Sugerencias:'
  },
  zh: {
    editTask: '编辑任务',
    description: '描述',
    priority: '优先级',
    visibility: '可见性',
    taskHidden: '任务已屏蔽 (h:1)',
    hideTask: '隐藏任务',
    todo: '待办',
    dueDate: '截止日期',
    plus1Week: '+1周',
    startDate: '开始日期 (t:)',
    assignee: '指派人',
    recurrence: '重复周期 (rec)',
    recurrencePlaceholder: '例如：1d, +1w, 2m',
    projects: '项目列表',
    contexts: '情境列表',
    suggestions: '候选建议:'
  },
  ar: {
    editTask: 'تعديل المهمة',
    description: 'الوصف',
    priority: 'الأولوية',
    visibility: 'الظهور',
    taskHidden: 'المهمة مخفية (h:1)',
    hideTask: 'إخفاء المهمة',
    todo: 'للقيام به',
    dueDate: 'تاريخ الاستحقاق',
    plus1Week: '+أسبوع واحد',
    startDate: 'تاريخ البدء (t:)',
    assignee: 'المسؤول',
    recurrence: 'التكرار (rec)',
    recurrencePlaceholder: 'مثال: 1d, +1w, 2m',
    projects: 'المشاريع',
    contexts: 'السياقات',
    suggestions: 'اقتراحات:'
  },
  hi: {
    editTask: 'कार्य संपादित करें',
    description: 'विवरण',
    priority: 'प्राथमिकता',
    visibility: 'दृश्यता',
    taskHidden: 'कार्य छिपा हुआ (h:1)',
    hideTask: 'कार्य छुपाएं',
    todo: 'करने योग्य',
    dueDate: 'नियत तिथि',
    plus1Week: '+1 सप्ताह',
    startDate: 'आरंभ तिथि (t:)',
    assignee: 'सौंपा गया व्यक्ति',
    recurrence: 'पुनरावृत्ति (rec)',
    recurrencePlaceholder: 'जैसे 1d, +1w, 2m',
    projects: 'परियोजनाएं',
    contexts: 'संदर्भ',
    suggestions: 'सुझाव:'
  },
  pt: {
    editTask: 'Editar tarefa',
    description: 'Descrição',
    priority: 'Prioridade',
    visibility: 'Visibilidade',
    taskHidden: 'Tarefa oculta (h:1)',
    hideTask: 'Ocultar tarefa',
    todo: 'A fazer',
    dueDate: 'Vencimento',
    plus1Week: '+1 semana',
    startDate: 'Data de início (t:)',
    assignee: 'Responsável',
    recurrence: 'Recorrência (rec)',
    recurrencePlaceholder: 'ex. 1d, +1w, 2m',
    projects: 'Projetos',
    contexts: 'Contextos',
    suggestions: 'Sugestões:'
  },
  sw: {
    editTask: 'Uffgab bearbeita',
    description: 'Beschreibung',
    priority: 'Priorität',
    visibility: 'Sichtbarkeit',
    taskHidden: 'Uffgab versteckt (h:1)',
    hideTask: 'Uffgab verstecka',
    todo: 'Zu tun',
    dueDate: 'Fällig am',
    plus1Week: '+1 Woch',
    startDate: 'Startdatum (t:)',
    assignee: 'Zuständigkeit',
    recurrence: 'Wiederholung (rec)',
    recurrencePlaceholder: 'z.B. 1d, +1w, 2m',
    projects: 'Projekte',
    contexts: 'Kontexte',
    suggestions: 'Vorschläg:'
  },
  uk: {
    editTask: 'Редагувати завдання',
    description: 'Опис',
    priority: 'Пріоритет',
    visibility: 'Видимість',
    taskHidden: 'Завдання приховано (h:1)',
    hideTask: 'Приховати завдання',
    todo: 'Зробити',
    dueDate: 'Термін виконання',
    plus1Week: '+1 тиждень',
    startDate: 'Дата початку (t:)',
    assignee: 'Виконавець',
    recurrence: 'Повторення (rec)',
    recurrencePlaceholder: 'напр. 1d, +1w, 2m',
    projects: 'Проєкти',
    contexts: 'Контексти',
    suggestions: 'Пропозиції:'
  },
  he: {
    editTask: 'ערוך משימה',
    description: 'תיאור',
    priority: 'עדיפות',
    visibility: 'נראות',
    taskHidden: 'משימה מוסרת (h:1)',
    hideTask: 'הסתר משימה',
    todo: 'לביצוע',
    dueDate: 'תאריך יעד',
    plus1Week: '+שבוע אחד',
    startDate: 'תאריך התחלה (t:)',
    assignee: 'אחראי',
    recurrence: 'חזרה (rec)',
    recurrencePlaceholder: 'למשל: 1d, +1w, 2m',
    projects: 'פרויקטים',
    contexts: 'הקשרים',
    suggestions: 'הצעות:'
  },
  el: {
    editTask: 'Επεξεργασία εργασίας',
    description: 'Περιγραφή',
    priority: 'Προτεραιότητα',
    visibility: 'Ορατότητα',
    taskHidden: 'Εργασία κρυφή (h:1)',
    hideTask: 'Απόκρυψη εργασίας',
    todo: 'Προς υλοποίηση',
    dueDate: 'Ημερομηνία λήξης',
    plus1Week: '+1 εβδομάδα',
    startDate: 'Ημερομηνία έναρξης (t:)',
    assignee: 'Υπεύθυνος',
    recurrence: 'Επανάληψη (rec)',
    recurrencePlaceholder: 'π.χ. 1d, +1w, 2m',
    projects: 'Έργα',
    contexts: 'Πλαίσια',
    suggestions: 'Προτάσεις:'
  },
  tr: {
    editTask: 'Görevi Düzenle',
    description: 'Açıklama',
    priority: 'Öncelik',
    visibility: 'Görünürlük',
    taskHidden: 'Görev gizlendi (h:1)',
    hideTask: 'Görevi gizle',
    todo: 'Yapılacak',
    dueDate: 'Vade Tarihi',
    plus1Week: '+1 hafta',
    startDate: 'Başlangıç tarihi (t:)',
    assignee: 'Sorumlu',
    recurrence: 'Yineleme (rec)',
    recurrencePlaceholder: 'ör. 1d, +1w, 2m',
    projects: 'Projeler',
    contexts: 'Kapsamlar',
    suggestions: 'Öneriler:'
  }
};

export const TaskEditor = ({
  initialTask,
  onSave,
  onCancel,
  knownProjects,
  knownContexts,
  knownAssignees,
  isInline = false,
  contextEmojis = {},
  projectPreset = 'purple',
  contextPreset = 'emerald',
  language
}: TaskEditorProps) => {
  const texts = localTexts[language] || localTexts['en'];
  const projectStyles = PROJECT_COLOR_PRESETS[projectPreset] || PROJECT_COLOR_PRESETS['purple'];
  const contextStyles = CONTEXT_COLOR_PRESETS[contextPreset] || CONTEXT_COLOR_PRESETS['emerald'];

  // Raw task text as the single source of truth for the textarea
  const [rawText, setRawText] = useState('');

  // Individual widget states synced from rawText
  const [priority, setPriority] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [thresholdDate, setThresholdDate] = useState<string | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [otherTags, setOtherTags] = useState<Record<string, string>>({});

  // Input states for adding new tags
  const [projectInput, setProjectInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showProjectSuggestions, setShowProjectSuggestions] = useState(false);
  const [showContextSuggestions, setShowContextSuggestions] = useState(false);

  const projectInputRef = useRef<HTMLInputElement>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isClosing, setIsClosing] = useState(false);

  const triggerClose = (callback: () => void) => {
    if (isInline) {
      setIsClosing(true);
      setTimeout(() => {
        callback();
      }, 250);
    } else {
      callback();
    }
  };

  // Auto-grow textarea height to prevent scroll and alignment issues
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [rawText]);

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle click outside to save and close
  useEffect(() => {
    if (!isInline) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (isClosing) return;

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (rawText.trim()) {
          triggerClose(() => onSave(rawText.trim()));
        } else {
          triggerClose(onCancel);
        }
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInline, isClosing, rawText, onSave, onCancel]);

  // Initialize fields
  useEffect(() => {
    if (initialTask) {
      const initialText = initialTask.originalText || '';
      setRawText(initialText);
      setPriority(initialTask.priority);
      setDueDate(initialTask.tags['due'] || null);
      setThresholdDate(initialTask.tags['t'] || null);
      setAssignee(initialTask.tags['who'] || null);
      setProjects(initialTask.projects || []);
      setContexts(initialTask.contexts || []);
      setIsHidden(initialTask.tags['h'] === '1');
      setStatus(initialTask.isCompleted ? 'done' : (initialTask.tags['status'] || null));

      const others: Record<string, string> = {};
      Object.keys(initialTask.tags).forEach(k => {
        if (k !== 'due' && k !== 'who' && k !== 'h' && k !== 'status' && k !== 't') {
          others[k] = initialTask.tags[k];
        }
      });
      setOtherTags(others);
    } else {
      setRawText('');
      setPriority(null);
      setDueDate(null);
      setThresholdDate(null);
      setAssignee(null);
      setProjects([]);
      setContexts([]);
      setIsHidden(false);
      setStatus(null);
      setOtherTags({});
    }
  }, [initialTask]);

  // Synchronize textarea changes to widgets
  const handleTextareaChange = (val: string) => {
    setRawText(val);
    const parsed = parseTask(val);
    setPriority(parsed.priority);
    setDueDate(parsed.tags['due'] || null);
    setThresholdDate(parsed.tags['t'] || null);
    setAssignee(parsed.tags['who'] || null);
    setProjects(parsed.projects || []);
    setContexts(parsed.contexts || []);
    setIsHidden(parsed.tags['h'] === '1');
    setStatus(parsed.isCompleted ? 'done' : (parsed.tags['status'] || null));

    const others: Record<string, string> = {};
    Object.keys(parsed.tags).forEach(k => {
      if (k !== 'due' && k !== 'who' && k !== 'h' && k !== 'status' && k !== 't') {
        others[k] = parsed.tags[k];
      }
    });
    setOtherTags(others);
  };

  // Widget change handlers
  const handlePriorityChange = (newP: string | null) => {
    setPriority(newP);
    setRawText(prev => updatePriorityInText(prev, newP));
  };

  const handleStatusChange = (newS: string | null) => {
    let text = rawText.trim();
    if (newS === 'done') {
      if (!text.startsWith('x ')) {
        const today = new Date().toISOString().split('T')[0];
        text = `x ${today} ${text}`;
      }
      text = text.replace(/\bstatus:\S+/g, '').replace(/\s+/g, ' ').trim();
      setStatus('done');
    } else {
      if (text.startsWith('x ')) {
        const matches = text.match(/^x\s+(\d{4}-\d{2}-\d{2}\s+)?(\d{4}-\d{2}-\d{2}\s+)?/);
        if (matches) {
          text = text.substring(matches[0].length);
        } else {
          text = text.substring(2);
        }
      }
      text = updateTagInText(text, 'status', newS);
      setStatus(newS);
    }
    setRawText(text.trim());
  };

  const toggleHideTask = () => {
    const nextVal = !isHidden;
    setIsHidden(nextVal);
    setRawText(prev => updateTagInText(prev, 'h', nextVal ? '1' : null));
  };

  const handleDueDateChange = (newD: string | null) => {
    setDueDate(newD);
    setRawText(prev => updateDueDateInText(prev, newD));
  };

  const handleThresholdDateChange = (newT: string | null) => {
    setThresholdDate(newT);
    setRawText(prev => updateTagInText(prev, 't', newT));
  };

  const setQuickDate = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    handleDueDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const setWeekdayDate = (dayIndex: number) => {
    const d = new Date();
    const currentDay = d.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    handleDueDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const handleAssigneeChange = (newA: string | null) => {
    setAssignee(newA);
    setRawText(prev => updateAssigneeInText(prev, newA));
  };

  const handleAddProject = (p: string) => {
    const clean = p.trim().replace(/^\+/, '');
    if (clean) {
      if (!projects.includes(clean)) {
        setProjects([...projects, clean]);
      }
      setRawText(prev => addProjectToText(prev, clean));
    }
    setProjectInput('');
    setShowProjectSuggestions(false);
  };

  const handleRemoveProject = (p: string) => {
    setProjects(projects.filter(item => item !== p));
    setRawText(prev => removeProjectFromText(prev, p));
  };

  const handleAddContext = (c: string) => {
    const clean = c.trim().replace(/^@/, '');
    if (clean) {
      if (!contexts.includes(clean)) {
        setContexts([...contexts, clean]);
      }
      setRawText(prev => addContextToText(prev, clean));
    }
    setContextInput('');
    setShowContextSuggestions(false);
  };

  const handleRemoveContext = (c: string) => {
    setContexts(contexts.filter(item => item !== c));
    setRawText(prev => removeContextFromText(prev, c));
  };

  const handleRecurrenceChange = (newRec: string) => {
    setOtherTags(prev => ({ ...prev, rec: newRec }));
    setRawText(prev => updateTagInText(prev, 'rec', newRec || null));
  };


  const handleCancel = () => {
    triggerClose(onCancel);
  };

  const handleBackdropClick = () => {
    if (rawText.trim()) {
      triggerClose(() => onSave(rawText.trim()));
    } else {
      triggerClose(onCancel);
    }
  };

  // Filtered Suggestions
  const filteredProjectSuggestions = useMemo(() => {
    return knownProjects.filter(p =>
      p.toLowerCase().includes(projectInput.toLowerCase()) && !projects.includes(p)
    );
  }, [projectInput, knownProjects, projects]);

  const filteredContextSuggestions = useMemo(() => {
    return knownContexts.filter(c =>
      c.toLowerCase().includes(contextInput.toLowerCase()) && !contexts.includes(c)
    );
  }, [contextInput, knownContexts, contexts]);

  const renderHighlightedText = (text: string) => {
    if (!text) {
      return <span className="text-slate-400 dark:text-slate-400/70 font-mono select-none">Was gibt es zu tun?</span>;
    }

    const tokens = text.split(/(\s+)/);
    let isFirstToken = true;

    return tokens.map((token, index) => {
      if (/^\s+$/.test(token)) {
        return <span key={index} className="font-mono whitespace-pre-wrap">{token}</span>;
      }

      // Priority at the start of raw text
      if (isFirstToken && /^\([A-Z]\)$/.test(token)) {
        isFirstToken = false;
        const p = token.slice(1, 2);
        let colorClass = "text-indigo-650 dark:text-indigo-400";
        if (p === 'A') colorClass = "text-red-500 font-bold";
        else if (p === 'B') colorClass = "text-orange-500 font-bold";
        else if (p === 'C') colorClass = "text-yellow-600 dark:text-yellow-400 font-bold";
        return (
          <span key={index} className={`font-mono text-sm ${colorClass}`}>
            {token}
          </span>
        );
      }

      if (token.trim() !== '') {
        isFirstToken = false;
      }

      // Projects: e.g. +Work
      if (token.startsWith('+') && token.length > 1) {
        const getProjectTextColor = (preset: string) => {
          const map: Record<string, string> = {
            purple: "text-purple-600 dark:text-purple-400",
            blue: "text-blue-600 dark:text-blue-400",
            indigo: "text-indigo-600 dark:text-indigo-400",
            pink: "text-pink-600 dark:text-pink-400",
            rose: "text-rose-600 dark:text-rose-400",
          };
          return map[preset] || "text-purple-600 dark:text-purple-400";
        };
        return (
          <span key={index} className={`font-bold text-sm font-mono ${getProjectTextColor(projectPreset)}`}>
            {token}
          </span>
        );
      }

      // Contexts: e.g. @home
      if (token.startsWith('@') && token.length > 1) {
        const getContextTextColor = (preset: string) => {
          const map: Record<string, string> = {
            emerald: "text-emerald-600 dark:text-emerald-400",
            teal: "text-teal-600 dark:text-teal-400",
            cyan: "text-cyan-600 dark:text-cyan-400",
            orange: "text-orange-600 dark:text-orange-400",
            amber: "text-amber-600 dark:text-amber-400",
          };
          return map[preset] || "text-emerald-600 dark:text-emerald-400";
        };
        return (
          <span key={index} className={`font-bold text-sm font-mono ${getContextTextColor(contextPreset)}`}>
            {token}
          </span>
        );
      }

      // Tags: due:, who:, rec:, t:
      if (token.includes(':')) {
        const [key] = token.split(':');
        if (key === 'due' || key === 't') {
          return (
            <span key={index} className="font-semibold text-sm font-mono text-indigo-650 dark:text-indigo-400">
              {token}
            </span>
          );
        }
        if (key === 'who') {
          return (
            <span key={index} className="font-semibold text-sm font-mono text-amber-600 dark:text-amber-400">
              {token}
            </span>
          );
        }
        if (key === 'rec') {
          return (
            <span key={index} className="font-semibold text-sm font-mono text-emerald-600 dark:text-emerald-400">
              {token}
            </span>
          );
        }
      }

      // Normal word
      return <span key={index} className="text-slate-800 dark:text-slate-100 font-mono">{token}</span>;
    });
  };

  const priorities = ['A', 'B', 'C', 'D'];

  const commonTextStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '8px 12px',
    margin: '0',
    border: 'none',
    boxSizing: 'border-box',
    width: '100%',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    textTransform: 'none',
    textIndent: '0px',
    textShadow: 'none',
    textAlign: 'start',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  };

  const animationClass = isInline
    ? (isClosing ? "animate-slide-up-out" : "animate-slide-down-in")
    : "";

  const containerClasses = isInline
    ? `p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 w-full transition-all ${animationClass}`
    : `p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 max-w-3xl w-full transition-all ${animationClass}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showProjectSuggestions) {
        setShowProjectSuggestions(false);
        return;
      }
      if (showContextSuggestions) {
        setShowContextSuggestions(false);
        return;
      }
      handleCancel();
    }
  };

  const getButtonClass = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const target = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dueDate === target 
      ? "px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer border border-indigo-200 dark:border-indigo-800"
      : "px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-semibold cursor-pointer border border-transparent";
  };
  const getWeekdayButtonClass = (dayIndex: number) => {
    const d = new Date();
    const currentDay = d.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    d.setDate(d.getDate() + daysToAdd);
    const target = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dueDate === target 
      ? "px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer border border-indigo-200 dark:border-indigo-800"
      : "px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-semibold cursor-pointer border border-transparent";
  };

  const editorContent = (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={containerClasses}>
      {/* Title (Modal Mode) */}
      {!isInline && (
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {initialTask ? texts.editTask : t('addTask', language)}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Description Textarea */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {texts.description}
        </label>
        <div className="relative w-full min-h-[38px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all overflow-hidden">
          {/* Highlight Layer */}
          <div
            ref={highlightRef}
            style={{
              ...commonTextStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: '100%',
              pointerEvents: 'none',
              userSelect: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }}
            className="no-scrollbar"
            aria-hidden="true"
          >
            {renderHighlightedText(rawText)}
          </div>

          {/* Editable Textarea Layer */}
          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => handleTextareaChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (rawText.trim()) {
                  triggerClose(() => onSave(rawText.trim()));
                } else {
                  triggerClose(onCancel);
                }
              }
            }}
            style={{
              ...commonTextStyle,
              minHeight: '38px',
              display: 'block',
              background: 'transparent',
              color: 'transparent',
              resize: 'none',
              outline: 'none',
              overflow: 'hidden',
            }}
            className="editor-textarea no-scrollbar"
            autoFocus={!isInline}
          />
        </div>
      </div>

      {/* Priority & Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Priority Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {texts.priority}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {priorities.map(p => {
              const isSelected = priority === p;
              let colorClass = "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800";
              if (isSelected) {
                if (p === 'A') colorClass = "bg-red-500 text-white border-red-500 shadow-sm";
                else if (p === 'B') colorClass = "bg-orange-500 text-white border-orange-500 shadow-sm";
                else if (p === 'C') colorClass = "bg-yellow-500 text-slate-900 border-yellow-500 shadow-sm";
                else colorClass = "bg-indigo-650 text-white border-indigo-650 shadow-sm";
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePriorityChange(isSelected ? null : p)}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${colorClass}`}
                >
                  ({p})
                </button>
              );
            })}
            {priority && (
              <button
                type="button"
                onClick={() => handlePriorityChange(null)}
                className="px-2 py-1 text-xs text-red-655 hover:underline font-semibold cursor-pointer"
              >
                {t('remove', language)}
              </button>
            )}
          </div>
        </div>

        {/* Visibility Option */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {texts.visibility}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={toggleHideTask}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isHidden
                  ? "bg-red-500 text-white border-red-500 shadow-sm"
                  : "border-slate-200 text-slate-705 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 bg-white dark:bg-slate-950"
              }`}
            >
              <EyeOff size={13} />
              {isHidden ? texts.taskHidden : texts.hideTask}
            </button>
          </div>
        </div>

        {/* Status Selector */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { val: null, label: `🔴 ${texts.todo}` },
              { val: 'planned', label: `🔵 ${t('groupStatusPlanned', language).replace(/🔵\s*/, '')}` },
              { val: 'continue', label: `🟤 ${t('groupStatusContinue', language).replace(/🟤\s*/, '')}` },
              { val: 'details', label: `🟠 ${t('groupStatusDetails', language).replace(/🟠\s*/, '')}` },
              { val: 'done', label: `🟢 ${t('groupStatusDone', language).replace(/🟢\s*/, '')}` }
            ].map(item => {
              const isSelected = status === item.val;
              let colorClass = "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800";
              if (isSelected) {
                if (item.val === null) colorClass = "bg-red-500 text-white border-red-500 shadow-sm";
                else if (item.val === 'planned') colorClass = "bg-blue-500 text-white border-blue-500 shadow-sm";
                else if (item.val === 'continue') colorClass = "bg-[#5d4037] text-white border-[#5d4037] shadow-sm";
                else if (item.val === 'details') colorClass = "bg-orange-500 text-white border-orange-500 shadow-sm";
                else if (item.val === 'done') colorClass = "bg-emerald-500 text-white border-emerald-500 shadow-sm";
              }
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleStatusChange(item.val)}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${colorClass}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Due Date, Threshold Date & Assignee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Due Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Calendar size={12} /> {texts.dueDate}
          </label>
          <div className="space-y-1.5">
            <input
              type="date"
              value={dueDate || ''}
              onChange={(e) => handleDueDateChange(e.target.value || null)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={getButtonClass(0)}
              >
                {t('inputDateToday', language)}
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className={getButtonClass(1)}
              >
                {t('inputDateTomorrow', language)}
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className={getButtonClass(7)}
              >
                {texts.plus1Week}
              </button>
              <button
                type="button"
                onClick={() => setWeekdayDate(1)}
                className={getWeekdayButtonClass(1)}
              >
                {t('inputDateMonday', language)}
              </button>
              <button
                type="button"
                onClick={() => setWeekdayDate(5)}
                className={getWeekdayButtonClass(5)}
              >
                {t('inputDateFriday', language)}
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => handleDueDateChange(null)}
                  className="px-1.5 py-0.5 text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  {t('delete', language)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Startdatum (Threshold) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Clock size={12} /> {texts.startDate}
          </label>
          <div className="space-y-1.5">
            <input
              type="date"
              value={thresholdDate || ''}
              onChange={(e) => handleThresholdDateChange(e.target.value || null)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  handleThresholdDateChange(today);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
              >
                {t('inputDateToday', language)}
              </button>
              {thresholdDate && (
                <button
                  type="button"
                  onClick={() => handleThresholdDateChange(null)}
                  className="px-1.5 py-0.5 text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  {t('delete', language)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <User size={12} /> {texts.assignee}
          </label>
          <div className="relative">
            <input
              type="text"
              value={assignee || ''}
              onChange={(e) => handleAssigneeChange(e.target.value || null)}
              placeholder="Name..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              list="known-assignees"
            />
            <datalist id="known-assignees">
              {knownAssignees.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
          {/* Clickable Assignee Suggestions */}
          {knownAssignees.filter(a => assignee !== a).length > 0 && (
            <div className="flex flex-wrap gap-1 items-center mt-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1 select-none">
                {texts.suggestions}
              </span>
              {knownAssignees
                .filter(a => assignee !== a)
                .slice(0, 4)
                .map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleAssigneeChange(a)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 font-bold cursor-pointer border border-transparent hover:border-amber-100 dark:hover:border-amber-900/35 transition-all select-none"
                  >
                    {a}
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Recurrence (Preserved & Editable if present) */}
      {('rec' in otherTags || 'rec' in (initialTask?.tags || {})) && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1">
            <Repeat size={12} /> {texts.recurrence}
          </label>
          <input
            type="text"
            value={otherTags['rec'] || ''}
            onChange={(e) => handleRecurrenceChange(e.target.value)}
            placeholder={texts.recurrencePlaceholder}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      {/* Projects Tag Editor */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Bookmark size={12} /> {texts.projects}
        </label>
        <div className="flex flex-wrap gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded-xl min-h-[42px] items-center">
          {projects.map(p => (
            <span
              key={p}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${projectStyles.normal}`}
            >
              <span>+{p}</span>
              <button
                type="button"
                onClick={() => handleRemoveProject(p)}
                className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[80px]">
            <input
              ref={projectInputRef}
              type="text"
              value={projectInput}
              onChange={(e) => {
                setProjectInput(e.target.value);
                setShowProjectSuggestions(true);
              }}
              onFocus={() => setShowProjectSuggestions(true)}
              onBlur={() => setTimeout(() => setShowProjectSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddProject(projectInput);
                }
              }}
              placeholder={t('placeholderNew', language)}
              className="w-full bg-transparent border-0 text-slate-900 dark:text-slate-50 text-xs focus:ring-0 focus:outline-none p-0.5"
            />
            {showProjectSuggestions && filteredProjectSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-25 max-h-32 overflow-y-auto w-40">
                {filteredProjectSuggestions.map(p => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={() => handleAddProject(p)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-755 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                  >
                    +{p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Clickable Quick Suggestions */}
        {knownProjects.filter(p => !projects.includes(p)).length > 0 && (
          <div className="flex flex-wrap gap-1 items-center mt-1.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1 select-none">
              {texts.suggestions}
            </span>
            {knownProjects
              .filter(p => !projects.includes(p))
              .slice(0, 6)
              .map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddProject(p)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all select-none ${projectStyles.normal} ${projectStyles.hover}`}
                >
                  +{p}
                </button>
              ))
            }
          </div>
        )}
      </div>

      {/* Contexts Tag Editor */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Tag size={12} /> {texts.contexts}
        </label>
        <div className="flex flex-wrap gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded-xl min-h-[42px] items-center">
          {contexts.map(c => {
            const emoji = contextEmojis[c];
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${contextStyles.normal}`}
              >
                {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
                <span>@{c}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveContext(c)}
                  className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <div className="relative flex-1 min-w-[80px]">
            <input
              ref={contextInputRef}
              type="text"
              value={contextInput}
              onChange={(e) => {
                setContextInput(e.target.value);
                setShowContextSuggestions(true);
              }}
              onFocus={() => setShowContextSuggestions(true)}
              onBlur={() => setTimeout(() => setShowContextSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddContext(contextInput);
                }
              }}
              placeholder={t('placeholderNew', language)}
              className="w-full bg-transparent border-0 text-slate-900 dark:text-slate-50 text-xs focus:ring-0 focus:outline-none p-0.5"
            />
            {showContextSuggestions && filteredContextSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-25 max-h-32 overflow-y-auto w-40">
                {filteredContextSuggestions.map(c => {
                  const emoji = contextEmojis[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={() => handleAddContext(c)}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-755 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium flex items-center gap-1"
                    >
                      {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
                      <span>@{c}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Clickable Quick Suggestions */}
        {knownContexts.filter(c => !contexts.includes(c)).length > 0 && (
          <div className="flex flex-wrap gap-1 items-center mt-1.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1 select-none">
              {texts.suggestions}
            </span>
            {knownContexts
              .filter(c => !contexts.includes(c))
              .slice(0, 6)
              .map(c => {
                const emoji = contextEmojis[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleAddContext(c)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all select-none inline-flex items-center gap-1 ${contextStyles.normal} ${contextStyles.hover}`}
                  >
                    {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
                    <span>@{c}</span>
                  </button>
                );
              })
            }
          </div>
        )}
      </div>

      {/* Save/Cancel buttons removed per user request. Auto-saves on Enter or blur. */}
    </div>
  );

  if (isInline) {
    return editorContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-0" onClick={handleBackdropClick} />
      <div className="relative z-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl">
        {editorContent}
      </div>
    </div>
  );
};
