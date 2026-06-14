import { useState } from 'react';
import { loginWithMicrosoft } from '../services/authService';
import { useGoogleLogin } from '@react-oauth/google';
import { X } from 'lucide-react';

interface LoginProps {
  onLocalMode: () => void;
  onWebDavMode: () => void;
  onGitMode: () => void;
  onGoogleDriveMode: (token: string) => void;
  externalError?: string | null;
}

export const Login = ({ onLocalMode, onWebDavMode, onGitMode, onGoogleDriveMode, externalError }: LoginProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      onGoogleDriveMode(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setError('Google Anmeldung fehlgeschlagen.');
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'consent'
  });

  const displayError = error || externalError;

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithMicrosoft();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };




  const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 text-center relative">
        <button 
          onClick={onLocalMode}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
          title="Schließen / Lokal fortfahren"
        >
          <X size={18} />
        </button>
        <img 
          src="./apple-touch-icon.png" 
          alt="Todo.txt Logo" 
          className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-xl shadow-slate-900/10 dark:shadow-black/30" 
        />
        
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Todo.txt</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Serverless Sync für deine Aufgaben</p>
        
        <div className="space-y-4">
            {!isElectron && (
              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-50 py-3.5 px-4 rounded-xl font-medium transition-all duration-200 disabled:opacity-70 group border border-slate-200 dark:border-transparent dark:hover:bg-slate-100 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                    <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                    <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                    <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
                  </svg>
                )}
                <span>Mit Microsoft anmelden</span>
              </button>
            )}

            {!isElectron && (
              <button 
                onClick={() => googleLogin()}
                className="w-full relative flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-50 py-3.5 px-4 rounded-xl font-medium transition-all duration-200 group border border-slate-200 dark:border-transparent dark:hover:bg-slate-100 cursor-pointer mt-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Mit Google anmelden</span>
              </button>
            )}

            <button 
              onClick={onWebDavMode}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 py-3.5 px-4 rounded-xl font-medium transition-colors border border-indigo-100 dark:border-indigo-950/30 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="m16 12-4-4-4 4"/>
                <path d="M12 16V8"/>
              </svg>
              <span>Mit WebDAV verbinden</span>
            </button>

            <button 
              onClick={onGitMode}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white py-3.5 px-4 rounded-xl font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3.18-.35 6.5-1.5 6.5-7.16 0-1.6-.5-2.9-1.3-3.9.1-.3.6-1.9-.1-4 0 0-1.1-.4-3.5 1.3a12.1 12.1 0 0 0-6.4 0C6.9 2.5 5.8 2.9 5.8 2.9c-.7 2.1-.2 3.7-.1 4-.8 1-1.3 2.3-1.3 3.9 0 5.6 3.3 6.8 6.5 7.16a4.8 4.8 0 0 0-1 3.24V22" />
              </svg>
              <span>Mit GitHub verbinden</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">Oder</span>
              </div>
            </div>

            <button 
              onClick={onLocalMode}
              className="w-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 px-4 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Lokal nutzen (ohne Sync)
            </button>
          </div>

        {displayError && (
          <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-200 text-sm">
            {displayError}
          </div>
        )}
      </div>
    </div>
  );
};
