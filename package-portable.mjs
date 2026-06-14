/**
 * package-portable.mjs
 *
 * Builds the Electron desktop app and packages it as a portable
 * Windows ZIP archive that can be run from any location (USB stick, etc.)
 * without installation.
 *
 * Strategy: electron-packager writes to a dedicated TEMP folder that is
 * never the same as the regular dist-desktop output, so a running app
 * instance never blocks the process.
 *
 * Usage:  npm run electron:portable
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

// Dedicated temp folder — separate from dist-desktop so a running app
// never causes EBUSY / EPERM errors.
const TEMP_OUT  = 'dist-portable-tmp';
const APP_DIR   = `${TEMP_OUT}\\Todo.txt Web App-win32-x64`;
const ZIP_OUT   = 'dist-desktop\\TodoTxt-Windows-Portable.zip';

// ── 1. Vite / TypeScript build ────────────────────────────────────────────────
console.log('\n📦  Baue Web-App (Vite) …');
execSync('npm run build', { stdio: 'inherit' });

// ── 2. Clean temp dir via PowerShell (handles read-only files safely) ─────────
if (existsSync(TEMP_OUT)) {
  console.log('🗑️   Räume temporären Ordner auf …');
  execSync(
    `powershell -NoProfile -Command "Remove-Item -Path '${TEMP_OUT}' -Recurse -Force -ErrorAction SilentlyContinue"`,
    { stdio: 'inherit' }
  );
}

// ── 3. Package app to temp dir ────────────────────────────────────────────────
console.log('\n⚙️   Erstelle Electron-App …');
execSync(
  `electron-packager . "Todo.txt Web App" --platform=win32 --arch=x64 --out=${TEMP_OUT}`,
  { stdio: 'inherit' }
);

if (!existsSync(APP_DIR)) {
  console.error(`\n❌  Packager-Ausgabe nicht gefunden: ${APP_DIR}`);
  process.exit(1);
}

// ── 4. Create portable ZIP ────────────────────────────────────────────────────
// Remove old ZIP first
if (existsSync(ZIP_OUT)) {
  execSync(
    `powershell -NoProfile -Command "Remove-Item -Path '${ZIP_OUT}' -Force"`,
    { stdio: 'inherit' }
  );
}

console.log('\n🗜️   Erstelle portable ZIP …');
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${APP_DIR}\\*' -DestinationPath '${ZIP_OUT}'"`,
  { stdio: 'inherit' }
);

// ── 5. Remove temp dir ────────────────────────────────────────────────────────
console.log('🧹  Bereinige temporären Ordner …');
execSync(
  `powershell -NoProfile -Command "Remove-Item -Path '${TEMP_OUT}' -Recurse -Force -ErrorAction SilentlyContinue"`,
  { stdio: 'inherit' }
);

console.log(`\n✅  Portable App fertig: ${ZIP_OUT}`);
console.log('   → ZIP entpacken und "Todo.txt Web App.exe" starten.\n');
