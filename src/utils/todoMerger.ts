import { parseTask, serializeTask } from '../services/todoParser';
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

const toLines = (content: string): string[] =>
  content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const countLines = (lines: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);
  return counts;
};

/**
 * Wählt bei zwei Fassungen derselben Aufgabe (gleiche id:) die gültige aus:
 * höheres upd: gewinnt, bei Gleichstand die erledigte, sonst die erste.
 */
const pickById = (a: TodoTask, b: TodoTask): TodoTask => {
  const aUpd = parseInt(a.tags['upd'] || '0', 10);
  const bUpd = parseInt(b.tags['upd'] || '0', 10);
  if (bUpd > aUpd) return b;
  if (aUpd > bUpd) return a;
  if (b.isCompleted && !a.isCompleted) return b;
  return a;
};

/** Entfernt doppelte id:-Einträge; der Gewinner steht an der Stelle des ersten Vorkommens. */
const dedupeById = (lines: string[]): string[] => {
  const winners = new Map<string, TodoTask>();
  for (const line of lines) {
    const task = parseTask(line);
    const id = task.tags['id'];
    if (!id) continue;
    const existing = winners.get(id);
    winners.set(id, existing ? pickById(existing, task) : task);
  }
  const emitted = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const id = parseTask(line).tags['id'];
    if (!id) {
      result.push(line);
    } else if (!emitted.has(id)) {
      emitted.add(id);
      result.push(winners.get(id)!.originalText.trim());
    }
  }
  return result;
};

/**
 * Drei-Wege-Merge auf Zeilenebene.
 *
 * - base:   letzter gemeinsamer Stand (zuletzt gelesene/geschriebene Datei)
 * - local:  Stand der App (mit den Änderungen des Nutzers)
 * - remote: aktueller Stand auf der Platte (extern geändert)
 *
 * Eine Bearbeitung zählt als „alte Zeile gelöscht + neue Zeile hinzugefügt“.
 * Dadurch werden Löschungen beider Seiten respektiert und es entstehen keine
 * Doppelten. Die Zeilen bleiben unverändert (kein Neu-Serialisieren).
 */
const mergeWithBase = (local: string, remote: string, base: string): string => {
  const localLines = toLines(local);
  const remoteLines = toLines(remote);
  const baseCounts = countLines(toLines(base));
  const remoteCounts = countLines(remoteLines);
  const localCounts = countLines(localLines);

  // Zeilen, die extern entfernt wurden (wie oft)
  const removedRemotely = new Map<string, number>();
  for (const [line, inBase] of baseCounts) {
    const inRemote = remoteCounts.get(line) || 0;
    if (inBase > inRemote) removedRemotely.set(line, inBase - inRemote);
  }

  // 1. Lokaler Stand in lokaler Reihenfolge, ohne extern gelöschte Zeilen
  const result: string[] = [];
  for (const line of localLines) {
    const toRemove = removedRemotely.get(line) || 0;
    if (toRemove > 0) {
      removedRemotely.set(line, toRemove - 1);
      continue;
    }
    result.push(line);
  }

  // 2. Extern neu hinzugekommene Zeilen anhängen (sofern lokal nicht ebenfalls hinzugefügt)
  const appended = new Map<string, number>();
  for (const line of remoteLines) {
    const inBase = baseCounts.get(line) || 0;
    const addedRemotely = (remoteCounts.get(line) || 0) - inBase;
    const addedLocally = Math.max(0, (localCounts.get(line) || 0) - inBase);
    const toAppend = addedRemotely - addedLocally;
    const done = appended.get(line) || 0;
    if (done < toAppend) {
      result.push(line);
      appended.set(line, done + 1);
    }
  }

  return dedupeById(result).join('\n') + '\n';
};

/**
 * Führt den Stand der App (local) mit dem aktuellen Dateistand (remote) zusammen.
 * Mit base (letzter gemeinsamer Stand) wird ein Drei-Wege-Merge gemacht, der auch
 * Löschungen erkennt. Ohne base wird auf das ältere Vereinigungs-Verfahren zurückgegriffen.
 */
export function mergeTodoContents(local: string, remote: string, base?: string): string {
  if (base && base.trim()) {
    return mergeWithBase(local, remote, base);
  }
  return mergeWithoutBase(local, remote);
}

function mergeWithoutBase(local: string, remote: string): string {
  const localLines = local.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const remoteLines = remote.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const localTasks = localLines.map(parseTask);
  const remoteTasks = remoteLines.map(parseTask);

  const idMap = new Map<string, TodoTask>();
  const localNoId: TodoTask[] = [];
  const remoteNoId: TodoTask[] = [];

  // Group local tasks
  for (const t of localTasks) {
    const id = t.tags['id'];
    if (id) {
      idMap.set(id, t);
    } else {
      localNoId.push(t);
    }
  }

  // Merge remote tasks into the map
  for (const t of remoteTasks) {
    const id = t.tags['id'];
    if (id) {
      const existing = idMap.get(id);
      if (existing) {
        // Compare timestamps
        const existingUpd = parseInt(existing.tags['upd'] || '0', 10);
        const remoteUpd = parseInt(t.tags['upd'] || '0', 10);
        if (remoteUpd > existingUpd) {
          idMap.set(id, t);
        } else if (existingUpd > remoteUpd) {
          // Keep existing local
        } else {
          // Equal timestamps, resolve by completion status (completed wins)
          if (t.isCompleted && !existing.isCompleted) {
            idMap.set(id, t);
          }
        }
      } else {
        idMap.set(id, t);
      }
    } else {
      remoteNoId.push(t);
    }
  }

  // Resolve tasks without IDs using the traditional core-text comparison
  // Group no-ID tasks by core text
  const localNoIdMap = new Map<string, TodoTask[]>();
  for (const t of localNoId) {
    const core = getCoreTaskText(t.originalText);
    if (!localNoIdMap.has(core)) {
      localNoIdMap.set(core, []);
    }
    localNoIdMap.get(core)!.push(t);
  }

  const remoteNoIdMap = new Map<string, TodoTask[]>();
  for (const t of remoteNoId) {
    const core = getCoreTaskText(t.originalText);
    if (!remoteNoIdMap.has(core)) {
      remoteNoIdMap.set(core, []);
    }
    remoteNoIdMap.get(core)!.push(t);
  }

  const mergedNoIdTasks: TodoTask[] = [];
  const handledCores = new Set<string>();

  for (const [core, rTasks] of remoteNoIdMap.entries()) {
    const lTasks = localNoIdMap.get(core) || [];
    handledCores.add(core);

    const maxLen = Math.max(rTasks.length, lTasks.length);
    for (let i = 0; i < maxLen; i++) {
      const rTask = rTasks[i];
      const lTask = lTasks[i];

      if (rTask && lTask) {
        if (lTask.isCompleted && !rTask.isCompleted) {
          mergedNoIdTasks.push(lTask);
        } else {
          mergedNoIdTasks.push(rTask);
        }
      } else if (rTask) {
        mergedNoIdTasks.push(rTask);
      } else if (lTask) {
        mergedNoIdTasks.push(lTask);
      }
    }
  }

  for (const [core, lTasks] of localNoIdMap.entries()) {
    if (!handledCores.has(core)) {
      for (const lTask of lTasks) {
        mergedNoIdTasks.push(lTask);
      }
    }
  }

  // Combine tasks from map and merged no-ID list
  const allMergedTasks = [...idMap.values(), ...mergedNoIdTasks];

  return allMergedTasks.map(serializeTask).join('\n') + '\n';
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
  } catch {
    return local;
  }
}
