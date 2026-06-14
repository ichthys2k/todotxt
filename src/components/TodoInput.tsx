import { useState, useRef, useEffect, useMemo } from 'react';
import { parseNaturalLanguage } from '../services/nlpParser';
import { t } from '../services/translationService';
import type { Language } from '../services/translationService';

interface TodoInputProps {
  value: string;
  onChange: (val: string) => void;
  onAdd: (text: string) => void;
  knownProjects: string[];
  knownContexts: string[];
  knownAssignees: string[];
  language: Language;
}

export const TodoInput = ({ value, onChange, onAdd, knownProjects, knownContexts, knownAssignees, language }: TodoInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'project' | 'context' | 'who' | 'due' | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'due' | 'threshold' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerInputRef = useRef<HTMLInputElement>(null);

  // Reset selected suggestion index when suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [suggestionType, suggestionQuery]);

  useEffect(() => {
    const lastWord = value.split(/\s+/).pop() || '';
    if (lastWord.startsWith('+') && lastWord.length >= 1) {
      setSuggestionType('project');
      setSuggestionQuery(lastWord.substring(1).toLowerCase());
      setShowSuggestions(true);
    } else if (lastWord.startsWith('@') && lastWord.length >= 1) {
      setSuggestionType('context');
      setSuggestionQuery(lastWord.substring(1).toLowerCase());
      setShowSuggestions(true);
    } else if (lastWord.startsWith('who:') && lastWord.length >= 4) {
      setSuggestionType('who');
      setSuggestionQuery(lastWord.substring(4).toLowerCase());
      setShowSuggestions(true);
    } else if (lastWord.startsWith('due:') && lastWord.length >= 4) {
      setSuggestionType('due');
      setSuggestionQuery(lastWord.substring(4).toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  const parsed = parseNaturalLanguage(value);
  const whoMatch = value.match(/\bwho:(\S+)/);
  const parsedAssignee = whoMatch ? whoMatch[1] : null;
  const thresholdMatch = value.match(/\bt:(\S+)/);
  const parsedThreshold = thresholdMatch ? thresholdMatch[1] : null;

  // Helper dates for autocomplete suggestions
  const today = new Date();
  const formatTodayDate = (date: Date) => {
    return [date.getFullYear(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0')].join('-');
  };
  const getWeekdayDate = (dayIndex: number) => {
    const result = new Date();
    const currentDay = result.getDay();
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
  };
  
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  // Saturday for weekend suggestion
  const sat = new Date();
  const currentDayOfWeek = sat.getDay();
  let satDays = 6 - currentDayOfWeek;
  if (satDays <= 0) satDays += 7;
  sat.setDate(sat.getDate() + satDays);

  const dueOptions = useMemo(() => {
    const today = new Date();
    const formatTodayDate = (date: Date) => {
      return [date.getFullYear(), (date.getMonth() + 1).toString().padStart(2, '0'), date.getDate().toString().padStart(2, '0')].join('-');
    };
    const getWeekdayDate = (dayIndex: number) => {
      const result = new Date();
      const currentDay = result.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      result.setDate(result.getDate() + daysToAdd);
      return result;
    };
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const sat = new Date();
    const currentDayOfWeek = sat.getDay();
    let satDays = 6 - currentDayOfWeek;
    if (satDays <= 0) satDays += 7;
    sat.setDate(sat.getDate() + satDays);

    return [
      { label: t('inputDateToday', language).toLowerCase(), value: formatTodayDate(today), display: `${t('inputDateToday', language)} (${formatTodayDate(today)})` },
      { label: t('inputDateTomorrow', language).toLowerCase(), value: formatTodayDate(tomorrow), display: `${t('inputDateTomorrow', language)} (${formatTodayDate(tomorrow)})` },
      { label: t('inputDateNextWeek', language).toLowerCase(), value: formatTodayDate(nextWeek), display: `${t('inputDateNextWeek', language)} (${formatTodayDate(nextWeek)})` },
      { label: t('inputDateWeekend', language).toLowerCase(), value: formatTodayDate(sat), display: `${t('inputDateWeekend', language)} (${formatTodayDate(sat)})` },
      { label: t('inputDateMonday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(1)), display: `${t('inputDateMonday', language)} (${formatTodayDate(getWeekdayDate(1))})` },
      { label: t('inputDateTuesday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(2)), display: `${t('inputDateTuesday', language)} (${formatTodayDate(getWeekdayDate(2))})` },
      { label: t('inputDateWednesday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(3)), display: `${t('inputDateWednesday', language)} (${formatTodayDate(getWeekdayDate(3))})` },
      { label: t('inputDateThursday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(4)), display: `${t('inputDateThursday', language)} (${formatTodayDate(getWeekdayDate(4))})` },
      { label: t('inputDateFriday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(5)), display: `${t('inputDateFriday', language)} (${formatTodayDate(getWeekdayDate(5))})` },
      { label: t('inputDateSaturday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(6)), display: `${t('inputDateSaturday', language)} (${formatTodayDate(getWeekdayDate(6))})` },
      { label: t('inputDateSunday', language).toLowerCase(), value: formatTodayDate(getWeekdayDate(0)), display: `${t('inputDateSunday', language)} (${formatTodayDate(getWeekdayDate(0))})` },
      { label: t('chooseDate', language).toLowerCase(), value: 'picker', display: `📅 ${t('chooseDate', language)}` }
    ];
  }, [language]);

  const suggestionsList = useMemo(() => {
    if (suggestionType === 'project') {
      return knownProjects
        .filter(p => p.toLowerCase().includes(suggestionQuery))
        .map(p => ({ label: p, display: `+${p}`, insertText: `+${p} ` }));
    }
    if (suggestionType === 'context') {
      return knownContexts
        .filter(c => c.toLowerCase().includes(suggestionQuery))
        .map(c => ({ label: c, display: `@${c}`, insertText: `@${c} ` }));
    }
    if (suggestionType === 'who') {
      return knownAssignees
        .filter(a => a.toLowerCase().includes(suggestionQuery))
        .map(a => ({ label: a, display: `who:${a}`, insertText: `who:${a} ` }));
    }
    if (suggestionType === 'due') {
      return dueOptions
        .filter(o => o.label.toLowerCase().includes(suggestionQuery))
        .map(o => ({
          label: o.label,
          display: o.display,
          insertText: o.value === 'picker' ? 'picker' : `due:${o.value} `
        }));
    }
    return [];
  }, [suggestionType, suggestionQuery, knownProjects, knownContexts, knownAssignees, dueOptions]);

  const appendText = (textToAppend: string) => {
    const currentVal = value;
    const space = currentVal.endsWith(' ') || currentVal === '' ? '' : ' ';
    onChange(currentVal + space + textToAppend);
    inputRef.current?.focus();
  };

  const setPriority = (prio: string) => {
    const currentVal = value.trim();
    const prioRegex = /^\([A-Z]\)\s*/;
    if (prioRegex.test(currentVal)) {
      onChange(`(${prio}) ${currentVal.replace(prioRegex, '')}`);
    } else {
      onChange(`(${prio}) ${currentVal}`);
    }
    inputRef.current?.focus();
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim()) return;
    
    // Parse den Text mit NLP
    const nlp = parseNaturalLanguage(value);
    
    // Formatiere den Standard todo.txt String
    let formattedText = nlp.cleanText;
    if (nlp.priority) {
      formattedText = `(${nlp.priority}) ${formattedText}`;
    }
    if (nlp.dueDate) {
      formattedText = `${formattedText} due:${nlp.dueDate}`;
    }

    onAdd(formattedText);
    onChange('');
    setShowSuggestions(false);
  };

  const insertSuggestion = (insertText: string) => {
    if (insertText === 'picker') {
      setShowSuggestions(false);
      setPickerTarget('due');
      pickerInputRef.current?.showPicker();
      return;
    }
    const words = value.split(/\s+/);
    words.pop();
    const newText = [...words, insertText].join(' ');
    onChange(newText);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestionsList.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestionsList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestionsList.length) % suggestionsList.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestionsList[activeSuggestionIndex].insertText);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className="relative">
      {/* Mobile Keyboard Accessory Bar */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar border-b border-slate-100 dark:border-slate-800/80 mb-2">
        <button
          type="button"
          onClick={() => setPriority('A')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-red-655 dark:text-red-400 rounded-lg cursor-pointer transition-colors"
        >
          (A)
        </button>
        <button
          type="button"
          onClick={() => setPriority('B')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-orange-655 dark:text-orange-400 rounded-lg cursor-pointer transition-colors"
        >
          (B)
        </button>
        <button
          type="button"
          onClick={() => setPriority('C')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-yellow-600 dark:text-yellow-500 rounded-lg cursor-pointer transition-colors"
        >
          (C)
        </button>
        <button
          type="button"
          onClick={() => appendText('+')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/20 rounded-lg cursor-pointer transition-colors"
        >
          + {t('projectsHelper', language).replace(/📁\s*/, '')}
        </button>
        <button
          type="button"
          onClick={() => appendText('@')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/20 rounded-lg cursor-pointer transition-colors"
        >
          @ {t('contextsHelper', language).replace(/🏷️\s*/, '')}
        </button>
        <button
          type="button"
          onClick={() => {
            setPickerTarget('due');
            pickerInputRef.current?.showPicker();
          }}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/20 rounded-lg cursor-pointer transition-colors"
        >
          📅 {t('dueHelper', language).replace(/📅\s*/, '')}
        </button>
        <button
          type="button"
          onClick={() => {
            setPickerTarget('threshold');
            pickerInputRef.current?.showPicker();
          }}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border border-amber-100/50 dark:border-amber-900 rounded-lg cursor-pointer transition-colors"
        >
          ⏳ {t('startHelper', language).replace(/⏳\s*/, '')}
        </button>
        <button
          type="button"
          onClick={() => appendText('who:')}
          className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
        >
          👤 {t('groupAssignee', language)}
        </button>
      </div>

      <form onSubmit={handleAdd} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
            }, 250);
          }}
          placeholder={t('inputPlaceholder', language)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
        />
      </form>

      {/* Live Preview Badges */}
      {value.trim() && (parsed.priority || parsed.dueDate || parsedAssignee || parsedThreshold) && (
        <div className="flex items-center gap-2 mt-2 px-1 text-xs select-none">
          <span className="text-slate-400 dark:text-slate-500 font-medium">{t('detectedLabel', language)}</span>
          {parsed.priority && (
            <span className="flex items-center gap-1 bg-red-50 dark:bg-red-950/45 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded font-semibold text-[10px]">
              {t('sortPriority', language)}: {parsed.priority}
            </span>
          )}
          {parsed.dueDate && (
            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2 py-0.5 rounded font-semibold text-[10px]">
              📅 {parsed.dueDate}
            </span>
          )}
          {parsedThreshold && (
            <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded font-semibold text-[10px]">
              ⏳ {t('startHelper', language).replace(/⏳\s*/, '')}: {parsedThreshold}
            </span>
          )}
          {parsedAssignee && (
            <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-0.5 rounded font-semibold text-[10px]">
              👤 {parsedAssignee}
            </span>
          )}
        </div>
      )}

      {/* Hidden Date Picker for Autocomplete */}
      <input
        ref={pickerInputRef}
        type="date"
        onChange={(e) => {
          if (e.target.value) {
            const dateStr = e.target.value;
            if (pickerTarget === 'due') {
              appendText(`due:${dateStr}`);
            } else if (pickerTarget === 'threshold') {
              appendText(`t:${dateStr}`);
            } else {
              const words = value.split(/\s+/);
              words.pop();
              const newText = [...words, `due:${dateStr} `].join(' ');
              onChange(newText);
            }
            setPickerTarget(null);
            inputRef.current?.focus();
          }
        }}
        className="sr-only absolute pointer-events-none"
      />

      {/* Helper Panel */}
      {isFocused && value.trim() && !showSuggestions && (
        <div 
          onMouseDown={(e) => e.preventDefault()}
          className="mt-3.5 w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs select-none"
        >
          {/* Priorität */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block">{t('priorityHelper', language)}</span>
            <div className="flex gap-1.5 flex-wrap">
              {['A', 'B', 'C', 'D'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 font-bold transition-colors cursor-pointer"
                >
                  ({p})
                </button>
              ))}
            </div>
          </div>

          {/* Projekte */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block">{t('projectsHelper', language)}</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
              {knownProjects.length > 0 ? (
                knownProjects.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => appendText(`+${p}`)}
                    className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-colors text-[10px] cursor-pointer"
                  >
                    +{p}
                  </button>
                ))
              ) : (
                <span className="text-slate-400 dark:text-slate-550 italic text-[10px]">{t('none', language)}</span>
              )}
            </div>
          </div>

          {/* Kontexte */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block">{t('contextsHelper', language)}</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
              {knownContexts.length > 0 ? (
                knownContexts.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => appendText(`@${c}`)}
                    className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 transition-colors text-[10px] cursor-pointer"
                  >
                    @{c}
                  </button>
                ))
              ) : (
                <span className="text-slate-400 dark:text-slate-550 italic text-[10px]">{t('none', language)}</span>
              )}
            </div>
          </div>

          {/* Fälligkeit */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block">{t('dueHelper', language)}</span>
            <div className="flex flex-col gap-1 items-start text-[11px]">
              <button
                type="button"
                onClick={() => appendText(`due:${formatTodayDate(today)}`)}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {t('inputDateToday', language)} ({formatTodayDate(today)})
              </button>
              <button
                type="button"
                onClick={() => appendText(`due:${formatTodayDate(tomorrow)}`)}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {t('inputDateTomorrow', language)} ({formatTodayDate(tomorrow)})
              </button>
              <button
                type="button"
                onClick={() => appendText(`due:${formatTodayDate(getWeekdayDate(5))}`)}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {t('inputDateFriday', language)} ({formatTodayDate(getWeekdayDate(5))})
              </button>
              <button
                type="button"
                onClick={() => appendText(`due:${formatTodayDate(getWeekdayDate(1))}`)}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {t('inputDateMonday', language)} ({formatTodayDate(getWeekdayDate(1))})
              </button>
              <button
                type="button"
                onClick={() => appendText(`due:${formatTodayDate(nextWeek)}`)}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {t('inputDateNextWeek', language)} ({formatTodayDate(nextWeek)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickerTarget('due');
                  pickerInputRef.current?.showPicker();
                }}
                className="text-left hover:underline text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer mt-1"
              >
                📅 {t('chooseDate', language)}
              </button>
            </div>
          </div>

          {/* Schwellenwert */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block">{t('startHelper', language)}</span>
            <div className="flex flex-col gap-1 items-start text-[11px]">
              <button
                type="button"
                onClick={() => appendText(`t:${formatTodayDate(today)}`)}
                className="text-left hover:underline text-amber-605 dark:text-amber-400 cursor-pointer"
              >
                {t('inputDateToday', language)} ({formatTodayDate(today)})
              </button>
              <button
                type="button"
                onClick={() => appendText(`t:${formatTodayDate(tomorrow)}`)}
                className="text-left hover:underline text-amber-605 dark:text-amber-400 cursor-pointer"
              >
                {t('inputDateTomorrow', language)} ({formatTodayDate(tomorrow)})
              </button>
              <button
                type="button"
                onClick={() => appendText(`t:${formatTodayDate(getWeekdayDate(5))}`)}
                className="text-left hover:underline text-amber-605 dark:text-amber-400 cursor-pointer"
              >
                {t('inputDateFriday', language)} ({formatTodayDate(getWeekdayDate(5))})
              </button>
              <button
                type="button"
                onClick={() => appendText(`t:${formatTodayDate(getWeekdayDate(1))}`)}
                className="text-left hover:underline text-amber-605 dark:text-amber-400 cursor-pointer"
              >
                {t('inputDateMonday', language)} ({formatTodayDate(getWeekdayDate(1))})
              </button>
              <button
                type="button"
                onClick={() => appendText(`t:${formatTodayDate(nextWeek)}`)}
                className="text-left hover:underline text-amber-605 dark:text-amber-400 cursor-pointer"
              >
                {t('inputDateNextWeek', language)} ({formatTodayDate(nextWeek)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickerTarget('threshold');
                  pickerInputRef.current?.showPicker();
                }}
                className="text-left hover:underline text-amber-655 dark:text-amber-400 font-semibold cursor-pointer mt-1"
              >
                ⏳ {t('chooseDate', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestionsList.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <ul className="max-h-48 overflow-y-auto">
            {suggestionsList.map((suggestion, idx) => (
              <li key={suggestion.label}>
                <button
                  type="button"
                  onClick={() => insertSuggestion(suggestion.insertText)}
                  className={`w-full text-left px-4 py-2 text-sm focus:outline-none cursor-pointer transition-colors ${
                    idx === activeSuggestionIndex
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-semibold'
                      : 'text-slate-755 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {suggestion.display}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
