import { useState, useEffect } from 'react';
import { fetchTodoContent, saveTodoContent } from '../services/storageService';
import { parseTodos, serializeTodos, completeTask, getTodayDate } from '../services/todoParser';
import type { TodoTask } from '../services/todoParser';
import { Check, Plus, ExternalLink, X, RefreshCw } from 'lucide-react';

export const WidgetView = () => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageMode = (localStorage.getItem('todo_txt_last_mode') as any) || 'local';

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const content = await fetchTodoContent(storageMode);
      const parsed = parseTodos(content);
      setTasks(parsed);
    } catch (e: any) {
      console.error('Widget failed to load tasks:', e);
      setError(e.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      const taskToComplete = tasks.find(t => t.id === taskId);
      if (!taskToComplete) return;

      const completed = completeTask(taskToComplete);
      const updatedTasks = tasks.flatMap(t => t.id === taskId ? completed : t);
      
      setTasks(updatedTasks);
      await saveTodoContent(storageMode, serializeTodos(updatedTasks));
    } catch (e: any) {
      console.error('Widget failed to complete task:', e);
      setError('Fehler beim Abhaken');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      const today = getTodayDate();
      const newTask: TodoTask = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        description: newTaskText,
        priority: null,
        isCompleted: false,
        originalText: newTaskText,
        projects: [],
        contexts: [],
        tags: {},
        creationDate: today,
        completionDate: null
      };

      // Extract projects and contexts
      const words = newTaskText.split(/\s+/);
      words.forEach(word => {
        if (word.startsWith('+') && word.length > 1) {
          newTask.projects.push(word.substring(1));
        } else if (word.startsWith('@') && word.length > 1) {
          newTask.contexts.push(word.substring(1));
        }
      });

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setNewTaskText('');
      await saveTodoContent(storageMode, serializeTodos(updatedTasks));
    } catch (e: any) {
      console.error('Widget failed to add task:', e);
      setError('Fehler beim Hinzufügen');
    }
  };

  const openMainApp = () => {
    if (window.electronAPI?.showMainWindow) {
      window.electronAPI.showMainWindow();
    }
  };

  const closeWidget = () => {
    if (window.electronAPI?.closeWidgetWindow) {
      window.electronAPI.closeWidgetWindow();
    }
  };

  const activeTasks = tasks.filter(t => !t.isCompleted).slice(0, 6);

  return (
    <div className="w-full h-full min-h-screen bg-slate-900/90 text-slate-100 flex flex-col font-sans backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl p-4">
      {/* Header (Drag Region) */}
      <div 
        className="flex items-center justify-between pb-3 border-b border-slate-800 cursor-move select-none"
        style={{ WebKitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <h1 className="text-sm font-bold tracking-wider text-slate-300 uppercase">Todo.txt Widget</h1>
        </div>
        
        {/* Buttons (No-Drag Region) */}
        <div className="flex items-center gap-1.5" style={{ WebKitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={loadTasks}
            title="Aktualisieren"
            className="p-1.5 rounded-md hover:bg-slate-800/80 text-slate-400 hover:text-indigo-400 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={openMainApp}
            title="App öffnen"
            className="p-1.5 rounded-md hover:bg-slate-800/80 text-slate-400 hover:text-indigo-400 transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={closeWidget}
            title="Schließen"
            className="p-1.5 rounded-md hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input section */}
      <form onSubmit={handleAddTask} className="mt-4 flex gap-2" style={{ WebKitAppRegion: 'no-drag' } as any}>
        <input 
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Schnelle Aufgabe..."
          className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white p-2 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Task List */}
      <div 
        className="flex-1 mt-4 overflow-y-auto pr-1 space-y-2 select-none" 
        style={{ WebKitAppRegion: 'no-drag' } as any}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 text-xs py-10 bg-red-950/20 border border-red-900/30 rounded-lg p-3">
            {error}
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-12">
            Keine aktiven Aufgaben! 🎉
          </div>
        ) : (
          activeTasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-start gap-2.5 bg-slate-950/40 hover:bg-slate-950/60 border border-slate-800/60 hover:border-slate-800 rounded-lg p-2.5 transition-all group"
            >
              <button 
                onClick={() => handleCompleteTask(task.id)}
                className="mt-0.5 w-4 h-4 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center transition-all active:scale-90"
              >
                <Check className="w-3 h-3 text-transparent group-hover:text-indigo-400 hover:text-white" />
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {task.priority && (
                    <span className="font-bold text-indigo-400 mr-1.5">({task.priority})</span>
                  )}
                  {task.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between select-none">
        <span>Modus: {storageMode === 'local' ? 'Lokal' : storageMode.toUpperCase()}</span>
        <span>{tasks.filter(t => !t.isCompleted).length} Aufgaben verbleibend</span>
      </div>
    </div>
  );
};
