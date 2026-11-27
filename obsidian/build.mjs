// Builds the Obsidian plugin into dist-obsidian/todotxt-kursaufgaben/:
//   main.js      – plugin (CommonJS, "obsidian" stays external)
//   app.html     – the full web app as one self-contained HTML file
//   manifest.json, styles.css
//
// Usage:  node obsidian/build.mjs [--deploy <vault> [<vault> ...]]
// With --deploy the result is copied into <vault>/.obsidian/plugins/todotxt-kursaufgaben/.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist-obsidian', 'todotxt-kursaufgaben');
const tmp = path.join(root, 'dist-obsidian', '.app');
const stub = path.join(root, 'obsidian/app/capacitor-stub.ts');
const alias = {
  '@capacitor/core': stub,
  '@capacitor/filesystem': stub,
  '@capawesome/capacitor-google-sign-in': stub,
};

fs.rmSync(path.join(root, 'dist-obsidian'), { recursive: true, force: true });

// 1) Full app -> one HTML file
await build({
  root,
  configFile: false,
  publicDir: false,
  base: './',
  logLevel: 'warn',
  plugins: [react(), tailwindcss()],
  resolve: { alias },
  build: {
    outDir: tmp,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: path.join(root, 'obsidian/app/embed.html'),
      output: { codeSplitting: false },
    },
  },
});

const htmlFile = path.join(tmp, 'obsidian/app/embed.html');
let html = fs.readFileSync(htmlFile, 'utf8');
const readAsset = (ref) => fs.readFileSync(path.resolve(path.dirname(htmlFile), ref), 'utf8');
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_m, src) =>
  `<script type="module">${readAsset(src).replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_m, href) =>
  `<style>${readAsset(href).replace(/<\/style/gi, '<\\/style')}</style>`);
if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('app.html still references external assets');
// Images from public/ that the app references as "./name.png" become data URIs
for (const name of ['favicon.png', 'apple-touch-icon.png']) {
  const uri = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public', name)).toString('base64');
  for (const q of ['"', "'", '`']) html = html.split(q + './' + name + q).join(q + uri + q);
}

// 2) Plugin -> main.js
await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  resolve: { alias },
  build: {
    outDir: out,
    emptyOutDir: true,
    minify: true,
    lib: { entry: path.join(root, 'obsidian/plugin/main.ts'), formats: ['cjs'], fileName: () => 'main.js' },
    rollupOptions: {
      external: ['obsidian', 'electron', ...builtinModules, ...builtinModules.map((m) => 'node:' + m)],
      output: { exports: 'default' },
    },
  },
});

fs.writeFileSync(path.join(out, 'app.html'), html);
for (const f of ['manifest.json', 'styles.css']) fs.copyFileSync(path.join(root, 'obsidian/plugin', f), path.join(out, f));
fs.rmSync(tmp, { recursive: true, force: true });

const size = (f) => (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB';
console.log(`Obsidian-Plugin gebaut: ${out}\n  main.js ${size('main.js')}, app.html ${size('app.html')}`);

// 3) Optional deploy
const i = process.argv.indexOf('--deploy');
if (i >= 0) {
  const vaults = process.argv.slice(i + 1);
  if (!vaults.length) throw new Error('--deploy braucht mindestens einen Vault-Pfad');
  for (const v of vaults) {
    const target = path.join(v.replace(/^~(?=\/|$)/, process.env.HOME), '.obsidian', 'plugins', 'todotxt-kursaufgaben');
    fs.mkdirSync(target, { recursive: true });
    for (const f of fs.readdirSync(out)) fs.copyFileSync(path.join(out, f), path.join(target, f));
    console.log('  kopiert nach ' + target);
  }
}
