/* eslint-disable @typescript-eslint/no-explicit-any -- Obsidian API is used without its type package */
/**
 * Entry point of the full app inside the Obsidian plugin.
 *
 * The plugin loads this page into an iframe (srcdoc, same origin as Obsidian)
 * and exposes `window.__todoTxtBridge` on the parent window. The bridge
 * provides an Electron-compatible `electronAPI`, so the app uses its existing
 * Electron file code path (local todo.txt and archive.txt).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { TodoApp } from '../../src/components/TodoApp';
import { applyTheme } from '../../src/services/themeService';
import { applyDensity } from '../../src/services/densityService';

const bridge = (() => {
  try {
    return (window.parent as any)?.__todoTxtBridge ?? null;
  } catch {
    return null;
  }
})();

const root = createRoot(document.getElementById('root')!);

if (!bridge?.electronAPI) {
  root.render(
    <p style={{ padding: 16, fontFamily: 'system-ui' }}>
      Die Todo.txt-App läuft nur innerhalb des Obsidian-Plugins.
    </p>,
  );
} else {
  window.electronAPI = bridge.electronAPI;
  window.__todoTxtHost = { name: 'obsidian' };

  // Always use the local file mode inside Obsidian
  localStorage.setItem('todo_txt_last_mode', 'local');
  localStorage.setItem('todo_txt_local_setup_complete', 'true');

  applyTheme();
  applyDensity();

  root.render(
    <StrictMode>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex flex-col font-sans">
        <main className="flex-1 flex flex-col overflow-hidden">
          <TodoApp
            storageMode="local"
            username={null}
            onLogout={() => bridge.openSettings?.()}
            onSetupSync={() => bridge.openSettings?.()}
          />
        </main>
      </div>
    </StrictMode>,
  );
}
