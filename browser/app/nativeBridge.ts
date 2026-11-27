/* eslint-disable @typescript-eslint/no-explicit-any -- chrome.* is used without its type package */
/**
 * Talks to the native messaging host (browser/native/host.mjs) and offers the
 * app an Electron-compatible `electronAPI`, so the web app uses its existing
 * Electron file code path inside the browser extension.
 */
declare const chrome: any;

export const HOST_NAME = 'de.lipponer.todotxt';

type Reply = { id: number; ok: boolean; error?: string; code?: string; [k: string]: unknown };

let port: any = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: Reply) => void; reject: (e: Error) => void }>();

const connect = () => {
  if (port) return port;
  port = chrome.runtime.connectNative(HOST_NAME);
  port.onMessage.addListener((msg: Reply) => {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) p.resolve(msg);
    else p.reject(Object.assign(new Error(msg.error || 'Fehler im Hilfsprogramm'), { code: msg.code }));
  });
  port.onDisconnect.addListener(() => {
    const err = new Error(chrome.runtime.lastError?.message || 'Hilfsprogramm getrennt');
    for (const p of pending.values()) p.reject(err);
    pending.clear();
    port = null;
  });
  return port;
};

/** One request to the host; reconnects when the host was closed. */
export const callHost = (op: string, args: Record<string, unknown> = {}, timeoutMs = 10000): Promise<Reply> =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Das Hilfsprogramm antwortet nicht.')); }, timeoutMs);
    pending.set(id, {
      resolve: (r) => { clearTimeout(timer); resolve(r); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    try {
      connect().postMessage({ id, op, ...args });
    } catch (e) {
      pending.delete(id);
      clearTimeout(timer);
      reject(e as Error);
    }
  });

type Listener = (type: 'todo' | 'archive') => void;

export const createElectronApi = () => {
  const listeners = new Set<Listener>();
  const mtimes: Record<string, number> = {};
  let paths: { todo: string | null; archive: string | null } = { todo: null, archive: null };
  let polling: ReturnType<typeof setInterval> | null = null;

  const refreshPaths = async () => {
    const r = await callHost('paths');
    paths = { todo: (r.todo as string) || null, archive: (r.archive as string) || null };
    return paths;
  };

  const poll = async () => {
    if (document.visibilityState !== 'visible') return;
    for (const type of ['todo', 'archive'] as const) {
      const p = paths[type];
      if (!p) continue;
      try {
        const st = await callHost('stat', { path: p });
        const m = st.exists ? (st.mtimeMs as number) : 0;
        if (mtimes[p] !== undefined && m !== mtimes[p]) {
          mtimes[p] = m;
          for (const l of listeners) l(type);
        } else mtimes[p] = m;
      } catch { /* next round */ }
    }
  };

  return {
    readFile: async (p: string) => {
      const r = await callHost('read', { path: p });
      mtimes[p] = r.mtimeMs as number;
      return r.content as string;
    },
    writeFile: async (p: string, content: string) => {
      const r = await callHost('write', { path: p, content });
      mtimes[p] = r.mtimeMs as number;
    },
    selectFile: async (title: string) => {
      const current = title.includes('archive') ? paths.archive : paths.todo;
      const v = window.prompt(`${title}\nPfad zur Datei (z. B. ~/sync/todotxt/todo.txt):`, current ?? '');
      return v && v.trim() ? v.trim() : null;
    },
    getPaths: async () => refreshPaths(),
    setPaths: async (todo: string | null, archive: string | null) => {
      const r = await callHost('setPaths', { todo, archive });
      paths = { todo: (r.todo as string) || null, archive: (r.archive as string) || null };
    },
    onFileChanged: (cb: Listener) => {
      listeners.add(cb);
      if (!polling) polling = setInterval(poll, 3000);
      return () => {
        listeners.delete(cb);
        if (!listeners.size && polling) { clearInterval(polling); polling = null; }
      };
    },
    showMainWindow: async () => {},
    closeWidgetWindow: async () => {},
    checkForUpdates: async () => {},
    onUpdaterStatus: () => {},
  };
};
