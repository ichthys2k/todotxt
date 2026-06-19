import { parseTodos, serializeTodos } from '../services/todoParser';
import type { TodoTask } from '../services/todoParser';

export function getCoreTaskText(line: string): string {
  let text = line.trim();
  if (text.startsWith('x ')) {
    text = text.substring(2).trim();
  }
  const priorityMatch = text.match(/^\(([A-Z])\)\s+/);
  if (priorityMatch) {
    text = text.substring(priorityMatch[0].length).trim();
  }
  // Strip date 1
  const dateMatch1 = text.match(/^\d{4}-\d{2}-\d{2}\s+/);
  if (dateMatch1) {
    text = text.substring(dateMatch1[0].length).trim();
    // Strip date 2
    const dateMatch2 = text.match(/^\d{4}-\d{2}-\d{2}\s+/);
    if (dateMatch2) {
      text = text.substring(dateMatch2[0].length).trim();
    }
  }
  return text;
}

export function mergeTodoContents(local: string, remote: string): string {
  const localTasks = parseTodos(local);
  const remoteTasks = parseTodos(remote);

  const localMap = new Map<string, TodoTask>();
  for (const task of localTasks) {
    if (task.id) {
      localMap.set(task.id, task);
    }
  }

  const remoteMap = new Map<string, TodoTask>();
  for (const task of remoteTasks) {
    if (task.id) {
      remoteMap.set(task.id, task);
    }
  }

  const mergedTasks: TodoTask[] = [];
  const handledIds = new Set<string>();

  // Process all remote tasks
  for (const [id, rTask] of remoteMap.entries()) {
    const lTask = localMap.get(id);
    handledIds.add(id);

    if (lTask) {
      // Both exist: if one is completed and the other is not, prefer the completed one.
      // Otherwise remote wins.
      if (lTask.isCompleted && !rTask.isCompleted) {
        mergedTasks.push(lTask);
      } else {
        mergedTasks.push(rTask);
      }
    } else {
      mergedTasks.push(rTask);
    }
  }

  // Add any local tasks that were not in remote
  for (const [id, lTask] of localMap.entries()) {
    if (!handledIds.has(id)) {
      mergedTasks.push(lTask);
    }
  }

  return serializeTodos(mergedTasks);
}

export function mergeConfigContents(local: string, remote: string): string {
  try {
    const localObj = JSON.parse(local || '{}');
    const remoteObj = JSON.parse(remote || '{}');
    
    const mergedObj = { ...remoteObj, ...localObj };
    
    if (localObj.customViews && remoteObj.customViews) {
      const viewsMap = new Map();
      for (const v of remoteObj.customViews) viewsMap.set(v.id, v);
      for (const v of localObj.customViews) viewsMap.set(v.id, v);
      mergedObj.customViews = Array.from(viewsMap.values());
    }
    
    if (localObj.contextEmojis && remoteObj.contextEmojis) {
      mergedObj.contextEmojis = { ...remoteObj.contextEmojis, ...localObj.contextEmojis };
    }
    
    if (localObj.settings && remoteObj.settings) {
      mergedObj.settings = { ...remoteObj.settings, ...localObj.settings };
    }
    
    return JSON.stringify(mergedObj, null, 2);
  } catch (e) {
    return local;
  }
}
