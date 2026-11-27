/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian API is used without its type package */
/**
 * Todo.txt for Obsidian.
 *
 * Two views on the same todo.txt:
 * - "Kursaufgaben" (right sidebar): open tasks of the course of the current lesson note.
 * - "Todo.txt" (tab): the complete web app, loaded from app.html in an iframe.
 *
 * File paths are stored per device (Obsidian local storage), because the
 * vault and its .obsidian folder are synced between devices.
 */
import { MarkdownView, Modal, Notice, Platform, Plugin, PluginSettingTab, Setting, type App, type TFile } from 'obsidian';
import { FileAccess, joinText, splitText } from './store';
import { KursView, KURS_VIEW } from './kursView';
import { AppView, APP_VIEW } from './appView';

const LS_TODO = 'todotxt-kursaufgaben-path';
const LS_ARCHIVE = 'todotxt-obsidian-archive-path';
const DEFAULT_TODO = '~/sync/todotxt/todo.txt';
const POLL_MS = 3000;

type Listener = (type: 'todo' | 'archive') => void;

export default class TodoTxtPlugin extends Plugin {
  files!: FileAccess;
  todoPath = '';
  archivePath = '';
  lines: string[] = [];
  error: string | null = null;
  currentFile: TFile | null = null;

  private eol = '\n';
  private trailing = true;
  private mtimes: Record<'todo' | 'archive', number | null> = { todo: null, archive: null };
  private listeners = new Set<Listener>();
  private busy = false;
  private appHtml: string | null = null;

