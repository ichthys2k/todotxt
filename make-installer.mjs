/**
 * make-installer.mjs
 *
 * Builds a Windows Installer (.exe) using electron-builder's "nsis" target.
 *
 * Problem:  electron-builder downloads winCodeSign-2.6.0 and tries to create
 *           macOS symlinks (darwin/.../libcrypto.dylib etc.) on Windows.
 *           Without Developer Mode, symlink creation fails with EPERM.
 *
 * Fix:      We pre-populate the electron-builder cache by downloading
 *           winCodeSign ourselves and extracting it with 7-Zip while
 *           EXCLUDING the darwin/ subdirectory (macOS-only, not needed for
 *           Windows builds). When electron-builder finds the cache already
 *           populated it skips the download+extraction entirely.
 *
 * Usage:  npm run electron:installer
 */

import { execSync }           from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path                   from 'path';

// Path to the 7za.exe bundled with the project (via 7zip-bin)
const SEVEN_ZIP = path.join('node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

// electron-builder cache location for winCodeSign
const WIN_CODE_SIGN_VERSION = 'winCodeSign-2.6.0';
const LOCALAPPDATA   = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const CACHE_ROOT     = path.join(LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const CACHE_FINAL    = path.join(CACHE_ROOT, WIN_CODE_SIGN_VERSION);   // ← electron-builder looks here
const CACHE_TMP_ZIP  = path.join(CACHE_ROOT, `${WIN_CODE_SIGN_VERSION}.7z`);
const WIN_CODE_SIGN_URL =
  `https://github.com/electron-userland/electron-builder-binaries/releases/download/${WIN_CODE_SIGN_VERSION}/${WIN_CODE_SIGN_VERSION}.7z`;

// ── 1. Pre-populate winCodeSign cache ────────────────────────────────────────
if (!existsSync(CACHE_FINAL)) {
  console.log('\n🔧  Lade winCodeSign-Cache vor (einmalig, ~10 s) …');
  mkdirSync(CACHE_ROOT,  { recursive: true });
  mkdirSync(CACHE_FINAL, { recursive: true });

  // Download archive via PowerShell Invoke-WebRequest (handles HTTPS + redirects)
  console.log('   Herunterladen …');
  execSync(
    `powershell -NoProfile -Command "Invoke-WebRequest -Uri '${WIN_CODE_SIGN_URL}' -OutFile '${CACHE_TMP_ZIP}'"`,
    { stdio: 'inherit' }
  );

  // Extract everything EXCEPT the darwin/ directory which contains macOS symlinks
  // (libcrypto.dylib, libssl.dylib) that cannot be created on Windows without
  // Developer Mode. The darwin tools are only needed for macOS code signing.
  console.log('   Entpacke (ohne macOS-Symlinks) …');
  execSync(
    `"${SEVEN_ZIP}" x -y -bd -xr!darwin "${CACHE_TMP_ZIP}" "-o${CACHE_FINAL}"`,
    { stdio: 'inherit' }
  );

  // Remove the downloaded zip (cache dir stays)
  execSync(`del "${CACHE_TMP_ZIP}"`, { shell: true, stdio: 'pipe' });

  console.log('✅  Code-Sign-Cache bereit\n');
} else {
  console.log(`ℹ️   winCodeSign-Cache vorhanden: ${CACHE_FINAL}`);
}

// ── 2. Vite / TypeScript build ────────────────────────────────────────────────
console.log('\n📦  Baue Web-App (Vite) …');
execSync('npm run build', { stdio: 'inherit' });

// ── 3. electron-builder NSIS installer ───────────────────────────────────────
console.log('\n⚙️   Erstelle Windows Installer (Setup EXE) …');
execSync('npx electron-builder --win nsis', {
  stdio: 'inherit',
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false', // skip certificate search
    WIN_CSC_LINK: '',                     // no signing certificate
  },
});

console.log('\n✅  Fertig: dist-desktop\\TodoTxt-Windows-Setup.exe');
console.log('   → Starte die Setup-Datei, um die Anwendung zu installieren.\n');
