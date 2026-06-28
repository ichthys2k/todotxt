export interface AccentStyle {
  normal: string;
  selected: string;
  hover: string;
}

export const PROJECT_COLOR_PRESETS: Record<string, AccentStyle> = {
  purple: {
    normal: "bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-100 dark:border-purple-900",
    selected: "bg-purple-600 dark:bg-purple-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-900"
  },
  blue: {
    normal: "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900",
    selected: "bg-blue-600 dark:bg-blue-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900"
  },
  indigo: {
    normal: "bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900",
    selected: "bg-indigo-600 dark:bg-indigo-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900"
  },
  pink: {
    normal: "bg-pink-50 dark:bg-pink-950 text-pink-800 dark:text-pink-200 border border-pink-100 dark:border-pink-900",
    selected: "bg-pink-600 dark:bg-pink-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-pink-100 dark:hover:bg-pink-900"
  },
  rose: {
    normal: "bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-100 dark:border-rose-900",
    selected: "bg-rose-600 dark:bg-rose-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-rose-100 dark:hover:bg-rose-900"
  }
};

export const CONTEXT_COLOR_PRESETS: Record<string, AccentStyle> = {
  emerald: {
    normal: "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900",
    selected: "bg-emerald-600 dark:bg-emerald-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900"
  },
  teal: {
    normal: "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-100 dark:border-teal-900",
    selected: "bg-teal-600 dark:bg-teal-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-teal-100 dark:hover:bg-teal-900"
  },
  cyan: {
    normal: "bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 border border-cyan-100 dark:border-cyan-900",
    selected: "bg-cyan-600 dark:bg-cyan-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-cyan-100 dark:hover:bg-cyan-900"
  },
  orange: {
    normal: "bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900",
    selected: "bg-orange-600 dark:bg-orange-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-orange-100 dark:hover:bg-orange-900"
  },
  amber: {
    normal: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900",
    selected: "bg-amber-600 dark:bg-amber-400 text-white dark:text-slate-950 border-indigo-500",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900"
  }
};

export const DATE_COLOR_PRESETS: Record<string, AccentStyle> = {
  slate: {
    normal: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600",
    selected: "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 border-indigo-500",
    hover: "hover:bg-slate-200 dark:hover:bg-slate-650"
  },
  zinc: {
    normal: "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600",
    selected: "bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900 border-indigo-500",
    hover: "hover:bg-zinc-200 dark:hover:bg-zinc-650"
  },
  neutral: {
    normal: "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-600",
    selected: "bg-neutral-700 dark:bg-neutral-200 text-white dark:text-slate-900 border-indigo-500",
    hover: "hover:bg-neutral-200 dark:hover:bg-neutral-650"
  }
};
