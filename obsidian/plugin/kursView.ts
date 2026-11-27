/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian API is used without its type package */
/**
 * Right sidebar: tasks of the course of the current lesson note.
 * Mapping: frontmatter `Kontext/Kurs: @kurs/m/6c` -> todo.txt project `+kurs/m/6c`.
 *
 * Two modes (per device, see settings):
 * - "app": the full web app in its narrow responsive layout, filtered to the course.
 *   The filter follows the open note; inside the app it can be cleared as usual.
 * - "kompakt": a small native list (open tasks, check off, add).
 */
import { ItemView, type WorkspaceLeaf } from 'obsidian';
import { parseTask, completeTask, serializeTask, getTodayDate, type TodoTask } from '../../src/services/todoParser';
import { HOST_FILTER_EVENT } from '../../src/utils/hostEnv';
import type TodoTxtPlugin from './main';

export const KURS_VIEW = 'ttk-kursaufgaben';
const KURS_FIELD = 'Kontext/Kurs';

/** Spelling of the project as used in todo.txt (the app filters case-sensitively). */
const resolveProject = (kurs: string, lines: string[]): string => {
  for (const l of lines) {
    for (const w of l.split(/\s+/)) {
      if (w.startsWith('+') && w.slice(1).toLowerCase() === kurs) return w.slice(1);
    }
  }
  return kurs;
};

const asList = (v: unknown): string[] =>
  v == null ? [] : (Array.isArray(v) ? v : String(v).split(/[,\s]+/)).map((s) => String(s).trim()).filter(Boolean);

/**
 * todo.txt projects (lowercase, without "+") for a note:
 * - Lesson: `Kontext/Kurs: @kurs/m/6c` -> ["kurs/m/6c"]
 * - Project file (Kategorie "Projekt" or name "… - Projektplanung"): the first entry of
 *   `Tags`/`tags`, e.g. "kurs/m/6c", "stvp", "ag/minecraft" (same rule as update_project_todos.py).
 */
