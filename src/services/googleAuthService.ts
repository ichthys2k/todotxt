import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-placeholder.apps.googleusercontent.com';

export interface GoogleUser {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  token: string;
}

let electronLoginCallback: ((user: GoogleUser) => void) | null = null;

if (typeof window !== 'undefined') {
  (window as any).handleElectronDeepLink = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      if (url.protocol === 'todotxt:') {
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email') || '';
        const id = url.searchParams.get('id') || '';
        const name = url.searchParams.get('name') || '';
        const imageUrl = url.searchParams.get('imageUrl') || '';

        if (token && electronLoginCallback) {
          electronLoginCallback({ id, email, name, imageUrl, token });
        }
      }
    } catch (e) {
      console.error('Failed to parse Electron deep link URL:', e);
    }
  };
}

export const googleAuthService = {
  async initialize(): Promise<void> {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'android' || platform === 'ios') {
      try {
        await GoogleSignIn.initialize({
          clientId: CLIENT_ID,
        });
      } catch (e) {
        console.warn('Native Google Auth initialization warning:', e);
      }
    } else if (platform === 'web') {
      return new Promise<void>((resolve) => {
        if ((window as any).google) {
          resolve();
          return;
        }

        const existingScript = document.getElementById('google-gsi-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }
  },

  isElectron(): boolean {
    return typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
  },

  // Native OAuth2 Token Client popup (returns Access Token)
  async login(onSuccess: (user: GoogleUser) => void, onFailure: (err: any) => void, emailHint?: string): Promise<void> {
    const platform = Capacitor.getPlatform();

    if (this.isElectron()) {
      electronLoginCallback = onSuccess;
      const authHelperUrl = `https://www.lipponer.de/2do/auth.html?client_id=${CLIENT_ID}&redirect=todotxt://auth`;
      if ((window as any).electronAPI && (window as any).electronAPI.openExternal) {
        (window as any).electronAPI.openExternal(authHelperUrl);
      } else {
        window.open(authHelperUrl, '_blank');
      }
      return;
    }

    if (platform === 'android' || platform === 'ios') {
      try {
        const result = await GoogleSignIn.signIn();
        if (result.accessToken || result.idToken) {
          onSuccess({
            id: result.userId || '',
            email: result.email || '',
            name: result.displayName || '',
            imageUrl: result.imageUrl || '',
            token: result.accessToken || result.idToken || '',
          });
        } else {
          throw new Error('No authentication tokens received');
        }
      } catch (e) {
        onFailure(e);
      }
    } else {
      try {
        if (!(window as any).google) {
          await this.initialize();
        }
        const google = (window as any).google;
        if (!google) throw new Error('Google SDK not loaded');

        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
          callback: async (response: any) => {
            if (response.error) {
              onFailure(response);
              return;
            }
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const userInfo = await userInfoRes.json();
              onSuccess({
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                imageUrl: userInfo.picture,
                token: response.access_token,
              });
            } catch (e) {
              onSuccess({
                id: 'gdrive-user',
                email: emailHint || '',
                token: response.access_token,
              });
            }
          },
        });

        tokenClient.requestAccessToken({
          prompt: emailHint ? '' : 'select_account',
          hint: emailHint,
        });
      } catch (e) {
        onFailure(e);
      }
    }
  },

  // Initialize One Tap which automatically displays NYT-style prompt
  async initializeOneTap(onSuccess: (user: GoogleUser) => void, onFailure: (err: any) => void): Promise<void> {
    if (this.isElectron() || Capacitor.getPlatform() !== 'web') return;

    try {
      const google = (window as any).google;
      if (!google) return;

      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: any) => {
          const idToken = response.credential;
          const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          
          // User clicked "Continue as Cornelius". Now request the actual Google Drive Access Token
          this.login(onSuccess, onFailure, payload.email);
        },
        auto_select: false,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.warn('One Tap not displayed:', notification.getNotDisplayedReason());
        }
      });
    } catch (e) {
      console.error('One Tap initialization error:', e);
    }
  }
};
