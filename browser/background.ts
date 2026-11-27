/* eslint-disable @typescript-eslint/no-explicit-any -- chrome.* is used without its type package */
/**
 * Service worker of the Todo.txt browser extension:
 * - toolbar button opens the side panel (also Ctrl+Shift+Y)
 * - right-click: save the selected text, a link or the page as a task
 * - address bar: "todo <task>" adds a task (natural dates like "morgen", "freitag")
 * - badge: number of tasks due today or overdue (red when something is overdue)
 */
import { parseTodos, getTodayDate } from '../src/services/todoParser';
import { parseNaturalLanguage } from '../src/services/nlpParser';

declare const chrome: any;

const HOST_NAME = 'de.lipponer.todotxt';
const host = (op: string, args: Record<string, unknown> = {}): Promise<any> =>
  chrome.runtime.sendNativeMessage(HOST_NAME, { id: 1, op, ...args }).then((r: any) => {
    if (!r?.ok) throw new Error(r?.error || 'Hilfsprogramm nicht erreichbar');
    return r;
  });

// ---------- badge ----------
async function updateBadge() {
  try {
    const { todo } = await host('paths');
    const { content } = await host('read', { path: todo });
    const today = getTodayDate();
    const open = parseTodos(content).filter((t) => !t.isCompleted && !(t.tags['t'] && t.tags['t'] > today));
    const due = open.filter((t) => t.tags['due'] && t.tags['due'] <= today);
    const overdue = due.some((t) => t.tags['due'] < today);
    await chrome.action.setBadgeText({ text: due.length ? String(due.length) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: overdue ? '#dc2626' : '#4f46e5' });
    await chrome.action.setTitle({ title: `Todo.txt – ${due.length} heute fällig${overdue ? ', davon überfällige' : ''}` });
  } catch {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
    await chrome.action.setTitle({ title: 'Todo.txt – Hilfsprogramm fehlt: node browser/native/install.mjs' });
  }
}

async function flash(text: string) {
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
  setTimeout(() => void updateBadge(), 1500);
}

// ---------- adding tasks ----------
const oneLine = (s: string, max = 200) => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
};

async function addLine(line: string) {
  await host('append', { line });
  await flash('+');
}

/** "Arbeitsblatt kopieren freitag" -> "Arbeitsblatt kopieren due:YYYY-MM-DD" (as the web app does). */
function fromNaturalText(text: string): string {
  const r = parseNaturalLanguage(text.trim());
  let line = r.cleanText;
  if (r.priority) line = `(${r.priority}) ${line}`;
  if (r.dueDate && !/\bdue:\d{4}-\d{2}-\d{2}\b/.test(line)) line += ` due:${r.dueDate}`;
  return line;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'todo-selection', title: 'Als Aufgabe speichern: „%s“', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'todo-link', title: 'Link als Aufgabe speichern', contexts: ['link'] });
  chrome.contextMenus.create({ id: 'todo-page', title: 'Seite als Aufgabe speichern', contexts: ['page'] });
  chrome.alarms.create('badge', { periodInMinutes: 1 });
  void updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('badge', { periodInMinutes: 1 });
  void updateBadge();
});

chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});

chrome.alarms.onAlarm.addListener((a: any) => { if (a.name === 'badge') void updateBadge(); });

chrome.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
  try {
    if (info.menuItemId === 'todo-selection' && info.selectionText) {
      const url = info.pageUrl && /^https?:/.test(info.pageUrl) ? ` ${info.pageUrl}` : '';
      await addLine(oneLine(info.selectionText) + url);
    } else if (info.menuItemId === 'todo-link' && info.linkUrl) {
      await addLine(`${oneLine(info.selectionText || tab?.title || 'Link ansehen')} ${info.linkUrl}`);
    } else if (info.menuItemId === 'todo-page') {
      const url = tab?.url && /^https?:/.test(tab.url) ? ` ${tab.url}` : '';
      await addLine(`${oneLine(tab?.title || 'Seite ansehen')}${url}`);
    }
  } catch {
    await chrome.action.setBadgeText({ text: '!' });
  }
});

chrome.omnibox.setDefaultSuggestion({ description: 'Aufgabe in todo.txt eintragen (z. B. „Arbeitsblatt kopieren freitag +kurs/m/6c“)' });
chrome.omnibox.onInputChanged.addListener((text: string, suggest: (s: any[]) => void) => {
  const line = fromNaturalText(text);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  suggest([{ content: text, description: `Eintragen: <match>${esc(line)}</match>` }]);
});
chrome.omnibox.onInputEntered.addListener(async (text: string) => {
  if (!text.trim()) return;
  try { await addLine(fromNaturalText(text)); } catch { await chrome.action.setBadgeText({ text: '!' }); }
});

chrome.commands.onCommand.addListener((command: string, tab: any) => {
  if (command === 'open-panel' && tab?.windowId !== undefined) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
});
