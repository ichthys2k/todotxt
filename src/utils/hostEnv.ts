/**
 * Host environment helpers.
 *
 * The app normally runs as a standalone page (web, Electron, Capacitor).
 * When it is embedded in another host (currently the Obsidian plugin in
 * `obsidian/`, which loads the app in an iframe), the host provides an
 * Electron-compatible `window.electronAPI` for file access and sets
 * `window.__todoTxtHost`. The app then behaves like the Electron desktop
 * build, also on hosts whose user agent is not Electron (Obsidian mobile).
 */

export interface TodoTxtHost {
  name: string;
  /** Project filter to start with (without "+"), e.g. "kurs/m/6c". */
  initialProject?: string | null;
}

declare global {
  interface Window {
    __todoTxtHost?: TodoTxtHost;
  }
}

/**
 * Event the host dispatches on the app's window to change the project filter:
 * `new CustomEvent(HOST_FILTER_EVENT, { detail: { project: 'kurs/m/6c' | null } })`
 */
export const HOST_FILTER_EVENT = 'todotxt:filter';

export const getHost = (): TodoTxtHost | undefined =>
  typeof window !== 'undefined' ? window.__todoTxtHost : undefined;

export const isEmbedded = (): boolean => !!getHost();

/** True for the Electron desktop build and for embedded hosts that provide electronAPI. */
export const isElectronEnv = (): boolean =>
  typeof window !== 'undefined' &&
  (window.navigator.userAgent.toLowerCase().includes('electron') || isEmbedded());
