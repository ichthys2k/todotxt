#!/usr/bin/env node
// Installs the native messaging host for the Todo.txt browser extension (Linux and macOS).
//
//   node browser/native/install.mjs            install for Chrome, Chromium, Edge, Brave
//   node browser/native/install.mjs --remove   remove it again
//
// Copies host.mjs to ~/.local/share/todotxt-browser/, writes a small launcher with
// the absolute path of node, and registers the host for the extension's fixed ID.
import { mkdir, copyFile, writeFile, rm, chmod, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST_NAME = 'de.lipponer.todotxt';
const EXTENSION_ID = 'hojnnhankfeckcpelobboomcddmljfea';
const HOME = homedir();
const here = path.dirname(fileURLToPath(import.meta.url));
const installDir = path.join(HOME, '.local', 'share', 'todotxt-browser');

const browserDirs = platform() === 'darwin'
  ? ['Google/Chrome', 'Chromium', 'Microsoft Edge', 'BraveSoftware/Brave-Browser']
      .map((b) => path.join(HOME, 'Library', 'Application Support', b, 'NativeMessagingHosts'))
  : ['google-chrome', 'chromium', 'microsoft-edge', 'BraveSoftware/Brave-Browser']
      .map((b) => path.join(HOME, '.config', b, 'NativeMessagingHosts'));

const remove = process.argv.includes('--remove');

if (remove) {
  for (const dir of browserDirs) await rm(path.join(dir, HOST_NAME + '.json'), { force: true });
  await rm(installDir, { recursive: true, force: true });
  console.log('Hilfsprogramm entfernt.');
  process.exit(0);
}

// A stable node path: prefer the one on PATH (e.g. a version manager's alias) over this process's.
let nodePath = process.execPath;
try {
  const onPath = execFileSync('sh', ['-c', 'command -v node'], { encoding: 'utf8' }).trim();
  if (onPath) nodePath = onPath;
} catch { /* keep execPath */ }

await mkdir(installDir, { recursive: true });
await copyFile(path.join(here, 'host.mjs'), path.join(installDir, 'host.mjs'));
const launcher = path.join(installDir, 'host.sh');
await writeFile(launcher, `#!/bin/sh\nexec "${nodePath}" "${path.join(installDir, 'host.mjs')}" "$@"\n`);
await chmod(launcher, 0o755);

const manifest = {
  name: HOST_NAME,
  description: 'Todo.txt: Zugriff auf todo.txt und archive.txt',
  path: launcher,
  type: 'stdio',
  allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
};
const done = [];
for (const dir of browserDirs) {
  const browserRoot = path.dirname(dir);
  if (!existsSync(browserRoot)) continue; // browser not used on this machine
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, HOST_NAME + '.json'), JSON.stringify(manifest, null, 2));
  done.push(dir.replace(HOME, '~'));
}

const cfgFile = path.join(HOME, '.config', 'todotxt-browser', 'config.json');
const cfg = existsSync(cfgFile) ? JSON.parse(await readFile(cfgFile, 'utf8')) : null;
console.log(`Hilfsprogramm installiert: ${installDir.replace(HOME, '~')}`);
console.log(`node: ${nodePath}`);
console.log(done.length ? 'Registriert für:\n  ' + done.join('\n  ') : 'Kein Chrome/Chromium/Edge/Brave-Profil gefunden.');
console.log('todo.txt: ' + (cfg?.todo ?? '~/sync/todotxt/todo.txt (Standard)'));
