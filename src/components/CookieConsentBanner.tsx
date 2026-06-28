import { useState, useEffect } from 'react';
import { Shield, Settings, Check } from 'lucide-react';

interface CookieConsent {
  essential: boolean;
  externalServices: boolean;
}

interface CookieConsentBannerProps {
  onConsentChange?: (consent: CookieConsent) => void;
}

export const CookieConsentBanner = ({ onConsentChange }: CookieConsentBannerProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    externalServices: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('todo_txt_cookie_consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        if (onConsentChange) {
          onConsentChange(parsed);
        }
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const newConsent = { essential: true, externalServices: true };
    setConsent(newConsent);
    localStorage.setItem('todo_txt_cookie_consent', JSON.stringify(newConsent));
    setShowBanner(false);
    if (onConsentChange) {
      onConsentChange(newConsent);
    }
  };

  const handleRejectAll = () => {
    const newConsent = { essential: true, externalServices: false };
    setConsent(newConsent);
    localStorage.setItem('todo_txt_cookie_consent', JSON.stringify(newConsent));
    setShowBanner(false);
    if (onConsentChange) {
      onConsentChange(newConsent);
    }
  };

  const handleSaveCustom = () => {
    localStorage.setItem('todo_txt_cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
    if (onConsentChange) {
      onConsentChange(consent);
    }
  };

  // Hilfsfunktion, um den Banner manuell wieder zu öffnen (kann über window-Event getriggert werden)
  useEffect(() => {
    const handleReopen = () => {
      setShowBanner(true);
    };
    window.addEventListener('todo_txt_reopen_cookie_consent', handleReopen);
    return () => {
      window.removeEventListener('todo_txt_reopen_cookie_consent', handleReopen);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto z-50 w-full sm:max-w-md p-4 sm:p-0 animate-slide-up">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 font-sans text-xs">
        
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Datenschutz &amp; Cookies</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Diese App speichert deine Aufgaben und Einstellungen ausschließlich lokal im Browser. 
              Für optionale Cloud-Synchronisierungen binden wir externe Dienste (Google Drive &amp; OneDrive) ein.
            </p>
          </div>
        </div>

        {/* Einstellungen Akkordeon */}
        {showSettings && (
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3.5 mb-4 animate-fade-in text-left">
            {/* Essenziell */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  Essenziell <span className="text-[10px] text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded font-medium">Immer aktiv</span>
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Erforderlich für den Betrieb der Anwendung, das Speichern deiner Aufgaben (Local Storage) und deine Einstellungen (Theme, Ansichten).
                </p>
              </div>
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            {/* Externe Dienste */}
            <div className="flex items-start justify-between gap-4 pt-3.5 border-t border-slate-200 dark:border-slate-800/80">
              <div>
                <span className="font-semibold text-slate-850 dark:text-slate-200">
                  Externe Synchronisierungsdienste
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  Ermöglicht das automatische Laden von Google- und Microsoft-Diensten, damit du deine Aufgaben direkt mit Google Drive oder OneDrive synchronisieren kannst.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none flex-shrink-0">
                <input
                  type="checkbox"
                  checked={consent.externalServices}
                  onChange={(e) => setConsent({ ...consent, externalServices: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-205 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-650 peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        )}

        {/* Buttons (DSGVO konform: "Alle ablehnen/akzeptieren" sind gleichwertig) */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {showSettings ? (
            <>
              <button
                onClick={handleSaveCustom}
                className="w-full sm:flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all cursor-pointer text-center border-none"
              >
                Auswahl speichern
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full sm:w-auto py-2.5 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all cursor-pointer text-center bg-transparent"
              >
                Zurück
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="w-full sm:flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl font-medium transition-all cursor-pointer text-center border-none"
              >
                Alle akzeptieren
              </button>
              <button
                onClick={handleRejectAll}
                className="w-full sm:flex-1 py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all cursor-pointer text-center bg-transparent"
              >
                Nur essenzielle
              </button>
            </>
          )}
        </div>

        {/* Footer Links & Einstellungen-Toggle */}
        <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex gap-2.5 font-medium">
            <a 
              href="https://www.lipponer.de/2do/impressum.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              Impressum
            </a>
            <span>•</span>
            <a 
              href="https://www.lipponer.de/2do/datenschutz.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              Datenschutz
            </a>
          </div>
          
          {!showSettings && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer font-medium border-none bg-transparent"
            >
              <Settings size={12} />
              <span>Anpassen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