export const projectsForNote = (fm: any, basename?: string): string[] => {
  if (!fm) return [];
  const kurse = asList(fm[KURS_FIELD])
    .map((s) => s.replace(/^[@+#]/, '').toLowerCase())
    .filter((s) => /^kurs\//.test(s));
  if (kurse.length) return kurse;
  const isProject =
    asList(fm['Kategorie'] ?? fm['kategorie']).some((k) => k.toLowerCase() === 'projekt') ||
    /- Projektplanung$/.test(basename ?? '');
  if (!isProject) return [];
  const first = asList(fm['Tags'] ?? fm['tags'])[0];
  return first ? [first.replace(/^[#+@]/, '').toLowerCase()] : [];
};

const parseIso = (s?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

const dueInfo = (due: string) => {
  const d = parseIso(due);
  if (!d) return null;
  const diff = Math.round((d.getTime() - parseIso(getTodayDate())!.getTime()) / 86400000);
  if (diff < 0) return { cls: 'is-over', label: diff === -1 ? 'gestern fällig' : 'seit ' + -diff + ' Tagen überfällig' };
  if (diff === 0) return { cls: 'is-today', label: 'heute fällig' };
  if (diff === 1) return { cls: '', label: 'morgen' };
  return {
    cls: '',
    label: (diff < 7 ? '' : 'fällig ') + d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
  };
};

type Task = TodoTask & { idx: number };

export class KursView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: TodoTxtPlugin) {
    super(leaf);
  }
  getViewType() { return KURS_VIEW; }
  getDisplayText() { return 'Kursaufgaben'; }
  getIcon() { return 'list-checks'; }
  private frame: HTMLIFrameElement | null = null;
  private frameProject: string | null = null;

  async onOpen() { this.render(); }
  async onClose() { this.frame = null; this.contentEl.empty(); }

  private currentKurse(): string[] {
    const file = this.plugin.currentFile;
    const fm = file ? this.app.metadataCache.getFileCache(file)?.frontmatter : null;
    return projectsForNote(fm, file?.basename);
  }

  /** Full app in the sidebar, filtered to the course of the current note. */
  private renderApp() {
    const kurse = this.currentKurse();
    const project = kurse.length ? resolveProject(kurse[0], this.plugin.lines) : null;
    if (this.frame?.isConnected) {
      if (project !== this.frameProject) {
        this.frameProject = project;
        this.frame.dataset.project = project ?? '';
        const win = this.frame.contentWindow as any;
        win?.dispatchEvent(new win.CustomEvent(HOST_FILTER_EVENT, { detail: { project } }));
      }
      return;
    }
    const root = this.contentEl;
    root.empty();
    root.removeClass('ttk-view');
    root.addClass('ttk-app-host');
    const frame = root.createEl('iframe', { cls: 'ttk-app-frame', attr: { title: 'Todo.txt' } });
    frame.dataset.project = project ?? '';
    this.frame = frame;
    this.frameProject = project;
    this.plugin.loadAppHtml().then(
      (html) => { if (this.frame === frame) frame.srcdoc = html; },
      (e) => { root.createDiv({ cls: 'ttk-error', text: 'Die App-Datei app.html fehlt im Plugin-Ordner: ' + String(e) }); },
    );
  }

  render() {
    if (this.plugin.sidebarMode === 'app') return this.renderApp();
    if (this.frame) {
      this.frame = null;
      this.contentEl.removeClass('ttk-app-host');
    }
    this.renderCompact();
  }

  private tasks(): Task[] {
    return this.plugin.lines
      .map((raw, idx) => ({ raw, idx }))
      .filter((x) => x.raw.trim())
      .map((x) => ({ ...parseTask(x.raw), idx: x.idx }));
  }

  private renderCompact() {
    const p = this.plugin;
    const root = this.contentEl;
    const draft = root.querySelector('.ttk-add input') as HTMLInputElement | null;
    const draftValue = draft?.value ?? '';
    const hadFocus = !!draft && document.activeElement === draft;
    root.empty();
    root.addClass('ttk-view');

    const file = p.currentFile;
    const fm = file ? this.app.metadataCache.getFileCache(file)?.frontmatter : null;
    const kurse = projectsForNote(fm, file?.basename);

    const head = root.createDiv({ cls: 'ttk-head' });
    head.createDiv({ cls: 'ttk-note', text: file ? file.basename : 'Keine Notiz geöffnet' });

    if (p.error) {
      const err = root.createDiv({ cls: 'ttk-error' });
      err.createDiv({ text: p.error });
      err.createEl('button', { text: 'Einstellungen öffnen' }).addEventListener('click', () => p.openSettings());
      return;
    }
    if (!kurse.length) {
      root.createDiv({
        cls: 'ttk-empty',
        text: file
          ? "Diese Notiz hat weder Kurs noch Projekt-Tag. Aufgaben erscheinen bei Stunden (Kontext/Kurs) und Projektdateien (erstes Tag)."
          : "Öffne eine Stunde oder Projektdatei, dann erscheinen hier ihre Aufgaben.",
      });
      return;
    }

    const td = getTodayDate();
    const all = this.tasks().filter((t) => !t.isCompleted && t.projects.some((x) => kurse.includes(x.toLowerCase())));
    const isLater = (t: Task) => !!t.tags['t'] && t.tags['t'] > td;
    const later = all.filter(isLater);
    const open = all
      .filter((t) => !isLater(t))
      .sort((a, b) => {
        const da = a.tags['due'] || '9999', db = b.tags['due'] || '9999';
        if (da !== db) return da < db ? -1 : 1;
        const pa = a.priority || '~', pb = b.priority || '~';
        if (pa !== pb) return pa < pb ? -1 : 1;
        return a.idx - b.idx;
      });
    const overdue = open.some((t) => t.tags['due'] && t.tags['due'] < td);

    const tagRow = head.createDiv({ cls: 'ttk-tagrow' });
    tagRow.createSpan({ cls: 'ttk-tag', text: kurse.map((k) => '+' + k).join(' ') });
    tagRow.createSpan({ cls: 'ttk-count' + (overdue ? ' is-over' : ''), text: open.length + ' offen' });

    const list = root.createEl('ul', { cls: 'ttk-list' });
    if (!open.length) list.createEl('li', { cls: 'ttk-empty', text: 'Keine offenen Aufgaben für diesen Kurs.' });
    for (const t of open) {
      const li = list.createEl('li', { cls: 'ttk-task' });
      const cb = li.createEl('input', { type: 'checkbox', attr: { 'aria-label': 'Erledigt' } });
      cb.addEventListener('change', () =>
        p.changeTodo((lines) => {
          const i = lines[t.idx] === t.originalText ? t.idx : lines.indexOf(t.originalText);
          if (i < 0) return false;
          lines.splice(i, 1, ...completeTask(t).map(serializeTask));
        }, 'Erledigt: ' + t.description.slice(0, 60)),
      );
      if (t.priority) li.createSpan({ cls: 'ttk-pri ttk-pri-' + t.priority, text: t.priority });
      const body = li.createDiv({ cls: 'ttk-body' });
      const text = body.createDiv({ cls: 'ttk-text' });
      for (const w of t.description.split(/(\s+)/)) {
        if (!w) continue;
        if (/^\s+$/.test(w)) { text.appendText(w); continue; }
        const lw = w.toLowerCase();
        if (kurse.some((k) => lw === '+' + k)) continue;
        if (/^(due|t|rec|h):\S+$/.test(w)) continue;
        if (/^\+\S/.test(w)) text.createSpan({ cls: 'ttk-proj', text: w });
        else if (/^@\S/.test(w)) text.createSpan({ cls: 'ttk-ctx', text: w });
        else if (/^https:\/\/\S+$/.test(w)) text.createEl('a', { cls: 'ttk-link', text: w, href: w });
        else if (/^[A-Za-z][\w-]*:\S+$/.test(w)) text.createSpan({ cls: 'ttk-kv', text: w });
        else text.appendText(w);
      }
      const meta: [string, string][] = [];
      if (t.tags['due']) { const d = dueInfo(t.tags['due']); if (d) meta.push([d.label, d.cls]); }
      if (t.tags['rec']) meta.push(['↻ ' + t.tags['rec'], '']);
      if (meta.length) {
        const m = body.createDiv({ cls: 'ttk-meta' });
        for (const [l, c] of meta) m.createSpan({ cls: c, text: l });
      }
    }

    if (later.length) {
      const det = root.createEl('details', { cls: 'ttk-later' });
      det.createEl('summary', { text: later.length + ' auf Wiedervorlage (t:)' });
      const ul = det.createEl('ul', { cls: 'ttk-list' });
      for (const t of later.sort((a, b) => a.tags['t'].localeCompare(b.tags['t']))) {
        const li = ul.createEl('li', { cls: 'ttk-task is-later' });
        const body = li.createDiv({
          cls: 'ttk-body',
          text: t.description
            .split(/\s+/)
            .filter((w) => !/^(t|due|rec|h):/.test(w) && !kurse.includes(w.slice(1).toLowerCase()))
            .join(' '),
        });
        body.createDiv({ cls: 'ttk-meta', text: 'ab ' + parseIso(t.tags['t'])!.toLocaleDateString('de-DE') });
      }
    }

    const form = root.createEl('form', { cls: 'ttk-add' });
    const input = form.createEl('input', {
      type: 'text',
      attr: { placeholder: 'Neue Aufgabe für +' + kurse[0] + ' … ⏎', 'aria-label': 'Neue Aufgabe' },
    });
    input.value = draftValue;
    if (hadFocus) input.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let v = input.value.trim();
      if (!v) return;
      if (!v.toLowerCase().split(/\s+/).includes('+' + kurse[0])) v += ' +' + kurse[0];
      input.value = '';
      p.changeTodo((lines) => { lines.push(v); }, 'Hinzugefügt');
    });
  }
}
