export interface TodoTask {
  id: string; // Generierte ID für React-Rendering
  originalText: string;
  isCompleted: boolean;
  priority: string | null; // A-Z
  completionDate: string | null; // YYYY-MM-DD
  creationDate: string | null; // YYYY-MM-DD
  description: string;
  projects: string[];
  contexts: string[];
  tags: Record<string, string>;
}

/**
 * Generiert ein aktuelles Datum im YYYY-MM-DD Format
 */
export const getTodayDate = (): string => {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

/**
 * Parst eine einzelne todo.txt Zeile in ein TodoTask-Objekt
 */
export const parseTask = (line: string): TodoTask => {
  let text = line.trim();
  const task: TodoTask = {
    id: crypto.randomUUID(),
    originalText: line,
    isCompleted: false,
    priority: null,
    completionDate: null,
    creationDate: null,
    description: '',
    projects: [],
    contexts: [],
    tags: {},
  };

  if (!text) return task;

  // 1. Completion Status
  if (text.startsWith('x ')) {
    task.isCompleted = true;
    text = text.substring(2).trim();
  }

  // 2. Priority
  const priorityMatch = text.match(/^\(([A-Z])\)\s/);
  if (priorityMatch) {
    task.priority = priorityMatch[1];
    text = text.substring(4).trim();
  }

  // 3. Dates (Completion & Creation)
  // Format: YYYY-MM-DD
  const dateRegex = /^(\d{4}-\d{2}-\d{2})\s/;
  
  // Wenn abgeschlossen, prüfen wir auf ZWEI Daten (Completion + Creation) oder EIN Datum (Creation)
  if (task.isCompleted) {
    const firstDateMatch = text.match(dateRegex);
    if (firstDateMatch) {
      const firstDate = firstDateMatch[1];
      text = text.substring(11).trim();
      
      const secondDateMatch = text.match(dateRegex);
      if (secondDateMatch) {
        task.completionDate = firstDate;
        task.creationDate = secondDateMatch[1];
        text = text.substring(11).trim();
      } else {
        // Nur ein Datum gefunden bei erledigter Aufgabe. Offizielle Syntax sagt, das erste ist Completion Date
        // Aber viele Clients machen es falsch. Wir halten uns an den Standard:
        task.completionDate = firstDate;
      }
    }
  } else {
    // Wenn nicht abgeschlossen, gibt es höchstens EIN Datum (Creation)
    const creationDateMatch = text.match(dateRegex);
    if (creationDateMatch) {
      task.creationDate = creationDateMatch[1];
      text = text.substring(11).trim();
    }
  }

  task.description = text;

  // 4. Projects & Contexts & Tags extrahieren
  const words = text.split(/\s+/);
  words.forEach(word => {
    if (word.startsWith('+') && word.length > 1) {
      task.projects.push(word.substring(1));
    } else if (word.startsWith('@') && word.length > 1) {
      task.contexts.push(word.substring(1));
    } else if (word.includes(':')) {
      const [key, ...valueParts] = word.split(':');
      if (key && valueParts.length > 0) {
        const val = valueParts.join(':');
        if (key === 'who') {
          if (task.tags['who']) {
            task.tags['who'] = `${task.tags['who']},${val}`;
          } else {
            task.tags['who'] = val;
          }
        } else {
          task.tags[key] = val;
        }
      }
    }
  });

  return task;
};

/**
 * Parst den gesamten Inhalt einer todo.txt Datei
 */
export const parseTodos = (content: string): TodoTask[] => {
  if (!content) return [];
  return content.split(/\r?\n/)
    .filter(line => line.trim() !== '')
    .map(parseTask);
};

/**
 * Serialisiert ein TodoTask-Objekt zurück in eine Zeile
 */
export const serializeTask = (task: TodoTask): string => {
  const parts: string[] = [];

  if (task.isCompleted) {
    parts.push('x');
    if (task.completionDate) parts.push(task.completionDate);
  }

  if (task.priority && !task.isCompleted) {
    parts.push(`(${task.priority})`);
  }

  if (task.creationDate) {
    parts.push(task.creationDate);
  }

  parts.push(task.description);

  return parts.join(' ');
};

/**
 * Serialisiert ein Array von TodoTasks in den Datei-Inhalt
 */
export const serializeTodos = (tasks: TodoTask[]): string => {
  return tasks.map(serializeTask).join('\n');
};

/**
 * Hilfsfunktion zum Berechnen des nächsten Fälligkeitsdatums basierend auf rec:
 */
const calculateNextDate = (baseDateStr: string, recRule: string): string => {
  const date = new Date(baseDateStr);
  if (isNaN(date.getTime())) return baseDateStr;

  const match = recRule.match(/^(\+)?(\d+)([dwmy])$/);
  if (!match) return baseDateStr;

  const [, , amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);

  switch (unit) {
    case 'd': date.setDate(date.getDate() + amount); break;
    case 'w': date.setDate(date.getDate() + (amount * 7)); break;
    case 'm': date.setMonth(date.getMonth() + amount); break;
    case 'y': date.setFullYear(date.getFullYear() + amount); break;
  }

  const month = '' + (date.getMonth() + 1);
  const day = '' + date.getDate();
  const year = date.getFullYear();

  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

/**
 * Markiert einen Task als erledigt.
 * Behandelt die Wiederholungslogik (rec:), falls vorhanden.
 * @returns Ein Array mit dem aktualisierten (erledigten) Task und ggf. einem neu erstellten Folge-Task.
 */
export const completeTask = (task: TodoTask): TodoTask[] => {
  if (task.isCompleted) return [task]; // Bereits erledigt

  const today = getTodayDate();
  
  // Kopie des Tasks für die Erledigung
  const completedTask = { ...task };
  completedTask.isCompleted = true;
  completedTask.completionDate = today;

  // Wiederholungslogik prüfen
  if (task.tags['rec']) {
    const recRule = task.tags['rec'];
    const isStrict = recRule.startsWith('+'); // Relativ zum alten due date vs. relativ zu heute
    
    // Neuer Task wird erstellt (nicht erledigt)
    const newTask = { ...task, id: crypto.randomUUID() };
    
    let baseDateForRec = today;
    if (isStrict && task.tags['due']) {
      baseDateForRec = task.tags['due'];
    } else if (!isStrict && task.tags['due']) {
      // Wenn nicht strict, aber ein due date da ist, berechnen wir ab heute
      baseDateForRec = today;
    }

    if (task.tags['due']) {
      const nextDue = calculateNextDate(baseDateForRec, recRule);
      // Im description String den due: Tag ersetzen
      const oldDueTag = `due:${task.tags['due']}`;
      const newDueTag = `due:${nextDue}`;
      newTask.description = newTask.description.replace(oldDueTag, newDueTag);
      newTask.tags['due'] = nextDue;
    }

    // Wenn es einen t: Tag (threshold) gibt, diesen ebenfalls verschieben (vereinfachte Logik: gleicher Abstand wie due)
    if (task.tags['t'] && task.tags['due']) {
       const nextT = calculateNextDate(isStrict ? task.tags['t'] : today, recRule); // Hier könnte man noch exakter den Abstand berechnen
       const oldTTag = `t:${task.tags['t']}`;
       const newTTag = `t:${nextT}`;
       newTask.description = newTask.description.replace(oldTTag, newTTag);
       newTask.tags['t'] = nextT;
    }

    // Für die saubere Serialisierung sollte das Original-Textfeld aktualisiert werden, aber das passiert bei der Serialisierung automatisch durch die Parts.
    // Allerdings nutzt unsere aktuelle serializeTask die "description" direkt für alles, was nach Datum/Priority kommt.
    // Da wir die description oben manipuliert haben, passt es.

    return [completedTask, newTask];
  }

  return [completedTask];
};

/**
 * Aktualisiert das Fälligkeitsdatum (due:YYYY-MM-DD) in der Beschreibung des Tasks.
 */
export const updateTaskDueDate = (task: TodoTask, newDueDate: string | null): TodoTask => {
  const updatedTask = { ...task };
  const currentDue = task.tags['due'];

  let newDesc = task.description;

  if (currentDue) {
    if (newDueDate) {
      newDesc = newDesc.replace(`due:${currentDue}`, `due:${newDueDate}`);
      updatedTask.tags = { ...task.tags, due: newDueDate };
    } else {
      newDesc = newDesc.replace(`due:${currentDue}`, '').replace(/\s+/g, ' ').trim();
      const newTags = { ...task.tags };
      delete newTags['due'];
      updatedTask.tags = newTags;
    }
  } else {
    if (newDueDate) {
      newDesc = newDesc.trim() ? `${newDesc.trim()} due:${newDueDate}` : `due:${newDueDate}`;
      updatedTask.tags = { ...task.tags, due: newDueDate };
    }
  }

  updatedTask.description = newDesc;
  return updatedTask;
};
