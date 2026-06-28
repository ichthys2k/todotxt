// Service für Natural Language Parsing im Eingabefeld

export interface NLPResult {
  cleanText: string;
  priority: string | null;
  dueDate: string | null;
}

const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getNextWeekdayDate = (dayName: string): Date => {
  const weekdays: Record<string, number> = {
    'sonntag': 0, 'so': 0,
    'montag': 1, 'mo': 1,
    'dienstag': 2, 'di': 2,
    'mittwoch': 3, 'mi': 3,
    'donnerstag': 4, 'do': 4,
    'freitag': 5, 'fr': 5,
    'samstag': 6, 'sa': 6
  };
  
  const targetDay = weekdays[dayName.toLowerCase()];
  const result = new Date();
  const currentDay = result.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  result.setDate(result.getDate() + daysToAdd);
  return result;
};

export const parseNaturalLanguage = (text: string): NLPResult => {
  let workingText = text;
  let priority: string | null = null;
  let dueDate: string | null = null;

  // 1. Prioritäten parsen (nur (A-Z) am Anfang)
  const prioRegex = /^\(([A-Z])\)\s/;
  const prioMatch = workingText.match(prioRegex);
  if (prioMatch) {
    priority = prioMatch[1];
    workingText = workingText.replace(prioRegex, '');
  }

  // 2. Fälligkeitsdaten parsen
  const today = new Date();
  
  // "due:wochentag" (z. B. due:dienstag)
  const dueWeekdayRegex = /\bdue:(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\b/i;
  const dueWeekdayMatch = workingText.match(dueWeekdayRegex);
  if (!dueDate && dueWeekdayMatch) {
    const dayName = dueWeekdayMatch[1];
    dueDate = formatDate(getNextWeekdayDate(dayName));
    workingText = workingText.replace(dueWeekdayRegex, '');
  }

  // "in X tagen"
  const inTagenRegex = /\bin\s+(\d+)\s*(tagen|tage|t)\b/i;
  const inTagenMatch = workingText.match(inTagenRegex);
  if (!dueDate && inTagenMatch) {
    const days = parseInt(inTagenMatch[1], 10);
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);
    dueDate = formatDate(targetDate);
    workingText = workingText.replace(inTagenRegex, '');
  }

  // "in X wochen"
  const inWochenRegex = /\bin\s+(\d+)\s*(wochen|woche|w)\b/i;
  const inWochenMatch = workingText.match(inWochenRegex);
  if (!dueDate && inWochenMatch) {
    const weeks = parseInt(inWochenMatch[1], 10);
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + weeks * 7);
    dueDate = formatDate(targetDate);
    workingText = workingText.replace(inWochenRegex, '');
  }

  // "am DD.MM."
  const amDateRegex = /\bam\s+(\d{1,2})\.(\d{1,2})\.?\b/i;
  const amDateMatch = workingText.match(amDateRegex);
  if (!dueDate && amDateMatch) {
    const day = parseInt(amDateMatch[1], 10);
    const month = parseInt(amDateMatch[2], 10) - 1; // 0-indexed month
    const targetDate = new Date(today.getFullYear(), month, day);
    // Falls das Datum in diesem Jahr vergangen ist, nimm das nächste Jahr
    if (targetDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      targetDate.setFullYear(today.getFullYear() + 1);
    }
    dueDate = formatDate(targetDate);
    workingText = workingText.replace(amDateRegex, '');
  }

  // "wochenende"
  const wochenendeRegex = /\bwochenende\b/i;
  if (!dueDate && wochenendeRegex.test(workingText)) {
    const targetDate = new Date();
    const day = targetDate.getDay();
    let daysToAdd = 6 - day;
    if (daysToAdd <= 0) daysToAdd += 7;
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    dueDate = formatDate(targetDate);
    workingText = workingText.replace(wochenendeRegex, '');
  }

  // "monatsende"
  const monatsendeRegex = /\bmonatsende\b/i;
  if (!dueDate && monatsendeRegex.test(workingText)) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    dueDate = formatDate(targetDate);
    workingText = workingText.replace(monatsendeRegex, '');
  }
  
  // "heute"
  const heuteRegex = /\bheute\b/i;
  if (!dueDate && heuteRegex.test(workingText)) {
    dueDate = formatDate(today);
    workingText = workingText.replace(heuteRegex, '');
  }
  
  // "morgen"
  const morgenRegex = /\bmorgen\b/i;
  if (!dueDate && morgenRegex.test(workingText)) {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    dueDate = formatDate(tomorrow);
    workingText = workingText.replace(morgenRegex, '');
  }
  
  // "übermorgen"
  const uebermorgenRegex = /\bübermorgen\b/i;
  if (!dueDate && uebermorgenRegex.test(workingText)) {
    const dayAfter = new Date();
    dayAfter.setDate(today.getDate() + 2);
    dueDate = formatDate(dayAfter);
    workingText = workingText.replace(uebermorgenRegex, '');
  }
  
  // "nächste woche"
  const naechsteWocheRegex = /\bnächste[n]? woche\b/i;
  if (!dueDate && naechsteWocheRegex.test(workingText)) {
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    dueDate = formatDate(nextWeek);
    workingText = workingText.replace(naechsteWocheRegex, '');
  }

  // Wochentage (montag, dienstag, etc.)
  const weekdaysList = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag', 'mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
  for (const day of weekdaysList) {
    if (dueDate) break;
    const dayRegex = new RegExp(`\\b${day}\\b`, 'i');
    if (dayRegex.test(workingText)) {
      dueDate = formatDate(getNextWeekdayDate(day));
      workingText = workingText.replace(dayRegex, '');
      break;
    }
  }

  // Bereinigung von doppelten Leerzeichen
  const cleanText = workingText.replace(/\s+/g, ' ').trim();

  return {
    cleanText,
    priority,
    dueDate
  };
};
