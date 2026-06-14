import { Bookmark, Trash2, Save, Layers, Tags, Sun, Star, Calendar, Inbox, CheckCircle, User, Users, Folder, FileText, Tag, Clock, BarChart3 } from 'lucide-react';
import type { CustomView } from './TodoApp';
import type { TodoTask } from '../services/todoParser';
import { useState, useMemo } from 'react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface SidebarProps {
  currentView: 'todo' | 'archive' | 'dashboard';
  onViewChange: (view: 'todo' | 'archive' | 'dashboard') => void;
  selectedProject: string | null;
  selectedContext: string | null;
  onSelectProject: (project: string | null) => void;
  onSelectContext: (context: string | null) => void;
  customViews: CustomView[];
  activeSearchQuery: string;
  onSaveView: (name: string) => void;
  onDeleteView: (id: string) => void;
  onSelectView: (view: CustomView) => void;
  showCreationDate: boolean;
  onToggleShowCreationDate: (val: boolean) => void;
  groupBy: 'none' | 'project' | 'context' | 'priority' | 'due' | 'assignee';
  onGroupByChange: (val: 'none' | 'project' | 'context' | 'priority' | 'due' | 'assignee') => void;
  allTasks: TodoTask[];
  sortBy: 'default' | 'priority' | 'due' | 'creation' | 'alphabetical';
  onSortByChange: (val: 'default' | 'priority' | 'due' | 'creation' | 'alphabetical') => void;
  hideCompleted: boolean;
  onToggleHideCompleted: (val: boolean) => void;
  hideHidden: boolean;
  onToggleHideHidden: (val: boolean) => void;
  hideFutureThreshold: boolean;
  onToggleHideFutureThreshold: (val: boolean) => void;
  hideFutureDue: boolean;
  onToggleHideFutureDue: (val: boolean) => void;
  autoAddCreationDate: boolean;
  onToggleAutoAddCreationDate: (val: boolean) => void;
  
  // Theme, Sync and User Settings
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  storageMode: 'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive';
  onSwitchFile: () => void;
  onLogout: () => void;
  isOnline: boolean;
  syncing: boolean;
  hasPending: boolean;
  onSync: () => void;
  lastSyncTime: string | null;
  formatSyncTime: (dateStr: string | null) => string;

  // Attributes Filters state & callbacks
  selectedDue: string | null;
  onSelectDue: (due: string | null) => void;
  selectedCreationDate: string | null;
  onSelectCreationDate: (date: string | null) => void;
  selectedThresholdDate: string | null;
  onSelectThresholdDate: (date: string | null) => void;
  selectedCompletionDate: string | null;
  onSelectCompletionDate: (date: string | null) => void;

  // Customizable Presets
  projectPreset: string;
  contextPreset: string;
  datePreset: string;
  onProjectPresetChange: (val: string) => void;
  onContextPresetChange: (val: string) => void;
  onDatePresetChange: (val: string) => void;

  notificationsEnabled: boolean;
  onToggleNotifications: (val: boolean) => void;

  activeSmartView: any;
  onSelectSmartView: (view: any) => void;
  selectedAssignee: string | null;
  onSelectAssignee: (assignee: string | null) => void;
  contextEmojis: Record<string, string>;
  onUpdateContextEmoji: (context: string, emoji: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  language: Language;
}

