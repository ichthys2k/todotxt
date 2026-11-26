/**
 * Reine Prüfregeln für den Electron-Hauptprozess (ohne Electron-Abhängigkeit, damit testbar).
 *
 * Idee: Die Oberfläche (Renderer) gilt als nicht vertrauenswürdig. Sollte dort durch einen
 * Fehler (z. B. XSS über Aufgabentext) fremder Code laufen, darf er über die IPC-Kanäle
 * nur das, was die App wirklich braucht: die zwei vom Nutzer gewählten Dateien lesen/schreiben
 * und normale Web-Links im Systembrowser öffnen.
 */
const path = require('path');

/** Maximale Größe einer todo.txt/archive.txt, die gelesen oder geschrieben wird. */
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Nur diese Protokolle dürfen extern geöffnet werden (nie file:, javascript:, ms-msdt: usw.). */
const SAFE_EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);

function isSafeExternalUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol);
}

/** Absoluter, normalisierter Pfad zum Vergleichen (unter Windows ohne Groß-/Kleinschreibung) – oder null. */
function comparablePath(value) {
  if (typeof value !== 'string' || value === '' || value.includes('\0')) return null;
  if (!path.isAbsolute(value)) return null;
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function samePath(a, b) {
  const ca = comparablePath(a);
  const cb = comparablePath(b);
  return ca !== null && cb !== null && ca === cb;
}

/** Ist filePath einer der erlaubten Pfade (z. B. die gespeicherten todo.txt/archive.txt)? */
function isAllowedFile(filePath, allowedPaths) {
  return allowedPaths.some((allowed) => allowed && samePath(filePath, allowed));
}

/**
 * Darf das Fenster von currentUrl nach targetUrl navigieren?
 * Erlaubt ist nur die App selbst: dieselbe Datei (file://) bzw. derselbe Ursprung (Entwicklungsserver).
 */
function isAllowedNavigation(targetUrl, currentUrl) {
  try {
    const target = new URL(targetUrl);
    const current = new URL(currentUrl);
    if (current.protocol === 'file:') {
      return target.protocol === 'file:' && target.pathname === current.pathname;
    }
    return target.origin === current.origin;
  } catch {
    return false;
  }
}

module.exports = {
  MAX_FILE_BYTES,
  isSafeExternalUrl,
  comparablePath,
  samePath,
  isAllowedFile,
  isAllowedNavigation,
};
