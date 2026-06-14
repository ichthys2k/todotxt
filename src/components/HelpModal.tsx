import { useState } from 'react';
import { X, HelpCircle, FileText, Cloud, Keyboard } from 'lucide-react';
import type { Language } from '../services/translationService';
import { helpTranslations } from '../services/helpTranslations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSetupSync?: () => void;
}

type TabType = 'syntax' | 'sync' | 'hotkeys';

const localTexts: Record<Language, { helpAndGuide: string; close: string; keyboardShortcuts: string; gotIt: string; setupSync: string }> = {
  de: { helpAndGuide: 'Hilfe & Anleitung', close: 'Schließen', keyboardShortcuts: 'Tastatur-Hotkeys', gotIt: 'Verstanden', setupSync: 'Synchronisation / Cloud-Verbindung einrichten' },
  en: { helpAndGuide: 'Help & Guide', close: 'Close', keyboardShortcuts: 'Keyboard Shortcuts', gotIt: 'Got it', setupSync: 'Set up synchronization / cloud connection' },
  la: { helpAndGuide: 'Auxilium & Regula', close: 'Claudere', keyboardShortcuts: 'Brevia Claviaturae', gotIt: 'Intellexi', setupSync: 'Synchronisationem / Nexum nubis constituere' },
  fr: { helpAndGuide: 'Aide & Guide', close: 'Fermer', keyboardShortcuts: 'Raccourcis Clavier', gotIt: 'Compris', setupSync: 'Configurer la synchronisation / connexion cloud' },
  it: { helpAndGuide: 'Aiuto & Guida', close: 'Chiudi', keyboardShortcuts: 'Scorciatoie da Tastiera', gotIt: 'Capito', setupSync: 'Configura sincronizzazione / connessione cloud' },
  es: { helpAndGuide: 'Ayuda & Guía', close: 'Cerrar', keyboardShortcuts: 'Atajos de Teclado', gotIt: 'Entendido', setupSync: 'Configurar sincronización / conexión en la nube' },
  zh: { helpAndGuide: '帮助与指南', close: '关闭', keyboardShortcuts: '键盘快捷键', gotIt: '知道了', setupSync: '设置同步 / 云连接' },
  ar: { helpAndGuide: 'المساعدة والدليل', close: 'إغلاق', keyboardShortcuts: 'اختصارات لوحة المفاتيح', gotIt: 'مفهوم', setupSync: 'إعداد المزامنة / الاتصال السحابي' },
  hi: { helpAndGuide: 'सहायता और गाइड', close: 'बंद करें', keyboardShortcuts: 'कीबोर्ड शॉर्टकट', gotIt: 'समझ गया', setupSync: 'सिंक्रनाइज़ेशन / क्लाउड कनेक्शन सेटअप करें' },
  pt: { helpAndGuide: 'Ajuda & Guia', close: 'Fechar', keyboardShortcuts: 'Atalhos de Teclado', gotIt: 'Entendi', setupSync: 'Configurar sincronização / conexão de nuvem' },
  sw: { helpAndGuide: 'Hilf & Aleitung', close: 'Zuamacha', keyboardShortcuts: 'Taschdadur-Hotkeys', gotIt: 'Verstanda', setupSync: 'Mipangilio ya maingiliano / wingu nexum' },
  uk: { helpAndGuide: 'Довідка та посібник', close: 'Закрити', keyboardShortcuts: 'Гарячі клавіші', gotIt: 'Зрозуміло', setupSync: 'Налаштувати синхронізацію / хмарне підключення' },
  he: { helpAndGuide: 'עזרה ומדריך', close: 'סגור', keyboardShortcuts: 'קיצורי מקלדת', gotIt: 'הבנתי', setupSync: 'הגדרת סנכרון / חיבור לענן' },
  el: { helpAndGuide: 'Βοήθεια & Οδηγός', close: 'Κλείσιμο', keyboardShortcuts: 'Συντομεύσεις Πληκτρολογίου', gotIt: 'Κατανοητό', setupSync: 'Ρύθμιση συγχρονισμού / σύνδεσης cloud' },
  tr: { helpAndGuide: 'Yardım ve Kılavuz', close: 'Kapat', keyboardShortcuts: 'Klavye Kısayolları', gotIt: 'Anlaşıldı', setupSync: 'Senkronizasyon / bulut bağlantısı ayarla' }
};

export const HelpModal = ({ isOpen, onClose, language, onSetupSync }: HelpModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('syntax');

  if (!isOpen) return null;

  const texts = localTexts[language] || localTexts['en'];
  const helpContent = helpTranslations[language] || helpTranslations['en'];
  const isRtl = language === 'ar' || language === 'he';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-10 w-full sm:max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up text-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-6 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-500 animate-pulse" /> {texts.helpAndGuide}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            title={texts.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 p-2 gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab('syntax')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'syntax'
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/35'
            }`}
          >
            <FileText size={15} /> todo.txt Syntax
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/35'
            }`}
          >
            <Cloud size={15} /> Sync und Speichern
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'hotkeys'
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/35'
            }`}
          >
            <Keyboard size={15} /> {texts.keyboardShortcuts}
          </button>
        </div>
        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* TAB 1: SYNTAX */}
          {activeTab === 'syntax' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">{helpContent.syntaxTitle}</h4>
                <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
                  {helpContent.syntaxIntroduction}
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40">
                <h5 className="font-bold text-slate-750 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-indigo-500 rounded-full"></span> {helpContent.sampleLineTitle}
                </h5>
                <div className="font-mono text-xs p-3 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre">
                  <span className="text-red-650 dark:text-red-400 font-bold">(A)</span> 2026-06-05 Einkaufen gehen <span className="text-emerald-600 dark:text-emerald-400 font-semibold">@supermarkt</span> <span className="text-purple-650 dark:text-purple-400 font-semibold">+wochenende</span> <span className="text-slate-500 dark:text-slate-400 font-semibold">due:2026-06-06</span> who:cornelius
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">{helpContent.syntaxElementsTitle}</h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {helpContent.elements.map((el, i) => (
                    <div key={i} className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 space-y-1">
                      <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">{el.title}</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{el.example}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{el.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ONEDRIVE SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6 animate-fade-in text-slate-650 dark:text-slate-350 leading-relaxed">
              <div>
                <h4 className="text-base font-bold text-slate-855 dark:text-slate-100 mb-2">{helpContent.syncTitle}</h4>
                <p>{helpContent.syncIntroduction}</p>
              </div>

              <div className="space-y-4">
                {helpContent.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">{step.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {onSetupSync && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onSetupSync();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Cloud size={14} /> {texts.setupSync}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOTKEYS */}
          {activeTab === 'hotkeys' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-slate-855 dark:text-slate-100 mb-2">{helpContent.hotkeysTitle}</h4>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2 text-xs">
                  {helpContent.hotkeyList.map((hotkey, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                      <span className="text-slate-700 dark:text-slate-300">{hotkey.desc}</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono shadow-xs">{hotkey.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-100 dark:bg-slate-900/30 flex justify-end flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {texts.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
