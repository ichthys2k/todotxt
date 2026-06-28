import { useState } from 'react';
import type { TodoTask } from '../services/todoParser';
import { TodoItem } from './TodoItem';
import { PROJECT_COLOR_PRESETS, CONTEXT_COLOR_PRESETS } from '../utils/themeStyles';
import { Plus } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';
import { OnboardingGuide } from './OnboardingGuide';

interface TodoListProps {
  tasks: TodoTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onUpdateDueDate: (id: string, newDueDate: string | null) => void;
  onUpdateTaskText: (id: string, newText: string) => void;
  knownProjects: string[];
  knownContexts: string[];
  showCreationDate: boolean;
  groupBy: 'none' | 'project' | 'context' | 'priority' | 'due' | 'assignee';
  sortBy: 'priority' | 'due' | 'creation' | 'alphabetical';
  projectPreset: string;
  contextPreset: string;
  datePreset: string;
  knownAssignees: string[];
  contextEmojis?: Record<string, string>;
  activeSmartView?: string | null;
  onAddTask?: (rawText: string) => void;
  language: Language;
  onSetupSync?: () => void;
  storageMode?: 'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive' | null;
  isLocalFileLinked?: boolean;
  showMetadataTags?: boolean;
}

const getTodayDateStr = (): string => {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const getTomorrowDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const getIn7DaysDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

export const TodoList = ({ 
  tasks, 
  onToggle, 
  onDelete, 
  onRestore, 
  onUpdateDueDate,
  onUpdateTaskText,
  knownProjects,
  knownContexts,
  showCreationDate,
  groupBy,
  sortBy,
  projectPreset,
  contextPreset,
  datePreset,
  knownAssignees,
  contextEmojis = {},
  activeSmartView,
  onAddTask,
  language,
  onSetupSync,
  storageMode = 'local',
  isLocalFileLinked = false,
  showMetadataTags = false
}: TodoListProps) => {
  const [isOnboardingActive, setIsOnboardingActive] = useState(() => {
    return localStorage.getItem('todo_txt_onboarding_active') === 'true';
  });
  const [isOnboardingSyntaxActive, setIsOnboardingSyntaxActive] = useState(() => {
    return localStorage.getItem('todo_txt_onboarding_syntax_active') === 'true';
  });

  const handleDismissOnboarding = () => {
    localStorage.removeItem('todo_txt_onboarding_active');
    setIsOnboardingActive(false);
  };

  const handleDismissOnboardingSyntax = () => {
    localStorage.removeItem('todo_txt_onboarding_syntax_active');
    setIsOnboardingSyntaxActive(false);
  };

  const handleSetupSync = () => {
    localStorage.removeItem('todo_txt_onboarding_active');
    setIsOnboardingActive(false);
    if (onSetupSync) {
      onSetupSync();
    } else {
      localStorage.removeItem('todo_txt_last_mode');
      window.location.reload();
    }
  };


  const renderOnboardingBanner = () => {
    if (!isOnboardingActive || tasks.length === 0) return null;
    if (storageMode !== 'local' || isLocalFileLinked) return null;

    return (
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-indigo-950/30 dark:to-indigo-950/20 border border-indigo-105 dark:border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in text-sm">
        <div className="flex gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-xl flex-shrink-0 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-pulse">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="m12 8-4 4h8z"/>
            </svg>
          </div>
          <div>
            <p className="text-slate-705 dark:text-slate-300 font-medium">
              {t('onboardingBannerText', language)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleSetupSync}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-650 text-white font-medium rounded-xl shadow-sm text-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('onboardingBannerSetup', language)}
          </button>
          <button
            onClick={handleDismissOnboarding}
            className="px-3 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('onboardingBannerDismiss', language)}
          </button>
        </div>
      </div>
    );
  };

  const projectStyles = PROJECT_COLOR_PRESETS[projectPreset] || PROJECT_COLOR_PRESETS['purple'];
  const contextStyles = CONTEXT_COLOR_PRESETS[contextPreset] || CONTEXT_COLOR_PRESETS['emerald'];

  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');

  const submitNewTask = (groupTitle: string) => {
    if (!newTaskText.trim() || !onAddTask) return;
    
    let prefix = '';
    let suffix = '';
    
    if (groupBy === 'project') {
      if (groupTitle !== t('groupNoProject', language)) {
        const projName = groupTitle.startsWith('+') ? groupTitle.substring(1) : groupTitle;
        suffix += ` +${projName}`;
      }
    } else if (groupBy === 'context') {
      if (groupTitle !== t('groupNoContext', language)) {
        const match = groupTitle.match(/@(\S+)/);
        if (match) {
          suffix += ` @${match[1]}`;
        } else {
          const cleanCtx = groupTitle.startsWith('@') ? groupTitle.substring(1) : groupTitle;
          suffix += ` @${cleanCtx}`;
        }
      }
    } else if (groupBy === 'assignee') {
      if (groupTitle !== t('groupNoAssignee', language)) {
        suffix += ` who:${groupTitle}`;
      }
    } else if (groupBy === 'priority') {
      if (groupTitle !== t('groupNoPriority', language)) {
        const prio = groupTitle.replace(t('groupPriorityTitle', language, '').trim(), '').trim();
        prefix += `(${prio}) `;
      }
    } else if (groupBy === 'due') {
      const today = getTodayDateStr();
      const tomorrow = getTomorrowDateStr();
      const in7Days = getIn7DaysDateStr();
      
      if (groupTitle === t('groupOverdue', language)) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        suffix += ` due:${formatDate(d)}`;
      } else if (groupTitle === t('groupToday', language)) {
        suffix += ` due:${today}`;
      } else if (groupTitle === t('groupTomorrow', language)) {
        suffix += ` due:${tomorrow}`;
      } else if (groupTitle === t('groupSoon', language)) {
        suffix += ` due:${in7Days}`;
      } else if (groupTitle === t('groupLater', language)) {
        const d = new Date();
        d.setDate(d.getDate() + 8);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        suffix += ` due:${formatDate(d)}`;
      }
    }

    if (activeSmartView === 'family') {
      suffix += ' +family @home';
    }
    
    const finalTaskText = `${prefix}${newTaskText.trim()}${suffix}`;
    onAddTask(finalTaskText);
    
    setNewTaskText('');
    setAddingToGroup(null);
  };

  if (tasks.length === 0) {
    if (isOnboardingSyntaxActive) {
      return (
        <OnboardingGuide 
          onDismiss={handleDismissOnboardingSyntax}
          language={language}
        />
      );
    }
    return (
      <div className="text-center py-12 text-slate-500">
        {t('noTasks', language)}
      </div>
    );
  }

  // Sortierfunktion basierend auf Kriterium
  const sortTasks = (taskList: TodoTask[]) => {
    return [...taskList].sort((a, b) => {
      // Erledigte Aufgaben immer nach unten
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      if (sortBy === 'priority') {
        if (a.priority && b.priority) {
          if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        } else if (a.priority) {
          return -1;
        } else if (b.priority) {
          return 1;
        }
        // Fallback Fälligkeit
        const dueA = a.tags['due'] || '9999-99-99';
        const dueB = b.tags['due'] || '9999-99-99';
        return dueA.localeCompare(dueB);
      } 
      
      if (sortBy === 'due') {
        const dueA = a.tags['due'] || '9999-99-99';
        const dueB = b.tags['due'] || '9999-99-99';
        if (dueA !== dueB) return dueA.localeCompare(dueB);
        // Fallback Priorität
        if (a.priority && b.priority) {
          if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
        } else if (a.priority) {
          return -1;
        } else if (b.priority) {
          return 1;
        }
        return 0;
      }

      if (sortBy === 'creation') {
        const dateA = a.creationDate || '0000-00-00';
        const dateB = b.creationDate || '0000-00-00';
        // Neueste zuerst
        return dateB.localeCompare(dateA);
      }

      if (sortBy === 'alphabetical') {
        return a.description.localeCompare(b.description);
      }

      return 0;
    });
  };

  const sortedTasks = sortTasks(tasks);

  if (groupBy === 'none') {
    return (
      <div className="flex flex-col">
        {isOnboardingSyntaxActive && (
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <OnboardingGuide onDismiss={handleDismissOnboardingSyntax} language={language} />
          </div>
        )}
        {sortedTasks.map(task => (
          <TodoItem 
            key={task.id} 
            task={task} 
            onToggle={() => onToggle(task.id)}
            onDelete={() => onDelete(task.id)}
            onRestore={onRestore ? () => onRestore(task.id) : undefined}
            onUpdateDueDate={(newDue) => onUpdateDueDate(task.id, newDue)}
            onUpdateTaskText={(newText) => onUpdateTaskText(task.id, newText)}
            knownProjects={knownProjects}
            knownContexts={knownContexts}
            knownAssignees={knownAssignees}
            showCreationDate={showCreationDate}
            projectPreset={projectPreset}
            contextPreset={contextPreset}
            datePreset={datePreset}
            contextEmojis={contextEmojis}
            activeSmartView={activeSmartView}
            language={language}
            showMetadataTags={showMetadataTags}
          />
        ))}
        {renderOnboardingBanner()}
      </div>
    );
  }  // Gruppierungs-Logik
  const groups: { title: string; colorClass: string; tasks: TodoTask[]; hiddenTags?: string[]; hideDue?: boolean }[] = [];

  if (groupBy === 'project') {
    const projectsInTasks = Array.from(new Set(sortedTasks.flatMap(t => t.projects))).sort();
    const noProjectTasks = sortedTasks.filter(t => t.projects.length === 0);

    projectsInTasks.forEach(proj => {
      groups.push({
        title: `+${proj}`,
        colorClass: projectStyles.normal,
        tasks: sortTasks(sortedTasks.filter(t => t.projects.includes(proj))),
        hiddenTags: [`+${proj}`]
      });
    });

    if (noProjectTasks.length > 0) {
      groups.push({
        title: t('groupNoProject', language),
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
        tasks: sortTasks(noProjectTasks)
      });
    }
  } else if (groupBy === 'context') {
    const contextsInTasks = Array.from(new Set(sortedTasks.flatMap(t => t.contexts))).sort();
    const noContextTasks = sortedTasks.filter(t => t.contexts.length === 0);

    contextsInTasks.forEach(ctx => {
      const emoji = contextEmojis[ctx];
      const title = emoji ? `${emoji} @${ctx}` : `@${ctx}`;
      groups.push({
        title,
        colorClass: contextStyles.normal,
        tasks: sortTasks(sortedTasks.filter(t => t.contexts.includes(ctx))),
        hiddenTags: [`@${ctx}`]
      });
    });

    if (noContextTasks.length > 0) {
      groups.push({
        title: t('groupNoContext', language),
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
        tasks: sortTasks(noContextTasks)
      });
    }
  } else if (groupBy === 'priority') {
    const prioritiesInTasks = Array.from(new Set(sortedTasks.map(t => t.priority).filter((p): p is string => p !== null))).sort();
    const noPriorityTasks = sortedTasks.filter(t => t.priority === null);

    prioritiesInTasks.forEach(prio => {
      groups.push({
        title: t('groupPriorityTitle', language, prio),
        colorClass: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
        tasks: sortTasks(sortedTasks.filter(t => t.priority === prio)),
        hiddenTags: [`priority:${prio}`]
      });
    });

    if (noPriorityTasks.length > 0) {
      groups.push({
        title: t('groupNoPriority', language),
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
        tasks: sortTasks(noPriorityTasks)
      });
    }
  } else if (groupBy === 'due') {
    const todayStr = getTodayDateStr();
    const tomorrowStr = getTomorrowDateStr();
    const in7DaysStr = getIn7DaysDateStr();

    const overdue: TodoTask[] = [];
    const today: TodoTask[] = [];
    const tomorrow: TodoTask[] = [];
    const soon: TodoTask[] = [];
    const later: TodoTask[] = [];
    const noDate: TodoTask[] = [];

    sortedTasks.forEach(task => {
      const due = task.tags['due'];
      if (!due) {
        noDate.push(task);
      } else if (task.isCompleted) {
        if (due < todayStr) overdue.push(task);
        else if (due === todayStr) today.push(task);
        else if (due === tomorrowStr) tomorrow.push(task);
        else if (due <= in7DaysStr) soon.push(task);
        else later.push(task);
      } else {
        if (due < todayStr) {
          overdue.push(task);
        } else if (due === todayStr) {
          today.push(task);
        } else if (due === tomorrowStr) {
          tomorrow.push(task);
        } else if (due <= in7DaysStr) {
          soon.push(task);
        } else {
          later.push(task);
        }
      }
    });

    if (overdue.length > 0) {
      groups.push({
        title: t('groupOverdue', language),
        colorClass: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
        tasks: sortTasks(overdue),
        hideDue: true
      });
    }
    if (today.length > 0) {
      groups.push({
        title: t('groupToday', language),
        colorClass: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border-amber-100 dark:border-amber-900',
        tasks: sortTasks(today),
        hideDue: true
      });
    }
    if (tomorrow.length > 0) {
      groups.push({
        title: t('groupTomorrow', language),
        colorClass: 'bg-yellow-50 dark:bg-yellow-950/10 text-yellow-800 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/20',
        tasks: sortTasks(tomorrow),
        hideDue: true
      });
    }
    if (soon.length > 0) {
      groups.push({
        title: t('groupSoon', language),
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
        tasks: sortTasks(soon),
        hideDue: true
      });
    }
    if (later.length > 0) {
      groups.push({
        title: t('groupLater', language),
        colorClass: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
        tasks: sortTasks(later),
        hideDue: true
      });
    }
    if (noDate.length > 0) {
      groups.push({
        title: t('groupNoDueDate', language),
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
        tasks: sortTasks(noDate)
      });
    }
  } else if (groupBy === 'assignee') {
    const assigneesInTasks = Array.from(new Set(sortedTasks.flatMap(t => t.tags['who'] ? t.tags['who'].split(',') : []))).sort();
    const noAssigneeTasks = sortedTasks.filter(t => !t.tags['who']);

    assigneesInTasks.forEach(name => {
      groups.push({
        title: name,
        colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-250 border-emerald-100 dark:border-emerald-900/30',
        tasks: sortTasks(sortedTasks.filter(t => t.tags['who'] && t.tags['who'].split(',').includes(name))),
        hiddenTags: [`who:${name}`]
      });
    });

    if (noAssigneeTasks.length > 0) {
      groups.push({
        title: t('groupNoAssignee', language),
        colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/50',
        tasks: sortTasks(noAssigneeTasks)
      });
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--density-list-space-y)' }}>
      {isOnboardingSyntaxActive && (
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <OnboardingGuide onDismiss={handleDismissOnboardingSyntax} language={language} />
        </div>
      )}
      {groups.map(group => (
        <div key={group.title} className="flex flex-col" style={{ gap: 'var(--density-group-space-y)' }}>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider select-none ${group.colorClass}`}>
              {group.title}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">({group.tasks.length})</span>
            {onAddTask && (
              <button 
                onClick={() => {
                  setAddingToGroup(addingToGroup === group.title ? null : group.title);
                  setNewTaskText('');
                }}
                className="p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                title={`${t('addTask', language)} (${group.title})`}
              >
                <Plus size={12} />
              </button>
            )}
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/80"></div>
          </div>
          <div className="flex flex-col">
            {addingToGroup === group.title && (
              <div className="mb-2.5 p-2.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/5 dark:bg-indigo-950/5 flex gap-2 items-center">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={t('kanbanCardPlaceholder', language)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitNewTask(group.title);
                    } else if (e.key === 'Escape') {
                      setAddingToGroup(null);
                      setNewTaskText('');
                    }
                  }}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-355 dark:border-slate-700 text-slate-900 dark:text-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={() => submitNewTask(group.title)}
                  disabled={!newTaskText.trim()}
                  className="text-[11px] bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
                >
                  {t('add', language)}
                </button>
                <button
                  onClick={() => {
                    setAddingToGroup(null);
                    setNewTaskText('');
                  }}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded cursor-pointer"
                >
                  {t('cancel', language)}
                </button>
              </div>
            )}
            {group.tasks.map(task => {
              const itemHiddenTags = group.hiddenTags ? [...group.hiddenTags] : [];
              if (group.hideDue && task.tags['due']) {
                itemHiddenTags.push(`due:${task.tags['due']}`);
              }
              return (
                <TodoItem 
                  key={`${group.title}-${task.id}`} 
                  task={task} 
                  onToggle={() => onToggle(task.id)}
                  onDelete={() => onDelete(task.id)}
                  onRestore={onRestore ? () => onRestore(task.id) : undefined}
                  onUpdateDueDate={(newDue) => onUpdateDueDate(task.id, newDue)}
                  onUpdateTaskText={(newText) => onUpdateTaskText(task.id, newText)}
                  knownProjects={knownProjects}
                  knownContexts={knownContexts}
                  knownAssignees={knownAssignees}
                  showCreationDate={showCreationDate}
                  projectPreset={projectPreset}
                  contextPreset={contextPreset}
                  datePreset={datePreset}
                  contextEmojis={contextEmojis}
                  activeSmartView={activeSmartView}
                  hiddenTags={itemHiddenTags}
                  language={language}
                  showMetadataTags={showMetadataTags}
                />
              );
            })}
          </div>
        </div>
      ))}
      {renderOnboardingBanner()}
    </div>
  );
};
