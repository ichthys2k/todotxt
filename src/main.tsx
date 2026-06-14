import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config/msal.ts';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

import { GoogleOAuthProvider } from '@react-oauth/google';

// Google Cloud Client ID für Todo.txt Web App
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Google Cloud Projektnummer / App-ID (erforderlich für drive.file Scope im Picker)
export const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';

// Google Cloud API-Schlüssel (für den Google Picker)
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Initialize MSAL before rendering
msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </GoogleOAuthProvider>
    </StrictMode>,
  );
});
