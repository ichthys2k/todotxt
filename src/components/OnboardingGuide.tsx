import { Sparkles, FileText, Layers, Tag, Calendar, Play } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface OnboardingGuideProps {
  onLoadSamples: () => void;
  language: Language;
}

export const OnboardingGuide = ({ onLoadSamples, language }: OnboardingGuideProps) => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-fade-in">
      {/* Hero Welcome Section */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
          <Sparkles size={32} className="animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-55">
          {t('onboardingWelcome', language)}
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-base">
          {t('onboardingSubtitle', language)}
        </p>
      </div>

      {/* Syntax Guide Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" />
          {t('onboardingSyntaxTitle', language)}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: Priorities */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 transition-all hover:scale-[1.01]">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold">
              (A)
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                {t('onboardingSyntaxPrio', language)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('onboardingSyntaxPrioDesc', language)}
              </p>
            </div>
          </div>

          {/* Card 2: Projects */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 transition-all hover:scale-[1.01]">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
              <Layers size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                {t('onboardingSyntaxProj', language)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('onboardingSyntaxProjDesc', language)}
              </p>
            </div>
          </div>

          {/* Card 3: Contexts */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 transition-all hover:scale-[1.01]">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400">
              <Tag size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                {t('onboardingSyntaxCtx', language)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('onboardingSyntaxCtxDesc', language)}
              </p>
            </div>
          </div>

          {/* Card 4: Due Dates */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 transition-all hover:scale-[1.01]">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Calendar size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                {t('onboardingSyntaxMeta', language)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('onboardingSyntaxMetaDesc', language)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="text-center">
        <button
          onClick={onLoadSamples}
          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 dark:from-indigo-700 dark:to-indigo-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-2xl shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Play size={18} className="fill-current" />
          <span>{t('onboardingLoadSamples', language)}</span>
        </button>
      </div>
    </div>
  );
};
