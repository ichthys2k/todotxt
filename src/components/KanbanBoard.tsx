import { useState } from 'react';
import type { TodoTask } from '../services/todoParser';
import { TodoItem } from './TodoItem';
import { ListTodo, CheckCircle2, Calendar, Folder, Hash, Flag, User, HelpCircle, ArrowRight } from 'lucide-react';
import { PROJECT_COLOR_PRESETS, CONTEXT_COLOR_PRESETS } from '../utils/themeStyles';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface KanbanBoardProps {
  tasks: TodoTask[];
  language: Language;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onUpdateDueDate: (id: string, newDueDate: string | null) => void;
  onUpdateTaskText: (id: string, newText: string) => void;
  onMoveTask: (id: string, targetColumnId: string) => void;
  knownProjects: string[];
  knownContexts: string[];
  showCreationDate: boolean;
  hideTaskIds?: boolean;
  groupBy: 'none' | 'project' | 'context' | 'priority' | 'due' | 'assignee';
  projectPreset: string;
  contextPreset: string;
  datePreset: string;
  knownAssignees: string[];
  contextEmojis?: Record<string, string>;
  onAddTask?: (rawText: string) => void;
  activeSmartView?: string | null;
}

export const KanbanBoard = ({
  tasks,
  language,
  onToggle,
  onDelete,
  onRestore,
  onUpdateDueDate,
  onUpdateTaskText,
  onMoveTask,
  knownProjects,
  knownContexts,
  showCreationDate,
  hideTaskIds = true,
  groupBy,
  projectPreset,
  contextPreset,
  datePreset,
  knownAssignees,
  contextEmojis = {},
  onAddTask,
  activeSmartView
}: KanbanBoardProps) => {
  const projectStyles = PROJECT_COLOR_PRESETS[projectPreset] || PROJECT_COLOR_PRESETS['purple'];
  const contextStyles = CONTEXT_COLOR_PRESETS[contextPreset] || CONTEXT_COLOR_PRESETS['emerald'];

  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCardText, setNewCardText] = useState('');

  const submitNewCard = (columnId: string) => {
    if (!newCardText.trim() || !onAddTask) return;
    
    let prefix = '';
    let suffix = '';
    
    const parts = columnId.split(':');
    if (parts.length >= 2) {
      const [type, value] = parts;
      if (type === 'project' && value !== 'none') {
        suffix += ` +${value}`;
      } else if (type === 'context' && value !== 'none') {
        suffix += ` @${value}`;
      } else if (type === 'assignee' && value !== 'none') {
        suffix += ` who:${value}`;
      } else if (type === 'priority' && ['A', 'B', 'C', 'D'].includes(value)) {
        prefix += `(${value}) `;
      } else if (type === 'status') {
        if (value === 'planned') {
          suffix += ` status:planned`;
        } else if (value === 'details') {
          suffix += ` status:details`;
        } else if (value === 'continue') {
          suffix += ` status:continue`;
        } else if (value === 'done') {
          prefix += `x `;
        }
      } else if (type === 'due') {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        if (value === 'today') {
          suffix += ` due:${formatDate(today)}`;
        } else if (value === 'tomorrow') {
          const tom = new Date(today);
          tom.setDate(tom.getDate() + 1);
          suffix += ` due:${formatDate(tom)}`;
        } else if (value === 'overdue') {
          const yes = new Date(today);
          yes.setDate(yes.getDate() - 1);
          suffix += ` due:${formatDate(yes)}`;
        } else if (value === 'soon') {
          const soon = new Date(today);
          soon.setDate(soon.getDate() + 3);
          suffix += ` due:${formatDate(soon)}`;
        } else if (value === 'later') {
          const later = new Date(today);
          later.setDate(later.getDate() + 8);
          suffix += ` due:${formatDate(later)}`;
        }
      }
    }
    
    if (activeSmartView === 'family') {
      suffix += ' +family @home';
    }
    
    const finalTaskText = `${prefix}${newCardText.trim()}${suffix}`;
    onAddTask(finalTaskText);
    
    setNewCardText('');
    setAddingToColumn(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, targetColumnId);
    }
  };

  const getColumns = () => {
    switch (groupBy) {
      case 'project': {
        const projectsInTasks = Array.from(new Set(tasks.flatMap(t => t.projects))).sort();
        const cols = projectsInTasks.map(proj => ({
          id: `project:${proj}`,
          title: `+${proj}`,
          icon: <Folder className="text-purple-500 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.projects.includes(proj)),
          colorClass: 'border-purple-100 dark:border-purple-950/20 bg-purple-50/10 dark:bg-purple-950/5',
          headerBadge: projectStyles.normal
        }));
        cols.push({
          id: 'project:none',
          title: t('groupNoProject', language),
          icon: <Folder className="text-slate-400 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.projects.length === 0),
          colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
          headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        });
        return cols;
      }
      case 'context': {
        const contextsInTasks = Array.from(new Set(tasks.flatMap(t => t.contexts))).sort();
        const cols = contextsInTasks.map(ctx => {
          const emoji = contextEmojis[ctx];
          return {
            id: `context:${ctx}`,
            title: `@${ctx}`,
            icon: emoji ? (
              <span className="text-base mr-1 leading-none w-4 h-4 flex items-center justify-center flex-shrink-0">{emoji}</span>
            ) : (
              <Hash className="text-emerald-500 flex-shrink-0" size={16} />
            ),
            tasks: tasks.filter(t => t.contexts.includes(ctx)),
            colorClass: 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5',
            headerBadge: contextStyles.normal
          };
        });
        cols.push({
          id: 'context:none',
          title: t('groupNoContext', language),
          icon: <Hash className="text-slate-400 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.contexts.length === 0),
          colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
          headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        });
        return cols;
      }
      case 'assignee': {
        let assigneesInTasks: string[];
        if (activeSmartView === 'family') {
          const familyMembers = ["cornelius", "diana", "desiree", "joel", "elijah", "jonas"];
          const otherAssignees = Array.from(new Set(tasks.flatMap(t => t.tags['who'] ? t.tags['who'].split(',') : [])))
            .filter(name => !familyMembers.includes(name))
            .sort();
          assigneesInTasks = [...familyMembers, ...otherAssignees];
        } else {
          assigneesInTasks = Array.from(new Set(tasks.flatMap(t => t.tags['who'] ? t.tags['who'].split(',') : []))).sort();
        }
        const cols = assigneesInTasks.map(name => ({
          id: `assignee:${name}`,
          title: name,
          icon: <User className="text-emerald-500 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.tags['who'] && t.tags['who'].split(',').includes(name)),
          colorClass: 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5',
          headerBadge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-450'
        }));
        cols.push({
          id: 'assignee:none',
          title: t('groupNoAssignee', language),
          icon: <User className="text-slate-400 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => !t.tags['who']),
          colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
          headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        });
        return cols;
      }
      case 'priority': {
        const priorities = ['A', 'B', 'C'];
        const cols = priorities.map(prio => ({
          id: `priority:${prio}`,
          title: t('groupPriorityTitle', language, prio),
          icon: <Flag className="text-red-500 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.priority === prio),
          colorClass: 'border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5',
          headerBadge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
        }));
        cols.push({
          id: 'priority:other',
          title: t('groupOtherPriorities', language),
          icon: <Flag className="text-purple-500 flex-shrink-0" size={16} />,
          tasks: tasks.filter(t => t.priority !== null && !priorities.includes(t.priority)),
          colorClass: 'border-purple-100 dark:border-purple-950/20 bg-purple-50/10 dark:bg-purple-950/5',
          headerBadge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400'
        });
        cols.push({
          id: 'priority:none',
          title: t('groupNoPriority', language),
          icon: <Flag className="text-slate-400" size={16} />,
          tasks: tasks.filter(t => t.priority === null),
          colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
          headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        });
        return cols;
      }
      case 'due': {
        const getTodayDateStr = () => {
          const d = new Date();
          return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
        };
        const getTomorrowDateStr = () => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
        };
        const getIn7DaysDateStr = () => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
        };

        const todayStr = getTodayDateStr();
        const tomorrowStr = getTomorrowDateStr();
        const in7DaysStr = getIn7DaysDateStr();

        return [
          {
            id: 'due:overdue',
            title: t('groupOverdue', language),
            icon: <Calendar className="text-red-500 flex-shrink-0" size={16} />,
            tasks: tasks.filter(t => t.tags['due'] && t.tags['due'] < todayStr),
            colorClass: 'border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5',
            headerBadge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
          },
          {
            id: 'due:today',
            title: t('groupToday', language),
            icon: <Calendar className="text-amber-500" size={16} />,
            tasks: tasks.filter(t => t.tags['due'] === todayStr),
            colorClass: 'border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5',
            headerBadge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
          },
          {
            id: 'due:tomorrow',
            title: t('groupTomorrow', language),
            icon: <Calendar className="text-yellow-500" size={16} />,
            tasks: tasks.filter(t => t.tags['due'] === tomorrowStr),
            colorClass: 'border-yellow-100 dark:border-yellow-950/10 bg-yellow-50/5 dark:bg-yellow-950/5',
            headerBadge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
          },
          {
            id: 'due:soon',
            title: t('groupSoon', language),
            icon: <Calendar className="text-emerald-500" size={16} />,
            tasks: tasks.filter(t => t.tags['due'] && t.tags['due'] > tomorrowStr && t.tags['due'] <= in7DaysStr),
            colorClass: 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5',
            headerBadge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-450'
          },
          {
            id: 'due:later',
            title: t('groupLater', language),
            icon: <Calendar className="text-indigo-500" size={16} />,
            tasks: tasks.filter(t => t.tags['due'] && t.tags['due'] > in7DaysStr),
            colorClass: 'border-indigo-100 dark:border-indigo-950/20 bg-indigo-50/10 dark:bg-indigo-950/5',
            headerBadge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-455'
          },
          {
            id: 'due:none',
            title: t('groupNoDueDate', language),
            icon: <Calendar className="text-slate-400" size={16} />,
            tasks: tasks.filter(t => !t.tags['due']),
            colorClass: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
            headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }
        ];
      }
      default: {
        const todoTasks = tasks.filter(t => !t.isCompleted && !t.tags['status']);
        const plannedTasks = tasks.filter(t => !t.isCompleted && t.tags['status'] === 'planned');
        const continueTasks = tasks.filter(t => !t.isCompleted && t.tags['status'] === 'continue');
        const detailsTasks = tasks.filter(t => !t.isCompleted && t.tags['status'] === 'details');
        const doneTasks = tasks.filter(t => t.isCompleted);
        return [
          {
            id: 'todo',
            title: t('groupStatusTodo', language),
            icon: <ListTodo className="text-red-500 flex-shrink-0" size={16} />,
            tasks: todoTasks,
            colorClass: 'border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10',
            headerBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          },
          {
            id: 'status:planned',
            title: t('groupStatusPlanned', language),
            icon: <Calendar className="text-blue-500 flex-shrink-0" size={16} />,
            tasks: plannedTasks,
            colorClass: 'border-blue-100 dark:border-blue-950/20 bg-blue-50/10 dark:bg-blue-950/5',
            headerBadge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-750 dark:text-blue-400'
          },
          {
            id: 'status:continue',
            title: t('groupStatusContinue', language),
            icon: <ArrowRight className="text-[#8d6e63] flex-shrink-0" size={16} />,
            tasks: continueTasks,
            colorClass: 'border-[#efebe9] dark:border-[#3e2723]/20 bg-[#efebe9]/10 dark:bg-[#3e2723]/5',
            headerBadge: 'bg-[#d7ccc8] dark:bg-[#3e2723]/40 text-[#5d4037] dark:text-[#d7ccc8]'
          },
          {
            id: 'status:details',
            title: t('groupStatusDetails', language),
            icon: <HelpCircle className="text-orange-500 flex-shrink-0" size={16} />,
            tasks: detailsTasks,
            colorClass: 'border-orange-100 dark:border-orange-950/20 bg-orange-50/10 dark:bg-orange-950/5',
            headerBadge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-755 dark:text-orange-400'
          },
          {
            id: 'done',
            title: t('groupStatusDone', language),
            icon: <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />,
            tasks: doneTasks,
            colorClass: 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/10 dark:bg-emerald-950/5',
            headerBadge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-450'
          }
        ];
      }
    }
  };

  const columns = getColumns();

  return (
    <div className="flex gap-3 items-stretch overflow-x-auto pb-4 flex-1 min-h-0 w-full">
      {columns.map(col => (
        <div 
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className={`flex flex-col rounded-xl border p-2.5 flex-1 min-w-[260px] max-w-[500px] h-full ${col.colorClass}`}
        >
          {/* Spalten-Header */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 select-none">
            <div className="flex items-center gap-2 max-w-[80%] truncate">
              {col.icon}
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{col.title}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${col.headerBadge}`}>
              {col.tasks.length}
            </span>
          </div>

          {/* Aufgabenliste der Spalte */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/50">
            {col.tasks.map(task => {
              const itemHiddenTags: string[] = [];
              const parts = col.id.split(':');
              if (parts.length >= 2) {
                const [type, value] = parts;
                if (type === 'project' && value !== 'none') {
                  itemHiddenTags.push(`+${value}`);
                } else if (type === 'context' && value !== 'none') {
                  itemHiddenTags.push(`@${value}`);
                } else if (type === 'assignee' && value !== 'none') {
                  itemHiddenTags.push(`who:${value}`);
                } else if (type === 'priority' && value !== 'none' && value !== 'other') {
                  itemHiddenTags.push(`priority:${value}`);
                } else if (type === 'status' && value !== 'none') {
                  itemHiddenTags.push(`status:${value}`);
                } else if (type === 'due' && value !== 'none' && task.tags['due']) {
                  itemHiddenTags.push(`due:${task.tags['due']}`);
                }
              }

              return (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-grab active:cursor-grabbing border-b border-slate-200 dark:border-slate-800 last:border-b-0"
                >
                  <TodoItem 
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
                    hideTaskIds={hideTaskIds}
                    projectPreset={projectPreset}
                    contextPreset={contextPreset}
                    datePreset={datePreset}
                    isKanban={true}
                    contextEmojis={contextEmojis}
                    hiddenTags={itemHiddenTags}
                    activeSmartView={activeSmartView}
                    language={language}
                  />
                </div>
              );
            })}
            {col.tasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic flex items-center justify-center h-28 select-none">
                {t('noTasksInColumn', language)}
              </div>
            )}
          </div>

          {/* Hinzufügen-Bereich */}
          {onAddTask && (
            <div className="mt-2 flex-shrink-0">
              {addingToColumn === col.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCardText}
                    onChange={(e) => setNewCardText(e.target.value)}
                    placeholder={t('kanbanCardPlaceholder', language)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        submitNewCard(col.id);
                      } else if (e.key === 'Escape') {
                        setAddingToColumn(null);
                        setNewCardText('');
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitNewCard(col.id)}
                      disabled={!newCardText.trim()}
                      className="text-[11px] bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
                    >
                      {t('add', language)}
                    </button>
                    <button
                      onClick={() => {
                        setAddingToColumn(null);
                        setNewCardText('');
                      }}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded cursor-pointer"
                    >
                      {t('cancel', language)}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingToColumn(col.id);
                    setNewCardText('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-900/40 rounded-xl cursor-pointer transition-colors font-semibold"
                >
                  {t('kanbanAddTask', language)}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
