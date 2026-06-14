import { useEffect, useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Login } from './components/Login';
import { logout, getUserProfilePhoto } from './services/authService';
import { TodoApp } from './components/TodoApp';
import { applyTheme } from './services/themeService';
import { clearWebDavCredentials, clearGitCredentials } from './services/storageService';
import { setGoogleDriveToken, clearGoogleDriveCredentials } from './services/providers/GoogleDriveSyncProvider';

function App() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  const [storageMode, setStorageMode] = useState<'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive' | null>(() => {
    const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
    const lastMode = localStorage.getItem('todo_txt_last_mode');
    const localSetupComplete = localStorage.getItem('todo_txt_local_setup_complete');

    if (isElectron && lastMode === 'onedrive') {
      return null;
    }
    if (!lastMode) {
      if (localSetupComplete === 'true') {
        return null;
      }
      localStorage.setItem('todo_txt_last_mode', 'local');
      localStorage.setItem('todo_txt_onboarding_active', 'true');
      localStorage.setItem('todo_txt_onboarding_syntax_active', 'true');
      localStorage.setItem('todo_txt_local_setup_complete', 'true');

      // Detect language for default tasks
      const savedLang = localStorage.getItem('todo_txt_language');
      let lang = 'de';
      if (savedLang) {
        lang = savedLang;
      } else {
        const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'de';
        if (['de', 'en'].includes(browserLang)) {
          lang = browserLang;
        } else {
          lang = 'en';
        }
      }

      const welcomeTasks = lang === 'de' ? [
        "(A) Willkommen in der App! Erledige diese Aufgabe durch Klicken auf das Kästchen links",
        "Aufgabe hinzufügen durch Eingabe im Textfeld der Kopfzeile",
        "Aufgaben strukturieren mit +Projekten und @Kontexten",
        "Aufgabe mit Priorität (B) und Fälligkeitsdatum ausprobieren",
        "Detaillierte Anleitung ansehen mit dem '?' Symbol oben rechts"
      ].join('\n') : [
        "(A) Welcome to the app! Complete this task by clicking the checkbox on the left",
        "Add a task by typing in the input field in the header",
        "Structure tasks with +projects and @contexts",
        "Task with priority (B) due:2026-06-25 try due dates",
        "View detailed instructions using the '?' icon on the top right"
      ].join('\n');

      localStorage.setItem('todo_txt_local_content', welcomeTasks);
      return 'local';
    }
    return lastMode as any;
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    applyTheme();

    // Splash-Screen ausblenden und entfernen sobald die App bereit ist
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      setTimeout(() => {
        splash.remove();
      }, 400);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      document.body.classList.add('using-keyboard');
    };

    const handleMouseDown = () => {
      document.body.classList.remove('using-keyboard');
    };

    const handleTouchStart = () => {
      document.body.classList.remove('using-keyboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
    if (accounts.length > 0 && !isElectron) {
      instance.setActiveAccount(accounts[0]);
      setStorageMode('onedrive');
      localStorage.setItem('todo_txt_last_mode', 'onedrive');
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (isAuthenticated && storageMode === 'onedrive') {
      getUserProfilePhoto().then(url => {
        setAvatarUrl(url);
      });
    } else {
      setAvatarUrl(null);
    }
  }, [isAuthenticated, storageMode]);

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex items-center justify-center font-sans">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Verarbeite Microsoft Login...</p>
        </div>
      </div>
    );
  }

  const showLogin = (!isAuthenticated && storageMode === 'onedrive') || !storageMode;

  if (showLogin) {
    return (
      <Login 
        onLocalMode={() => {
          setStorageMode('local');
          localStorage.setItem('todo_txt_last_mode', 'local');
        }} 
        onWebDavMode={() => {
          setStorageMode('webdav');
          localStorage.setItem('todo_txt_last_mode', 'webdav');
        }}
        onGitMode={() => {
          setStorageMode('git');
          localStorage.setItem('todo_txt_last_mode', 'git');
        }}
        onGoogleDriveMode={(token) => {
          setGoogleDriveToken(token);
          setStorageMode('gdrive');
          localStorage.setItem('todo_txt_last_mode', 'gdrive');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex flex-col font-sans">
      <main className="flex-1 flex flex-col overflow-hidden">
        <TodoApp 
          storageMode={storageMode} 
          onLogout={() => {
            if (storageMode) {
              localStorage.setItem('todo_txt_prev_storage_mode', storageMode);
            }
            if (storageMode === 'onedrive') {
              logout();
            } else if (storageMode === 'webdav') {
              clearWebDavCredentials();
            } else if (storageMode === 'git') {
              clearGitCredentials();
            } else if (storageMode === 'gdrive') {
              clearGoogleDriveCredentials();
            }
            setStorageMode(null);
            localStorage.removeItem('todo_txt_last_mode');
          }}
          onSetupSync={() => {
            if (storageMode) {
              localStorage.setItem('todo_txt_prev_storage_mode', storageMode);
            }
            setStorageMode(null);
            localStorage.removeItem('todo_txt_last_mode');
            localStorage.removeItem('todo_txt_onboarding_active');
          }}
          username={
            storageMode === 'onedrive' && isAuthenticated && accounts[0]
              ? (accounts[0].name || accounts[0].username)
              : storageMode === 'webdav'
              ? 'WebDAV Sync'
              : storageMode === 'git'
              ? 'GitHub Sync'
              : storageMode === 'gdrive'
              ? 'Google Drive'
              : null
          }
          avatarUrl={avatarUrl}
        />
      </main>
    </div>
  );
}

export default App;
