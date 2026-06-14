import { Layers, Tag, Calendar, X } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface OnboardingGuideProps {
  language: Language;
  onDismiss: () => void;
}

export const OnboardingGuide = ({ language, onDismiss }: OnboardingGuideProps) => {
  return (
    <div className="max-w-3xl mx-auto py-1 px-1 animate-fade-in text-slate-850 dark:text-slate-200 relative">
      <button 
        onClick={onDismiss}
        className="absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title="Ausblenden"
      >
        <X size={16} />
      </button>
      <div className="mb-3.5 pr-8">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t('onboardingWelcome', language)}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('onboardingSubtitle', language)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Priorities */}
        <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/40 transition-all text-xs">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold text-xs select-none">
            (A)
          </div>
          <div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-200">
              {t('onboardingSyntaxPrio', language)}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
              {t('onboardingSyntaxPrioDesc', language)}
            </p>
          </div>
        </div>

        {/* Card 2: Projects */}
        <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/40 transition-all text-xs">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 select-none">
            <Layers size={14} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-200">
              {t('onboardingSyntaxProj', language)}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
              {t('onboardingSyntaxProjDesc', language)}
            </p>
          </div>
        </div>

        {/* Card 3: Contexts */}
        <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/40 transition-all text-xs">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 select-none">
            <Tag size={14} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-200">
              {t('onboardingSyntaxCtx', language)}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
              {t('onboardingSyntaxCtxDesc', language)}
            </p>
          </div>
        </div>

        {/* Card 4: Due Dates */}
        <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/40 transition-all text-xs">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 select-none">
            <Calendar size={14} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-200">
              {t('onboardingSyntaxMeta', language)}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
              {t('onboardingSyntaxMetaDesc', language)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
