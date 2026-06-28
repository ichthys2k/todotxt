import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: any;

const sw = self as any;

// Precache assets compiled by Vite
precacheAndRoute(self.__WB_MANIFEST);

sw.skipWaiting();
clientsClaim();

const WIDGET_TAG = 'todotxt-tasks';
const CACHE_NAME = 'todo-widget-data';
const CACHE_KEY = '/widget-tasks.json';

// Helper to get cached tasks
async function getCachedTasks(): Promise<any[]> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(CACHE_KEY);
    if (response) {
      const data = await response.json();
      return data.tasks || [];
    }
  } catch (e) {
    console.error('Failed to read cached tasks for widget', e);
  }
  return [];
}

// Helper to save cached tasks
async function saveCachedTasks(tasks: any[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(CACHE_KEY, new Response(JSON.stringify({ tasks })));
  } catch (e) {
    console.error('Failed to write cached tasks for widget', e);
  }
}

// Helper to render/update the widget
async function updateWidget(): Promise<void> {
  try {
    // 1. Fetch the template
    const templateResponse = await fetch('./widgets/tasks-template.json');
    const templateText = await templateResponse.text();

    // 2. Fetch the current data
    const tasks = await getCachedTasks();
    const pendingTasks = tasks.filter((t: any) => !t.isCompleted);
    const widgetData = {
      tasks: pendingTasks.slice(0, 5).map((t: any) => ({
        id: t.id,
        priorityText: t.priority ? `(${t.priority}) ` : '',
        description: t.description || t.originalText || ''
      }))
    };

    // If there are no tasks, show a default info item
    if (widgetData.tasks.length === 0) {
      widgetData.tasks.push({
        id: 'no-tasks',
        priorityText: '',
        description: 'Keine anstehenden Aufgaben!'
      });
    }

    // 3. Update the widget via the standard MS API
    if ('widgets' in sw) {
      await sw.widgets.updateByTag(WIDGET_TAG, {
        template: templateText,
        data: JSON.stringify(widgetData)
      });
    }
  } catch (error) {
    console.error('Failed to update widget', error);
  }
}

// Event Listeners for Widgets
sw.addEventListener('widgetinstall', (event: any) => {
  event.waitUntil(updateWidget());
});

sw.addEventListener('widgetresume', (event: any) => {
  event.waitUntil(updateWidget());
});

sw.addEventListener('widgetclick', (event: any) => {
  event.waitUntil((async () => {
    const action = event.action;
    const data = event.data;

    if (action === 'refresh') {
      await updateWidget();
    } else if (action === 'complete-task') {
      const taskId = data?.taskId;
      if (taskId && taskId !== 'no-tasks') {
        let tasks = await getCachedTasks();
        
        // Find task and mark it completed (or remove it from the widget view)
        const updatedTasks = tasks.map((t: any) => {
          if (t.id === taskId) {
            return { ...t, isCompleted: true };
          }
          return t;
        });
        
        await saveCachedTasks(updatedTasks);
        await updateWidget();

        // Notify active web app clients to reload and sync the change
        const allClients = await sw.clients.matchAll({ type: 'window' });
        for (const client of allClients) {
          client.postMessage({ type: 'WIDGET_TASK_COMPLETED', taskId });
        }
      }
    } else if (action === 'add-task') {
      const newTaskText = data?.newTaskText?.trim();
      if (newTaskText) {
        let tasks = await getCachedTasks();
        const newTask = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          description: newTaskText,
          priority: null,
          isCompleted: false,
          originalText: newTaskText,
          projects: [],
          contexts: [],
          tags: {},
          creationDate: new Date().toISOString().split('T')[0],
          isFromWidget: true
        };
        tasks.push(newTask);
        
        await saveCachedTasks(tasks);
        await updateWidget();

        // Notify active web app clients to add and sync the change
        const allClients = await sw.clients.matchAll({ type: 'window' });
        for (const client of allClients) {
          client.postMessage({ type: 'WIDGET_TASK_ADDED', task: newTask });
        }
      }
    }
  })());
});