  async onload() {
    this.files = new FileAccess(this.app);
    this.todoPath = this.loadLocal(LS_TODO) || (Platform.isDesktopApp ? DEFAULT_TODO : '');
    this.archivePath = this.loadLocal(LS_ARCHIVE) || '';

    this.registerView(KURS_VIEW, (leaf) => new KursView(leaf, this));
    this.registerView(APP_VIEW, (leaf) => new AppView(leaf, this));
    this.addSettingTab(new TodoTxtSettings(this.app, this));

    this.addRibbonIcon('list-checks', 'Kursaufgaben anzeigen', () => this.revealKursView());
    this.addRibbonIcon('check-circle', 'Todo.txt öffnen', () => this.openApp());
    this.addCommand({ id: 'kursaufgaben', name: 'Kursaufgaben in der Seitenleiste anzeigen', callback: () => this.revealKursView() });
    this.addCommand({ id: 'app-oeffnen', name: 'Todo.txt-App öffnen', callback: () => this.openApp() });
    this.addCommand({ id: 'neu-laden', name: 'todo.txt neu laden', callback: () => this.reload(true) });

    (window as any).__todoTxtBridge = { electronAPI: this.electronApi(), openSettings: () => this.openSettings() };

    this.app.workspace.onLayoutReady(async () => {
      this.currentFile = this.app.workspace.getActiveFile();
      if (!this.app.workspace.getLeavesOfType(KURS_VIEW).length) await this.ensureKursView(false);
      if (!this.todoPath && !Platform.isDesktopApp) {
        const found = await this.files.findInVault('todo.txt');
        if (found) this.setTodoPath(found);
      }
      if (!this.archivePath && this.todoPath) {
        const guess = this.todoPath.replace(/todo\.txt$/, 'archive.txt');
        if (guess !== this.todoPath && (await this.files.exists(guess))) this.setArchivePath(guess);
      }
      await this.reload();
    });

    this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
      if (leaf && leaf.view instanceof MarkdownView && leaf.view.file) {
        this.currentFile = leaf.view.file;
        this.renderKursViews();
      }
    }));
    this.registerEvent(this.app.workspace.on('file-open', (file) => {
      if (file) { this.currentFile = file; this.renderKursViews(); }
    }));
    this.registerEvent(this.app.metadataCache.on('changed', (file) => {
      if (file === this.currentFile) this.renderKursViews();
    }));
    this.registerInterval(window.setInterval(() => this.poll(), POLL_MS));
  }

  onunload() {
    delete (window as any).__todoTxtBridge;
  }

  // ---------- per-device settings ----------
  loadLocal(k: string): string | null {
    try {
      const a: any = this.app;
      return a.loadLocalStorage ? a.loadLocalStorage(k) : window.localStorage.getItem(k);
    } catch {
      return null;
    }
  }
  saveLocal(k: string, v: string) {
    try {
      const a: any = this.app;
      if (a.saveLocalStorage) a.saveLocalStorage(k, v);
      else window.localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  }
  setTodoPath(p: string) { this.todoPath = p.trim(); this.saveLocal(LS_TODO, this.todoPath); }
  setArchivePath(p: string) { this.archivePath = p.trim(); this.saveLocal(LS_ARCHIVE, this.archivePath); }

  openSettings() {
    const s: any = (this.app as any).setting;
    s.open();
    s.openTabById(this.manifest.id);
  }

  // ---------- todo.txt state for the sidebar ----------
  async reload(notify = false) {
    if (!this.todoPath) {
      this.error = 'Kein Pfad zur todo.txt eingestellt.';
      this.renderKursViews();
      return;
    }
    try {
      const text = await this.files.read(this.todoPath);
      const s = splitText(text);
      this.lines = s.lines;
      this.eol = s.eol;
      this.trailing = s.trailing;
      this.mtimes.todo = await this.files.mtime(this.todoPath);
      this.error = null;
      if (notify) new Notice('todo.txt neu geladen');
    } catch (e: any) {
      this.error = e?.code === 'ENOENT' ? 'todo.txt nicht gefunden: ' + this.todoPath : String(e?.message || e);
    }
    this.renderKursViews();
  }

  /** Changes todo.txt with a fresh read; op returns false if the line is gone. */
  async changeTodo(op: (lines: string[]) => boolean | void, okMsg?: string) {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.reload();
      if (this.error) throw new Error(this.error);
      const before = this.mtimes.todo;
      const lines = this.lines.slice();
      if (op(lines) === false || (await this.files.mtime(this.todoPath)) !== before) {
        new Notice('Die todo.txt hat sich gerade geändert. Ich habe neu geladen, bitte noch einmal versuchen.');
      } else {
        await this.files.write(this.todoPath, joinText(lines, this.eol, this.trailing));
        if (okMsg) new Notice(okMsg);
        this.emit('todo');
      }
    } catch (e: any) {
      new Notice('Speichern fehlgeschlagen: ' + (e?.message || e));
    }
    this.busy = false;
    await this.reload();
  }

  private async poll() {
    if (this.busy || document.visibilityState !== 'visible') return;
    const watched = this.app.workspace.getLeavesOfType(KURS_VIEW).length + this.app.workspace.getLeavesOfType(APP_VIEW).length;
    if (!watched) return;
    for (const type of ['todo', 'archive'] as const) {
      const p = type === 'todo' ? this.todoPath : this.archivePath;
      if (!p) continue;
      try {
        const m = await this.files.mtime(p);
        if (this.mtimes[type] !== null && m !== this.mtimes[type]) {
          this.mtimes[type] = m;
          if (type === 'todo') await this.reload();
          this.emit(type);
        } else this.mtimes[type] = m;
      } catch {
        /* file missing: try again later */
      }
    }
  }

  private emit(type: 'todo' | 'archive') {
    for (const l of this.listeners) {
      try { l(type); } catch { /* ignore */ }
    }
  }

  // ---------- Electron-compatible API for the full app ----------
  private electronApi() {
    const allowed = (p: string) => !!p && (p === this.todoPath || p === this.archivePath);
    const refreshMtime = async (p: string) => {
      const type = p === this.todoPath ? 'todo' : 'archive';
      try { this.mtimes[type] = await this.files.mtime(p); } catch { /* ignore */ }
      if (type === 'todo') await this.reload();
    };
    return {
      readFile: async (p: string) => {
        if (!allowed(p)) throw new Error('Pfad nicht freigegeben: ' + p);
        return this.files.read(p);
      },
      writeFile: async (p: string, content: string) => {
        if (!allowed(p)) throw new Error('Pfad nicht freigegeben: ' + p);
        await this.files.write(p, content);
        await refreshMtime(p);
      },
      selectFile: (title: string) => new PathModal(this.app, title, title.includes('archive') ? this.archivePath : this.todoPath).ask(),
      getPaths: async () => ({ todo: this.todoPath || null, archive: this.archivePath || null }),
      setPaths: async (todo: string | null, archive: string | null) => {
        this.setTodoPath(todo || '');
        this.setArchivePath(archive || '');
        await this.reload();
      },
      onFileChanged: (cb: Listener) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
      },
      showMainWindow: async () => {},
      closeWidgetWindow: async () => {},
      checkForUpdates: async () => {},
      onUpdaterStatus: () => {},
    };
  }

  async loadAppHtml(): Promise<string> {
    if (!this.appHtml) this.appHtml = await this.app.vault.adapter.read(this.manifest.dir + '/app.html');
    return this.appHtml;
  }

  // ---------- views ----------
  renderKursViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(KURS_VIEW)) {
      if (leaf.view instanceof KursView) leaf.view.render();
    }
  }
  async ensureKursView(reveal: boolean) {
    let leaf = this.app.workspace.getLeavesOfType(KURS_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getRightLeaf(true);
      if (!leaf) return;
      await leaf.setViewState({ type: KURS_VIEW, active: reveal });
    }
    if (reveal) this.app.workspace.revealLeaf(leaf);
  }
  revealKursView() { return this.ensureKursView(true); }

  async openApp() {
    let leaf = this.app.workspace.getLeavesOfType(APP_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('tab');
      await leaf.setViewState({ type: APP_VIEW, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }
}

/** Simple path prompt, used when the app asks to link a file. */
class PathModal extends Modal {
  private resolve: (v: string | null) => void = () => {};
  private value: string;
  constructor(app: App, private heading: string, initial: string) {
    super(app);
    this.value = initial || '';
  }
  ask(): Promise<string | null> {
    return new Promise((res) => { this.resolve = res; this.open(); });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: this.heading });
    contentEl.createEl('p', {
      text: Platform.isDesktopApp
        ? 'Pfad zur Datei, z. B. ~/sync/todotxt/todo.txt. Ohne / am Anfang gilt er im Vault.'
        : 'Pfad im Vault, z. B. todotxt/todo.txt.',
    });
    const input = contentEl.createEl('input', { type: 'text', cls: 'ttk-path-input' });
    input.value = this.value;
    new Setting(contentEl)
      .addButton((b) => b.setButtonText('Abbrechen').onClick(() => this.close()))
      .addButton((b) => b.setButtonText('Übernehmen').setCta().onClick(() => {
        this.value = input.value.trim();
        const v = this.value;
        this.resolve(v || null);
        this.resolve = () => {};
        this.close();
      }));
    input.focus();
  }
  onClose() {
    this.resolve(null);
    this.contentEl.empty();
  }
}

