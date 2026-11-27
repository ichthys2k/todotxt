#!/usr/bin/env node
// Native messaging host for the Todo.txt browser extension (Chrome, Chromium, Edge).
//
// Protocol: Chrome's native messaging (4-byte little-endian length + UTF-8 JSON),
// one request per message, each answered with { id, ok, ...result } or { id, ok: false, error, code }.
//
// It reads and writes exactly two files: the configured todo.txt and archive.txt
// (config: ~/.config/todotxt-browser/config.json, default ~/sync/todotxt/). Paths
// must be .txt files inside the home folder. Writes can carry the mtime the caller
// last saw (expectedMtimeMs); a changed file is refused with code "conflict".
import { readFile, writeFile, stat, mkdir, copyFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const HOME = homedir();
const CONFIG_DIR = path.join(HOME, '.config', 'todotxt-browser');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MAX_BYTES = 4 * 1024 * 1024;
const BACKUP_EVERY_MS = 24 * 60 * 60 * 1000;

const expand = (p) => path.resolve(String(p).replace(/^~(?=\/|$)/, HOME));
const shorten = (p) => (p.startsWith(HOME + path.sep) ? '~' + p.slice(HOME.length) : p);

class HostError extends Error {
  constructor(message, code = 'error') { super(message); this.code = code; }
}

async function loadConfig() {
  let cfg = {};
  try { cfg = JSON.parse(await readFile(CONFIG_FILE, 'utf8')); } catch { /* defaults */ }
  const todo = expand(cfg.todo || '~/sync/todotxt/todo.txt');
  const archive = expand(cfg.archive || path.join(path.dirname(todo), 'archive.txt'));
  return { todo, archive };
}

async function checkAllowedPath(p) {
  const full = expand(p);
  if (!full.endsWith('.txt')) throw new HostError('Nur .txt-Dateien sind erlaubt.', 'bad_path');
  let real = full;
  try { real = await realpath(full); } catch { real = path.join(await realpath(path.dirname(full)).catch(() => path.dirname(full)), path.basename(full)); }
  if (!real.startsWith(HOME + path.sep)) throw new HostError('Die Datei muss im Benutzerordner liegen.', 'bad_path');
  return full;
}

/** Only the two configured files may be read or written. */
async function resolveFile(p) {
  const cfg = await loadConfig();
  const full = expand(p);
  if (full !== cfg.todo && full !== cfg.archive) throw new HostError('Pfad nicht freigegeben: ' + shorten(full), 'not_allowed');
  return checkAllowedPath(full);
}

const statOrNull = (p) => stat(p).catch((e) => { if (e.code === 'ENOENT') return null; throw e; });

async function backupIfDue(full) {
  const bak = full + '.browser.bak';
  const st = await statOrNull(bak);
  if (!st || Date.now() - st.mtimeMs > BACKUP_EVERY_MS) await copyFile(full, bak).catch(() => {});
}

const handlers = {
  async paths() {
    const cfg = await loadConfig();
    return { todo: cfg.todo, archive: cfg.archive, home: HOME };
  },
  async setPaths({ todo, archive }) {
    const cfg = await loadConfig();
    const next = {
      todo: todo ? await checkAllowedPath(todo) : cfg.todo,
      archive: archive ? await checkAllowedPath(archive) : cfg.archive,
    };
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify({ todo: shorten(next.todo), archive: shorten(next.archive) }, null, 2));
    return next;
  },
  async stat({ path: p }) {
    const full = await resolveFile(p);
    const st = await statOrNull(full);
    return st ? { exists: true, mtimeMs: st.mtimeMs, size: st.size } : { exists: false };
  },
  async read({ path: p }) {
    const full = await resolveFile(p);
    const st = await statOrNull(full);
    if (!st) throw new HostError('Datei nicht gefunden: ' + shorten(full), 'not_found');
    if (st.size > MAX_BYTES) throw new HostError('Datei ist zu groß.', 'too_large');
    return { content: await readFile(full, 'utf8'), mtimeMs: st.mtimeMs };
  },
  async write({ path: p, content, expectedMtimeMs }) {
    const full = await resolveFile(p);
    if (typeof content !== 'string') throw new HostError('content fehlt.', 'bad_request');
    if (Buffer.byteLength(content) > MAX_BYTES) throw new HostError('Inhalt ist zu groß.', 'too_large');
    const st = await statOrNull(full);
    if (typeof expectedMtimeMs === 'number' && st && Math.abs(st.mtimeMs - expectedMtimeMs) > 1) {
      throw new HostError('Die Datei wurde inzwischen geändert.', 'conflict');
    }
    if (st) await backupIfDue(full);
    await writeFile(full, content, 'utf8');
    return { mtimeMs: (await stat(full)).mtimeMs };
  },
  /** Appends one line to todo.txt (used by the context menu and the address bar). */
  async append({ line }) {
    const cfg = await loadConfig();
    const full = await checkAllowedPath(cfg.todo);
    const text = String(line ?? '').replace(/[\r\n]+/g, ' ').trim();
    if (!text) throw new HostError('Leere Zeile.', 'bad_request');
    let current = '';
    try { current = await readFile(full, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const sep = current && !current.endsWith('\n') ? (current.includes('\r\n') ? '\r\n' : '\n') : '';
    const eol = current.includes('\r\n') ? '\r\n' : '\n';
    await writeFile(full, current + sep + text + eol, 'utf8');
    return { line: text, mtimeMs: (await stat(full)).mtimeMs };
  },
  async ping() {
    return { version: 1 };
  },
};

// ---------- native messaging framing ----------
let buffer = Buffer.alloc(0);
const send = (obj) => {
  const json = Buffer.from(JSON.stringify(obj), 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(json.length, 0);
  process.stdout.write(Buffer.concat([len, json]));
};

let queue = Promise.resolve();
const handle = (msg) => {
  queue = queue.then(async () => {
    const id = msg?.id ?? null;
    const h = handlers[msg?.op];
    if (!h) return send({ id, ok: false, error: 'Unbekannte Aktion: ' + msg?.op, code: 'bad_request' });
    try {
      send({ id, ok: true, ...(await h(msg)) });
    } catch (e) {
      send({ id, ok: false, error: e.message || String(e), code: e.code || 'error' });
    }
  });
};

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (buffer.length >= 4) {
    const len = buffer.readUInt32LE(0);
    if (buffer.length < 4 + len) break;
    const body = buffer.subarray(4, 4 + len).toString('utf8');
    buffer = buffer.subarray(4 + len);
    try { handle(JSON.parse(body)); } catch { send({ id: null, ok: false, error: 'Ungültige Nachricht', code: 'bad_request' }); }
  }
});
process.stdin.on('end', () => { queue.then(() => process.exit(0)); });
