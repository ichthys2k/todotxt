/* eslint-disable react-refresh/only-export-components -- entry point, not a module for fast refresh */
/**
 * The browser extension's side panel: the full web app, with file access
 * through the native messaging host (see nativeBridge.ts).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { TodoApp } from '../../src/components/TodoApp';
import { applyTheme } from '../../src/services/themeService';
import { applyDensity } from '../../src/services/densityService';
import { callHost, createElectronApi } from './nativeBridge';

const root = createRoot(document.getElementById('root')!);

const Setup = ({ error }: { error: string }) => (
  <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5, maxWidth: 520 }}>
    <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Todo.txt: Hilfsprogramm fehlt</h2>
    <p>Die Erweiterung braucht ein kleines Hilfsprogramm, um deine todo.txt zu lesen und zu schreiben.</p>
    <p>Im Ordner der Todo.txt-WebApp einmal ausführen und danach diese Leiste neu öffnen:</p>
    <pre style={{ background: 'rgba(127,127,127,.15)', padding: 8, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
      node browser/native/install.mjs
    </pre>
    <p style={{ opacity: 0.7, fontSize: 13 }}>Meldung: {error}</p>
  </div>
);

const start = async () => {
  applyTheme();
  applyDensity();
  try {
    await callHost('ping', {}, 5000);
  } catch (e) {
    root.render(<Setup error={String((e as Error)?.message ?? e)} />);
    return;
  }

  window.electronAPI = createElectronApi();
  window.__todoTxtHost = { name: 'browser' };

  // Always the local file mode in the extension
  localStorage.setItem('todo_txt_last_mode', 'local');
  localStorage.setItem('todo_txt_local_setup_complete', 'true');

  root.render(
    <StrictMode>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex flex-col font-sans">
        <main className="flex-1 flex flex-col overflow-hidden">
          <TodoApp storageMode="local" username={null} onLogout={() => window.location.reload()} onSetupSync={() => window.location.reload()} />
        </main>
      </div>
    </StrictMode>,
  );
};

void start();