class TodoTxtSettings extends PluginSettingTab {
  constructor(app: App, private plugin: TodoTxtPlugin) {
    super(app, plugin);
  }
  display() {
    const { containerEl } = this;
    const p = this.plugin;
    containerEl.empty();
    containerEl.createEl('p', {
      text: 'Die Pfade gelten nur für dieses Gerät. Am Rechner gehen absolute Pfade wie ~/sync/todotxt/todo.txt, auf dem Handy nur Pfade im Vault.',
    });
    new Setting(containerEl)
      .setName('todo.txt')
      .addText((t) => t.setPlaceholder(Platform.isDesktopApp ? DEFAULT_TODO : 'todotxt/todo.txt').setValue(p.todoPath).onChange((v) => p.setTodoPath(v)));
    new Setting(containerEl)
      .setName('archive.txt')
      .setDesc('Für das Archiv der vollen App. Leer lassen, wenn du keins nutzt.')
      .addText((t) => t.setPlaceholder(Platform.isDesktopApp ? '~/sync/todotxt/archive.txt' : 'todotxt/archive.txt').setValue(p.archivePath).onChange((v) => p.setArchivePath(v)));
    const status = containerEl.createEl('p');
    const show = () => status.setText(p.error ? '⚠ ' + p.error : '✓ ' + p.lines.filter((l) => l.trim()).length + ' Aufgaben gelesen.');
    new Setting(containerEl)
      .setName('Prüfen')
      .addButton((b) => b.setButtonText('Jetzt laden').setCta().onClick(async () => { await p.reload(); show(); }))
      .addButton((b) => b.setButtonText('Im Vault suchen').onClick(async () => {
        const found = await p.files.findInVault('todo.txt');
        new Notice(found ? 'Gefunden: ' + found : 'Keine todo.txt im Vault gefunden.');
        if (found) p.setTodoPath(found);
        await p.reload();
        this.display();
      }));
    show();
  }
}
