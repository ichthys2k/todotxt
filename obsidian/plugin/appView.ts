/**
 * Full view: the complete Todo.txt web app in an Obsidian tab.
 * The app runs in an iframe (srcdoc, same origin) and reaches the files
 * through `window.__todoTxtBridge`, which the plugin sets on load.
 */
import { ItemView, type WorkspaceLeaf } from 'obsidian';
import type TodoTxtPlugin from './main';

export const APP_VIEW = 'ttk-todotxt-app';

export class AppView extends ItemView {
  private frame: HTMLIFrameElement | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: TodoTxtPlugin) {
    super(leaf);
  }
  getViewType() { return APP_VIEW; }
  getDisplayText() { return 'Todo.txt'; }
  getIcon() { return 'check-circle'; }

  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass('ttk-app-host');
    let html: string;
    try {
      html = await this.plugin.loadAppHtml();
    } catch (e) {
      this.contentEl.createDiv({ cls: 'ttk-error', text: 'Die App-Datei app.html fehlt im Plugin-Ordner: ' + String(e) });
      return;
    }
    this.frame = this.contentEl.createEl('iframe', { cls: 'ttk-app-frame', attr: { title: 'Todo.txt' } });
    this.frame.srcdoc = html;
  }

  async onClose() {
    this.frame?.remove();
    this.frame = null;
    this.contentEl.empty();
  }
}