const localTexts: Record<Language, { noSavedSearches: string; deleteView: string; noActiveContexts: string; noActiveProjects: string; }> = {
  de: {
    noSavedSearches: 'Keine gespeicherten Suchen',
    deleteView: 'Ansicht löschen',
    noActiveContexts: 'Keine Kontexte aktiv',
    noActiveProjects: 'Keine Projekte aktiv'
  },
  en: {
    noSavedSearches: 'No saved searches',
    deleteView: 'Delete view',
    noActiveContexts: 'No active contexts',
    noActiveProjects: 'No active projects'
  },
  la: {
    noSavedSearches: 'Nullae quaestiones servatae',
    deleteView: 'Delere visum',
    noActiveContexts: 'Nulli contextus activi',
    noActiveProjects: 'Nulla proiecta activa'
  },
  fr: {
    noSavedSearches: 'Aucune recherche enregistrée',
    deleteView: 'Supprimer la vue',
    noActiveContexts: 'Aucun contexte actif',
    noActiveProjects: 'Aucun projet actif'
  },
  it: {
    noSavedSearches: 'Nessuna ricerca salvata',
    deleteView: 'Elimina vista',
    noActiveContexts: 'Nessun contesto attivo',
    noActiveProjects: 'Nessun progetto attivo'
  },
  es: {
    noSavedSearches: 'No hay búsquedas guardadas',
    deleteView: 'Eliminar vista',
    noActiveContexts: 'No hay contextos activos',
    noActiveProjects: 'No hay proyectos activos'
  },
  zh: {
    noSavedSearches: '没有保存的搜索',
    deleteView: '删除视图',
    noActiveContexts: '无活动情境',
    noActiveProjects: '无活动项目'
  },
  ar: {
    noSavedSearches: 'لا توجد عمليات بحث محفوظة',
    deleteView: 'حذف العرض',
    noActiveContexts: 'لا توجد سياقات نشطة',
    noActiveProjects: 'لا توجد مشاريع نشطة'
  },
  hi: {
    noSavedSearches: 'कोई सहेजी गई खोज नहीं',
    deleteView: 'दृश्य हटाएं',
    noActiveContexts: 'कोई सक्रिय संदर्भ नहीं',
    noActiveProjects: 'कोई सक्रिय परियोजनाएं नहीं'
  },
  pt: {
    noSavedSearches: 'Nenhuma busca salva',
    deleteView: 'Excluir visualização',
    noActiveContexts: 'Nenhum contexto ativo',
    noActiveProjects: 'Nenhum projeto ativo'
  },
  sw: {
    noSavedSearches: 'Kei gspeicherte Suchen da',
    deleteView: 'View löschd',
    noActiveContexts: 'Kei Kontexte aktiv',
    noActiveProjects: 'Kei Projekte aktiv'
  },
  uk: {
    noSavedSearches: 'Немає збережених пошуків',
    deleteView: 'Видалити вигляд',
    noActiveContexts: 'Немає активних контекстів',
    noActiveProjects: 'Немає активних проєктів'
  },
  he: {
    noSavedSearches: 'אין חיפושים שמורים',
    deleteView: 'מחק תצוגה',
    noActiveContexts: 'אין הקשרים פעילים',
    noActiveProjects: 'אין פרויקטים פעילים'
  },
  el: {
    noSavedSearches: 'Δεν υπάρχουν αποθηκευμένες αναζητήσεις',
    deleteView: 'Διαγραφή προβολής',
    noActiveContexts: 'Δεν υπάρχουν ενεργά πλαίσια',
    noActiveProjects: 'Δεν υπάρχουν ενεργά έργα'
  },
  tr: {
    noSavedSearches: 'Kaydedilmiş arama yok',
    deleteView: 'Görünümü sil',
    noActiveContexts: 'Aktif kapsam yok',
    noActiveProjects: 'Aktif proje yok'
  }
};

