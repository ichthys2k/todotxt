/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian API is used without its type package */
/**
 * File access for the Obsidian plugin.
 *
 * - Absolute paths (`/…`, `~/…`, `C:\…`) use Node's fs and work only in
 *   Obsidian desktop.
 * - Relative paths are vault paths and work everywhere, also on mobile,
 *   where Obsidian can only reach files inside the vault.
 */
import { Platform, type App } from 'obsidian';

declare const require: (id: string) => any;

export const isAbsolutePath = (p: string): boolean => /^(~|\/|[A-Za-z]:[\\/])/.test(p);

const node = () => {
  if (!Platform.isDesktopApp) {
    throw new Error('Absolute Pfade gehen nur am Rechner. Auf dem Handy muss die Datei im Vault liegen.');
  }
  return { fs: require('fs').promises, os: require('os'), path: require('path') };
};

export const resolveAbsolute = (p: string): string => {
  const { os, path } = node();
  return path.resolve(p.replace(/^~(?=[\\/]|$)/, os.homedir()));
};

export class FileAccess {
  constructor(private app: App) {}

  async exists(p: string): Promise<boolean> {
    try {
      await this.mtime(p);
      return true;
    } catch {
      return false;
    }
  }

  async mtime(p: string): Promise<number> {
    if (isAbsolutePath(p)) return (await node().fs.stat(resolveAbsolute(p))).mtimeMs;
    const st = await this.app.vault.adapter.stat(p);
    if (!st) {
      const e: any = new Error('Datei nicht gefunden: ' + p);
      e.code = 'ENOENT';
      throw e;
    }
    return st.mtime;
  }

  async read(p: string): Promise<string> {
    const text = isAbsolutePath(p)
      ? await node().fs.readFile(resolveAbsolute(p), 'utf8')
      : await this.app.vault.adapter.read(p);
    return text.replace(/^\uFEFF/, '');
  }

  async write(p: string, text: string): Promise<void> {
    if (isAbsolutePath(p)) await node().fs.writeFile(resolveAbsolute(p), text, 'utf8');
    else await this.app.vault.adapter.write(p, text);
  }

  /** Mobile: look for todo.txt in the vault root and one folder deep. */
  async findInVault(fileName = 'todo.txt'): Promise<string | null> {
    const a = this.app.vault.adapter;
    const candidates = [fileName];
    try {
      const root = await a.list('/');
      for (const f of root.folders) candidates.push(f.replace(/^\//, '') + '/' + fileName);
    } catch {
      /* ignore */
    }
    for (const c of candidates) {
      try {
        if (await a.exists(c)) return c;
      } catch {
        /* next */
      }
    }
    return null;
  }
}

export const splitText = (text: string) => {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailing = text.endsWith('\n') || text === '';
  const lines = text.split(/\r?\n/);
  if (text.endsWith('\n')) lines.pop();
  return { lines, eol, trailing };
};

export const joinText = (lines: string[], eol: string, trailing: boolean) =>
  lines.join(eol) + (trailing && lines.length ? eol : '');
