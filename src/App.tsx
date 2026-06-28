import { useEffect, useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { Login } from './components/Login';
import { logout, getUserProfilePhoto } from './services/authService';
import { TodoApp } from './components/TodoApp';
import { applyTheme } from './services/themeService';
import { clearWebDavCredentials, clearGitCredentials } from './services/storageService';
import { setGoogleDriveToken, clearGoogleDriveCredentials } from './services/providers/GoogleDriveSyncProvider';
import { WidgetView } from './components/WidgetView';
import { googleAuthService } from './services/googleAuthService';
import { Capacitor } from '@capacitor/core';
import { syncProfileManager } from './services/syncProfileManager';
import { CookieConsentBanner } from './components/CookieConsentBanner';

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
      const isNative = Capacitor.isNativePlatform();
      if (isElectron || isNative) {
        localStorage.setItem('todo_txt_last_mode', 'local');
        localStorage.setItem('todo_txt_onboarding_active', 'true');
        localStorage.setItem('todo_txt_onboarding_syntax_active', 'true');
        localStorage.setItem('todo_txt_local_setup_complete', 'true');
        localStorage.setItem('todo_txt_local_content', '');
        return 'local';
      }
      return null;
    }
    return lastMode as any;
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [enableExperimentalSync, setEnableExperimentalSync] = useState<boolean>(() => {
    return localStorage.getItem('todo_txt_enable_experimental_sync') === 'true';
  });

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

    // Deep link listener for Electron
    let unsubscribeDeepLink: (() => void) | null = null;
    const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
    if (isElectron && (window as any).electronAPI && (window as any).electronAPI.onDeepLink) {
      unsubscribeDeepLink = (window as any).electronAPI.onDeepLink((url: string) => {
        if ((window as any).handleElectronDeepLink) {
          (window as any).handleElectronDeepLink(url);
        }
      });
    }

    // Google One Tap auto-login on Web
    const platform = Capacitor.getPlatform();
    const consent = localStorage.getItem('todo_txt_cookie_consent');
    const hasExternalConsent = consent ? JSON.parse(consent).externalServices : false;
    const isExperimentalSync = localStorage.getItem('todo_txt_enable_experimental_sync') === 'true';

    if (isExperimentalSync && hasExternalConsent && platform === 'web' && !isElectron && !localStorage.getItem('todo_txt_gdrive_token')) {
      setTimeout(() => {
        googleAuthService.initialize().then(() => {
          googleAuthService.initializeOneTap(
            async (user) => {
              setGoogleDriveToken(user.token);
              if (user.id) {
                localStorage.setItem('todo_txt_gdrive_user_id', user.id);
                try {
                  // Fetch and automatically apply the preferred sync profile (GitHub, WebDAV, etc.)
                  await syncProfileManager.autoLoadPreferredProfile(user.id);
                } catch (e) {
                  console.error('Failed to auto-load preferred profile:', e);
                }
              }
              window.location.reload();
            },
            (err) => {
              console.warn('Auto One Tap prompt deferred:', err);
            }
          );
        });
      }, 1500);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
      if (unsubscribeDeepLink) {
        unsubscribeDeepLink();
      }
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

  const isWidget = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'widget';

  if (isWidget) {
    return <WidgetView />;
  }

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
      <>
        <Login 
          enableExperimentalSync={enableExperimentalSync}
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
          onGoogleDriveMode={(token, userId) => {
            setGoogleDriveToken(token);
            if (userId) {
              localStorage.setItem('todo_txt_gdrive_user_id', userId);
            }
            setStorageMode('gdrive');
            localStorage.setItem('todo_txt_last_mode', 'gdrive');
          }}
        />
        <CookieConsentBanner />
      </>
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
            setEnableExperimentalSync(localStorage.getItem('todo_txt_enable_experimental_sync') === 'true');
          }}
          onSetupSync={() => {
            if (storageMode) {
              localStorage.setItem('todo_txt_prev_storage_mode', storageMode);
            }
            setStorageMode(null);
            localStorage.removeItem('todo_txt_last_mode');
            localStorage.removeItem('todo_txt_onboarding_active');
            setEnableExperimentalSync(localStorage.getItem('todo_txt_enable_experimental_sync') === 'true');
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
      <CookieConsentBanner />
    </div>
  );
}

export default App;