export const Sidebar = ({ 
  currentView,
  onViewChange,
  selectedProject, 
  selectedContext, 
  onSelectProject, 
  onSelectContext,
  customViews,
  activeSearchQuery,
  onSaveView,
  onDeleteView,
  onSelectView,
  showCreationDate: _showCreationDate,
  onToggleShowCreationDate: _onToggleShowCreationDate,
  groupBy: _groupBy,
  onGroupByChange: _onGroupByChange,
  allTasks,
  sortBy: _sortBy,
  onSortByChange: _onSortByChange,
  hideCompleted: _hideCompleted,
  onToggleHideCompleted: _onToggleHideCompleted,
  hideHidden: _hideHidden,
  onToggleHideHidden: _onToggleHideHidden,
  hideFutureThreshold: _hideFutureThreshold,
  onToggleHideFutureThreshold: _onToggleHideFutureThreshold,
  hideFutureDue: _hideFutureDue,
  onToggleHideFutureDue: _onToggleHideFutureDue,
  autoAddCreationDate: _autoAddCreationDate,
  onToggleAutoAddCreationDate: _onToggleAutoAddCreationDate,
  currentTheme: _currentTheme,
  onThemeChange: _onThemeChange,
  storageMode: _storageMode,
  onSwitchFile: _onSwitchFile,
  onLogout: _onLogout,
  isOnline: _isOnline,
  syncing: _syncing,
  hasPending: _hasPending,
  onSync: _onSync,
  lastSyncTime: _lastSyncTime,
  formatSyncTime: _formatSyncTime,
  selectedDue,
  onSelectDue: _onSelectDue,
  selectedCreationDate,
  onSelectCreationDate: _onSelectCreationDate,
  selectedThresholdDate,
  onSelectThresholdDate: _onSelectThresholdDate,
  selectedCompletionDate,
  onSelectCompletionDate: _onSelectCompletionDate,
  projectPreset: _projectPreset,
  contextPreset: _contextPreset,
  datePreset: _datePreset,
  onProjectPresetChange: _onProjectPresetChange,
  onContextPresetChange: _onContextPresetChange,
  onDatePresetChange: _onDatePresetChange,
  notificationsEnabled: _notificationsEnabled,
  onToggleNotifications: _onToggleNotifications,
  activeSmartView,
  onSelectSmartView,
  selectedAssignee,
  onSelectAssignee: _onSelectAssignee,
  contextEmojis,
  onUpdateContextEmoji: _onUpdateContextEmoji,
  isOpen = false,
  onClose: _onClose,
  language
}: SidebarProps) => {
  const texts = localTexts[language] || localTexts['en'];

  const [newViewName, setNewViewName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const hasActiveFilters = selectedProject !== null || 
                           selectedContext !== null || 
                           selectedDue !== null ||
                           selectedCreationDate !== null ||
                           selectedThresholdDate !== null ||
                           selectedCompletionDate !== null ||
                           selectedAssignee !== null ||
                           activeSearchQuery.trim() !== '';

  const handleSave = () => {
    if (newViewName.trim()) {
      onSaveView(newViewName);
      setNewViewName('');
      setShowSaveInput(false);
    }
  };

  // Attributes count mapping
  const attributeStats = useMemo(() => {
    const stats = {
      due: {} as Record<string, number>,
      contexts: {} as Record<string, number>,
      projects: {} as Record<string, number>,
      creation: {} as Record<string, number>,
      threshold: {} as Record<string, number>,
      completion: {} as Record<string, number>,
      assignee: {} as Record<string, number>
    };

    allTasks.forEach(task => {
      // Due Date
      const due = task.tags['due'];
      if (due) stats.due[due] = (stats.due[due] || 0) + 1;

      // Contexts
      task.contexts.forEach(ctx => {
        stats.contexts[ctx] = (stats.contexts[ctx] || 0) + 1;
      });

      // Projects
      task.projects.forEach(proj => {
        stats.projects[proj] = (stats.projects[proj] || 0) + 1;
      });

      // Assignee (who:)
      const who = task.tags['who'];
      if (who) {
        who.split(',').forEach(w => {
          stats.assignee[w] = (stats.assignee[w] || 0) + 1;
        });
      }

      // Creation Date
      const creation = task.creationDate;
      if (creation) stats.creation[creation] = (stats.creation[creation] || 0) + 1;

      // Threshold Date (t:)
      const t = task.tags['t'];
      if (t) stats.threshold[t] = (stats.threshold[t] || 0) + 1;

      // Completion Date
      const comp = task.completionDate;
      if (comp) stats.completion[comp] = (stats.completion[comp] || 0) + 1;
    });

    return stats;
  }, [allTasks]);

  const smartStats = useMemo(() => {
    const todayStr = (() => {
      const d = new Date();
      return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
    })();

    let myDay = 0;
    let important = 0;
    let planned = 0;
    let allCount = 0;
    let completed = 0;
    let assigned = 0;
    let tasksNoContext = 0;
    let gtdProjects = 0;
    let family = 0;
    let futureThreshold = 0;

    allTasks.forEach(task => {
      if (task.isCompleted) {
        completed++;
      } else {
        allCount++;
        if (task.priority === 'A' || task.tags['due'] === todayStr) myDay++;
        if (['A', 'B', 'C'].includes(task.priority || '')) important++;
        if (task.tags['due']) planned++;
        if (task.tags['who'] && task.tags['who'].split(',').includes('cornelius')) assigned++;
        if (task.contexts.length === 0) tasksNoContext++;
        if (task.projects.includes('gtd/projekt')) gtdProjects++;
        if (task.projects.includes('family')) family++;
        if (task.tags['t'] && task.tags['t'] > todayStr) futureThreshold++;
      }
    });

    return { myDay, important, planned, allCount, completed, assigned, tasksNoContext, gtdProjects, family, futureThreshold };
  }, [allTasks]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (_onClose) _onClose();
      const firstTask = document.querySelector('[tabindex="0"].group') as HTMLElement | null;
      if (firstTask) {
        firstTask.focus();
      } else {
        const mainInput = document.querySelector('input[placeholder^="Aufgabe hinzufügen"]') as HTMLElement | null;
        if (mainInput) mainInput.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const focusables = Array.from(document.querySelectorAll('.w-68 button, .w-68 input'));
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      if (index !== -1 && index < focusables.length - 1) {
        (focusables[index + 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const focusables = Array.from(document.querySelectorAll('.w-68 button, .w-68 input'));
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      if (index > 0) {
        (focusables[index - 1] as HTMLElement).focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const firstTask = document.querySelector('[tabindex="0"].group') as HTMLElement | null;
      if (firstTask) {
        firstTask.focus();
      }
    }
  };

  return (
    <div 
      onKeyDown={handleKeyDown}
      className={`w-68 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col h-full overflow-hidden transition-transform duration-300 z-30 fixed inset-y-0 left-0 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      
      {/* Tab-Inhalte */}
      <div 
        className="flex flex-col flex-1 overflow-y-auto no-scrollbar p-4 select-none"
        style={{ gap: 'var(--density-sidebar-space-y)' }}
      >
        
        {/* Gespeicherte Suchen */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Bookmark size={13} className="text-indigo-500" /> {t('sidebarCustomViews', language)}
          </h3>
          
          {customViews.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 px-1 mb-2 italic">{texts.noSavedSearches}</p>
          )}

          <ul className="flex flex-col mb-2" style={{ gap: 'var(--density-sidebar-list-gap, 2px)' }}>
            {customViews.map(view => {
              const isActive = selectedProject === view.project && 
                               selectedContext === view.context && 
                               activeSearchQuery === view.searchQuery;

              return (
                <li key={view.id} className="group/item flex items-center justify-between rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-800">
                  <button
                    onClick={() => onSelectView(view)}
                    className={`flex-1 text-left text-xs truncate cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isActive 
                        ? 'text-indigo-650 dark:text-indigo-400 font-semibold' 
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                    style={{
                      paddingTop: 'var(--density-sidebar-item-py)',
                      paddingBottom: 'var(--density-sidebar-item-py)',
                      paddingLeft: 'var(--density-sidebar-item-px)',
                      paddingRight: 'var(--density-sidebar-item-px)',
                    }}
                  >
                    {view.name}
                  </button>
                  <button
                    onClick={() => onDeleteView(view.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-655 dark:hover:text-red-400 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity mr-1 cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    title={texts.deleteView}
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>

          {hasActiveFilters && (
            <div>
              {!showSaveInput ? (
                <button
                  onClick={() => setShowSaveInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 hover:underline py-1.5 border border-dashed border-slate-350 dark:border-slate-800 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Save size={12} /> {t('sidebarCreateView', language)}
                </button>
              ) : (
                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder={t('sidebarViewNamePlaceholder', language)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 text-slate-900 dark:text-slate-50 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowSaveInput(false)}
                      className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {t('cancel', language)}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!newViewName.trim()}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1 rounded font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {t('save', language)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Smart-Listen */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers size={13} className="text-indigo-500" /> {t('sidebarSmartLists', language)}
          </h3>
          
          <ul className="flex flex-col" style={{ gap: 'var(--density-sidebar-list-gap, 2px)' }}>
            <li>
              <button
                onClick={() => {
                  onViewChange('dashboard');
                  if (_onClose) _onClose();
                }}
                className={`w-full flex items-center justify-between rounded-md text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100/50 dark:border-indigo-950/65' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                style={{
                  paddingTop: 'var(--density-sidebar-item-py)',
                  paddingBottom: 'var(--density-sidebar-item-py)',
                  paddingLeft: 'var(--density-sidebar-item-px)',
                  paddingRight: 'var(--density-sidebar-item-px)',
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  <BarChart3 size={14} className="text-indigo-500" />
                  <span className="truncate">{t('dashboardTitle', language).split(' ').pop()}</span>
                </span>
              </button>
            </li>

            {[
              { id: 'tasks-no-context', label: 'Inbox', icon: Inbox, count: smartStats.tasksNoContext, color: 'text-indigo-500' },
              { id: 'my-day', label: t('viewMyDay', language), icon: Sun, count: smartStats.myDay, color: 'text-amber-500' },
              { id: 'important', label: t('viewImportant', language), icon: Star, count: smartStats.important, color: 'text-rose-500' },
              { id: 'planned', label: t('viewPlanned', language), icon: Calendar, count: smartStats.planned, color: 'text-indigo-500' },
              { id: 'all', label: t('viewAll', language), icon: FileText, count: smartStats.allCount, color: 'text-teal-500' },
              { id: 'completed', label: t('viewCompleted', language), icon: CheckCircle, count: smartStats.completed, color: 'text-emerald-500' },
              { id: 'assigned', label: t('viewAssigned', language), icon: User, count: smartStats.assigned, color: 'text-cyan-500' },
              { id: 'gtd-projects', label: t('viewGtdProjects', language), icon: Folder, count: smartStats.gtdProjects, color: 'text-purple-500' },
              { id: 'family', label: t('viewFamily', language), icon: Users, count: smartStats.family, color: 'text-emerald-500' },
              { id: 'future-threshold', label: t('viewFutureThreshold', language), icon: Clock, count: smartStats.futureThreshold, color: 'text-orange-500' }
            ].map(item => {
              const isActive = currentView === 'todo' && activeSmartView === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange('todo');
                      onSelectSmartView(item.id);
                    }}
                    className={`w-full flex items-center justify-between rounded-md text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isActive 
                        ? 'bg-indigo-55 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100/50 dark:border-indigo-950/60' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    style={{
                      paddingTop: 'var(--density-sidebar-item-py)',
                      paddingBottom: 'var(--density-sidebar-item-py)',
                      paddingLeft: 'var(--density-sidebar-item-px)',
                      paddingRight: 'var(--density-sidebar-item-px)',
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon size={14} className={item.color} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Kontexte Schnellwahl */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tags size={13} className="text-indigo-500" /> {t('sidebarContexts', language)}
          </h3>

          {Object.keys(attributeStats.contexts).length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-650 px-1 mb-2 italic">{texts.noActiveContexts}</p>
          )}

          <ul className="flex flex-col" style={{ gap: 'var(--density-sidebar-list-gap, 2px)' }}>
            {Object.entries(attributeStats.contexts).sort((a,b)=>a[0].localeCompare(b[0])).map(([ctx, count]) => {
              const isSelected = selectedContext === ctx;
              return (
                <li key={ctx}>
                  <button
                    onClick={() => {
                      onSelectContext(isSelected ? null : ctx);
                      onSelectSmartView(null);
                      onSelectProject(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-md text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100/50 dark:border-indigo-950/60' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    style={{
                      paddingTop: 'var(--density-sidebar-item-py)',
                      paddingBottom: 'var(--density-sidebar-item-py)',
                      paddingLeft: 'var(--density-sidebar-item-px)',
                      paddingRight: 'var(--density-sidebar-item-px)',
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {contextEmojis[ctx] ? (
                        <span className="text-[13px] leading-none w-3.5 h-3.5 flex items-center justify-center">{contextEmojis[ctx]}</span>
                      ) : (
                        <Tag size={14} className="text-emerald-500" />
                      )}
                      <span className="truncate">@{ctx}</span>
                    </span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Projekte Schnellwahl */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Folder size={13} className="text-indigo-500" /> {t('sidebarProjects', language)}
          </h3>

          {Object.keys(attributeStats.projects).filter(proj => !(activeSmartView === 'family' && proj === 'family')).length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 px-1 mb-2 italic">{texts.noActiveProjects}</p>
          )}

          <ul className="flex flex-col" style={{ gap: 'var(--density-sidebar-list-gap, 2px)' }}>
            {Object.entries(attributeStats.projects).filter(([proj]) => !(activeSmartView === 'family' && proj === 'family')).sort((a,b)=>a[0].localeCompare(b[0])).map(([proj, count]) => {
              const isSelected = selectedProject === proj;
              return (
                <li key={proj}>
                  <button
                    onClick={() => {
                      onSelectProject(isSelected ? null : proj);
                      onSelectSmartView(null);
                      onSelectContext(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-md text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100/50 dark:border-indigo-950/60' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    style={{
                      paddingTop: 'var(--density-sidebar-item-py)',
                      paddingBottom: 'var(--density-sidebar-item-py)',
                      paddingLeft: 'var(--density-sidebar-item-px)',
                      paddingRight: 'var(--density-sidebar-item-px)',
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder size={14} className="text-purple-500" />
                      <span className="truncate">+{proj}</span>
                    </span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
