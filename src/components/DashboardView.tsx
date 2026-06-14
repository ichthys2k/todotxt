import React, { useMemo, useState } from 'react';
import type { TodoTask } from '../services/todoParser';
import { Flame, BarChart3, PieChart, Star, Trophy, Plus, Minus } from 'lucide-react';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface DashboardViewProps {
  tasks: TodoTask[];
  archivedTasks: TodoTask[];
  projectPreset: string;
  contextPreset: string;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  archivedTasks,
  projectPreset,
  contextPreset,
  language,
}) => {
  // Configurable Daily Goal
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('todo_txt_daily_goal');
    return saved ? parseInt(saved, 10) : 5;
  });

  const handleGoalChange = (amount: number) => {
    const next = Math.max(1, dailyGoal + amount);
    setDailyGoal(next);
    localStorage.setItem('todo_txt_daily_goal', next.toString());
  };

  // Helper: Get Today's Date String in YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      (d.getMonth() + 1).toString().padStart(2, '0'),
      d.getDate().toString().padStart(2, '0')
    ].join('-');
  };

  const todayStr = getTodayDateStr();

  // Combine and analyze all completed tasks
  const completedTasks = useMemo(() => {
    const activeCompleted = tasks.filter(t => t.isCompleted);
    // Combine with archived tasks
    const all = [...activeCompleted, ...archivedTasks];
    return all.sort((a, b) => {
      const dateA = a.completionDate || '';
      const dateB = b.completionDate || '';
      return dateB.localeCompare(dateA); // newest first
    });
  }, [tasks, archivedTasks]);

  // Gamification Metrics
  const metrics = useMemo(() => {
    const totalCompleted = completedTasks.length;
    const activeCount = tasks.filter(t => !t.isCompleted).length;
    const totalCount = activeCount + totalCompleted;
    
    // XP and Levels
    const xpPerTask = 10;
    const xp = totalCompleted * xpPerTask;
    const xpForLevelUp = 100;
    const level = Math.floor(xp / xpForLevelUp) + 1;
    const xpInCurrentLevel = xp % xpForLevelUp;
    const xpProgressPercent = (xpInCurrentLevel / xpForLevelUp) * 100;

    // Completed Today
    const completedToday = completedTasks.filter(t => t.completionDate === todayStr).length;

    // Unique completion dates sorted ascending
    const completionDates = Array.from(
      new Set(
        completedTasks
          .map(t => t.completionDate)
          .filter((d): d is string => !!d)
      )
    ).sort();

    // Streaks calculation
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (completionDates.length > 0) {
      const datesSet = new Set(completionDates);
      
      // Check if task completed today or yesterday to continue current streak
      const today = new Date(todayStr);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayStr = [
        yesterday.getFullYear(),
        (yesterday.getMonth() + 1).toString().padStart(2, '0'),
        yesterday.getDate().toString().padStart(2, '0')
      ].join('-');

      const hasCompletedToday = datesSet.has(todayStr);
      const hasCompletedYesterday = datesSet.has(yesterdayStr);

      if (hasCompletedToday || hasCompletedYesterday) {
        let checkDate = hasCompletedToday ? today : yesterday;
        let streak = 0;
        
        while (true) {
          const checkStr = [
            checkDate.getFullYear(),
            (checkDate.getMonth() + 1).toString().padStart(2, '0'),
            checkDate.getDate().toString().padStart(2, '0')
          ].join('-');

          if (datesSet.has(checkStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        currentStreak = streak;
      }

      // Longest Streak calculation
      let maxStreak = 0;
      let tempStreak = 0;
      let lastTime: number | null = null;

      for (const dStr of completionDates) {
        const currentDateTime = new Date(dStr).getTime();
        
        if (lastTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = Math.round((currentDateTime - lastTime) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
        lastTime = currentDateTime;
      }
      longestStreak = Math.max(maxStreak, tempStreak);
    }

    return {
      totalCompleted,
      totalCount,
      activeCount,
      xp,
      level,
      xpInCurrentLevel,
      xpProgressPercent,
      completedToday,
      currentStreak,
      longestStreak,
    };
  }, [completedTasks, tasks, todayStr]);

  // Last 7 Days Activity Chart Data
  const last7DaysData = useMemo(() => {
    const result = [];
    const weekdayMaps: Record<Language, string[]> = {
      de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      la: ['Sol', 'Lun', 'Mar', 'Mer', 'Iov', 'Ven', 'Sat'],
      fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
      es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      zh: ['日', '一', '二', '三', '四', '五', '六'],
      ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
      hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
      pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      sw: ['So', 'Mo', 'Zi', 'Mi', 'Do', 'Fr', 'Sa'],
      uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чτ', 'Пт', 'Сб'],
      he: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
      el: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
      tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    };
    const weekdays = weekdayMaps[language] || weekdayMaps['de'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = [
        d.getFullYear(),
        (d.getMonth() + 1).toString().padStart(2, '0'),
        d.getDate().toString().padStart(2, '0')
      ].join('-');
      
      const count = completedTasks.filter(t => t.completionDate === dateString).length;
      result.push({
        label: weekdays[d.getDay()],
        date: dateString,
        count
      });
    }
    return result;
  }, [completedTasks]);

  const maxCompletedIn7Days = useMemo(() => {
    const counts = last7DaysData.map(d => d.count);
    return Math.max(1, ...counts);
  }, [last7DaysData]);

  // Project and Context Distribution among completed tasks
  const projectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTasks.flatMap(t => t.projects).forEach(p => {
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [completedTasks]);

  const contextDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTasks.flatMap(t => t.contexts).forEach(c => {
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [completedTasks]);

  // Color Preset Mapping Helpers
  const getProjectBgColorClass = (preset: string) => {
    const mapping: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      rose: 'bg-rose-500'
    };
    return mapping[preset] || 'bg-purple-500';
  };

  const getContextBgColorClass = (preset: string) => {
    const mapping: Record<string, string> = {
      emerald: 'bg-emerald-500',
      teal: 'bg-teal-500',
      cyan: 'bg-cyan-500',
      orange: 'bg-orange-500',
      amber: 'bg-amber-500'
    };
    return mapping[preset] || 'bg-emerald-500';
  };

  // SVG circular target ring calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const goalProgress = Math.min(1, metrics.completedToday / dailyGoal);
  const strokeDashoffset = circumference - goalProgress * circumference;

  // Active hover bar tooltip helper
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Gamification Level & Streak Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Level Up Progress Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden animate-level-up">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 dark:indigo-400/5 rounded-bl-full flex items-center justify-center pointer-events-none">
            <Trophy size={40} className="text-indigo-500/20 dark:text-indigo-400/20 rotate-12" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Star className="fill-indigo-600 dark:fill-indigo-400" size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('dbProgressTitle', language)}</h3>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{t('dbLevel', language, metrics.level)}</h4>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-end text-xs font-semibold mb-2">
                <span className="text-slate-500 dark:text-slate-400">XP: {metrics.xpInCurrentLevel} / 100</span>
                <span className="text-indigo-650 dark:text-indigo-400">{t('dbDonePercent', language, Math.round(metrics.xpProgressPercent))}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${metrics.xpProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
            {t('dbXpHint', language)}
          </p>
        </div>

        {/* Streak Flame Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('dbStreakTitle', language)}</h3>
            <span className="text-xs bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
              {t('dbDailyFocus', language)}
            </span>
          </div>
          
          <div className="flex items-center justify-center my-4 gap-4">
            <Flame 
              size={64} 
              className={`text-orange-500 fill-orange-500 ${metrics.currentStreak > 0 ? 'animate-flame' : 'opacity-20'}`} 
            />
            <div className="text-left">
              <div className="text-4xl font-black text-slate-800 dark:text-slate-50 tracking-tight">
                {metrics.currentStreak}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase">{t('dbDaysInRow', language)}</div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>{t('dbRecord', language)}</span>
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-350">
              🏆 {metrics.longestStreak} {metrics.longestStreak === 1 ? t('dbDay', language) : t('dbDays', language)}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics and Daily Target Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Daily Target Circular Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('dbDailyGoal', language)}</h3>
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-0.5">
              <button 
                onClick={() => handleGoalChange(-1)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                title={t('dbReduceGoal', language)}
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-extrabold px-1.5 min-w-5">{dailyGoal}</span>
              <button 
                onClick={() => handleGoalChange(1)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                title={t('dbIncreaseGoal', language)}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-indigo-500 dark:stroke-indigo-400 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {metrics.completedToday}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t('dbDone', language)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
            {goalProgress >= 1 
              ? t('dbGoalReached', language) 
              : t('dbGoalRemaining', language, Math.max(0, dailyGoal - metrics.completedToday))}
          </p>
        </div>

        {/* Weekly Productivity SVG Säulen-Diagramm */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={16} className="text-indigo-500" /> {t('dbLast7Days', language)}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{t('dbTasksPerDay', language)}</span>
          </div>

          {/* SVG Custom Column Chart */}
          <div className="relative h-44 w-full flex items-end justify-between pt-6 px-2">
            
            {/* Grid Lines */}
            <div className="absolute inset-x-0 bottom-0 top-6 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-full border-t border-slate-100 dark:border-slate-800/80"></div>
              <div className="w-full border-t border-slate-100 dark:border-slate-800/80"></div>
              <div className="w-full border-t border-slate-100 dark:border-slate-800/80"></div>
              <div className="w-full border-t border-slate-150 dark:border-slate-800"></div>
            </div>

            {last7DaysData.map((data, index) => {
              const heightPercent = (data.count / maxCompletedIn7Days) * 100;
              const isHovered = hoveredBarIndex === index;

              return (
                <div 
                  key={data.date} 
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(index)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip */}
                  <div className={`absolute -top-7 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded shadow-md pointer-events-none transition-all ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}>
                    {data.count} {data.count === 1 ? t('dbTask', language) : t('dbTasks', language)}
                  </div>

                  {/* SVG Rounded Bar */}
                  <div className="w-8 sm:w-10 h-32 flex items-end justify-center">
                    <div 
                      className={`w-4 sm:w-5 bg-gradient-to-t from-indigo-500 to-cyan-400 dark:from-indigo-600 dark:to-cyan-500 rounded-t-md transition-all duration-700 ease-out origin-bottom ${
                        isHovered ? 'filter brightness-110 shadow-sm' : ''
                      }`}
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2 block uppercase">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project and Context Distribution lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Projects */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <PieChart size={16} className="text-indigo-500" /> {t('dbTopProjects', language)}
          </h3>
          
          {projectDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">{t('dbNoProjects', language)}</p>
          ) : (
            <div className="space-y-4">
              {projectDistribution.map(item => {
                const totalProjTasks = completedTasks.filter(t => t.projects.includes(item.name)).length;
                const percent = (totalProjTasks / metrics.totalCompleted) * 100;
                
                return (
                  <div key={item.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">+{item.name}</span>
                      <span className="text-slate-500">{item.count} {t('dbCompleted', language)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProjectBgColorClass(projectPreset)} rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Contexts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <PieChart size={16} className="text-indigo-500" /> {t('dbTopContexts', language)}
          </h3>
          
          {contextDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">{t('dbNoContexts', language)}</p>
          ) : (
            <div className="space-y-4">
              {contextDistribution.map(item => {
                const totalCtxTasks = completedTasks.filter(t => t.contexts.includes(item.name)).length;
                const percent = (totalCtxTasks / metrics.totalCompleted) * 100;

                return (
                  <div key={item.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">@{item.name}</span>
                      <span className="text-slate-500">{item.count} {t('dbCompleted', language)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getContextBgColorClass(contextPreset)} rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
