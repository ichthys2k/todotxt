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
  const localLines = local.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const remoteLines = remote.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Map core task text to lines
  const localMap = new Map<string, string[]>();
  for (const line of localLines) {
    const core = getCoreTaskText(line);
    if (!localMap.has(core)) {
      localMap.set(core, []);
    }
    localMap.get(core)!.push(line);
  }

  const remoteMap = new Map<string, string[]>();
  for (const line of remoteLines) {
    const core = getCoreTaskText(line);
    if (!remoteMap.has(core)) {
      remoteMap.set(core, []);
    }
    remoteMap.get(core)!.push(line);
  }

  const mergedLines: string[] = [];
  const handledLocalCores = new Set<string>();

  // Process all remote core tasks
  for (const [core, rLines] of remoteMap.entries()) {
    const lLines = localMap.get(core) || [];
    handledLocalCores.add(core);

    const maxLen = Math.max(rLines.length, lLines.length);
    for (let i = 0; i < maxLen; i++) {
      const rLine = rLines[i];
      const lLine = lLines[i];

      if (rLine && lLine) {
        const rIsCompleted = rLine.trim().startsWith('x ');
        const lIsCompleted = lLine.trim().startsWith('x ');
        if (lIsCompleted && !rIsCompleted) {
          mergedLines.push(lLine);
        } else {
          mergedLines.push(rLine);
        }
      } else if (rLine) {
        mergedLines.push(rLine);
      } else if (lLine) {
        mergedLines.push(lLine);
      }
    }
  }

  // Add any local core tasks that were not in remote
  for (const [core, lLines] of localMap.entries()) {
    if (!handledLocalCores.has(core)) {
      for (const lLine of lLines) {
        mergedLines.push(lLine);
      }
    }
  }

  return mergedLines.join('\n') + '\n';
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
