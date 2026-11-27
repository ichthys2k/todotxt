// Builds the Todo.txt browser extension (Chrome, Chromium, Edge, Brave) into dist-browser/todotxt/.
// Load that folder (or, with --install, ~/.local/share/todotxt-browser/extension)
// via chrome://extensions or edge://extensions -> "Load unpacked"
// and install the native host once: node browser/native/install.mjs
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-browser', 'todotxt');
const stub = path.join(root, 'obsidian/app/capacitor-stub.ts');
const alias = {
  '@capacitor/core': stub,
  '@capacitor/filesystem': stub,
  '@capawesome/capacitor-google-sign-in': stub,
};

fs.rmSync(path.join(root, 'dist-browser'), { recursive: true, force: true });

// 1) Side panel page (the full web app). MV3 allows no inline scripts, so assets stay separate files.
await build({
  root,
  configFile: false,
  publicDir: false,
  base: '/',
  logLevel: 'warn',
  plugins: [react(), tailwindcss()],
  resolve: { alias },
  build: {
    outDir: out,
    emptyOutDir: true,
    modulePreload: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { input: path.join(root, 'browser/app/sidepanel.html') },
  },
});

// 2) Service worker (one ES module file)
await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  resolve: { alias },
  build: {
    outDir: out,
    emptyOutDir: false,
    minify: true,
    lib: { entry: path.join(root, 'browser/background.ts'), formats: ['es'], fileName: () => 'background.js' },
  },
});

// 3) Manifest (version from package.json, fixed ID via the public key) and icons
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'browser/extension/manifest.json'), 'utf8'));
manifest.version = pkg.version;
manifest.key = fs.readFileSync(path.join(root, 'browser/extension/public-key.txt'), 'utf8').trim();
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.cpSync(path.join(root, 'browser/extension/icons'), path.join(out, 'icons'), { recursive: true });

// The favicon the app shows in its header
for (const name of ['favicon.png', 'apple-touch-icon.png']) fs.copyFileSync(path.join(root, 'public', name), path.join(out, 'browser/app', name));

console.log(`Browser-Erweiterung gebaut: ${out}`);

// Optional: copy to a fixed folder to load as unpacked extension (survives rebuilds of the repo)
if (process.argv.includes('--install')) {
  const target = path.join(process.env.HOME, '.local', 'share', 'todotxt-browser', 'extension');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(out, target, { recursive: true });
  console.log(`Kopiert nach ${target.replace(process.env.HOME, '~')} (als entpackte Erweiterung laden)`);
}
