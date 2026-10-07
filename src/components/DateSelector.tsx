import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatDisplayDate, shiftDateDays, getTodayISO } from '../utils/dateUtils';

interface DateSelectorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  isSaved: boolean;
  lastSavedAt?: string | null;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  currentDate,
  onDateChange,
  isSaved,
  lastSavedAt,
}) => {
  const todayIso = getTodayISO();
  const isToday = currentDate === todayIso;

  const handlePrevDay = () => {
    onDateChange(shiftDateDays(currentDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(shiftDateDays(currentDate, 1));
  };

  const handleSetToday = () => {
    onDateChange(todayIso);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-slate-200 rounded-lg px-3.5 py-2">
      {/* Date Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 text-slate-600 hover:text-slate-900 rounded transition cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 text-slate-600 hover:text-slate-900 rounded transition cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Display */}
        <label className="relative inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span>{formatDisplayDate(currentDate)}</span>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        {!isToday && (
          <button
            type="button"
            onClick={handleSetToday}
            className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            Today
          </button>
        )}
      </div>

      {/* Auto-save Status */}
      <div className="text-xs text-slate-500 flex items-center gap-1.5">
        {isSaved ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
            {lastSavedAt && <span className="text-slate-400 font-mono text-[11px]">({lastSavedAt})</span>}
          </span>
        ) : (
          <span className="text-amber-600 font-medium">Saving...</span>
        )}
      </div>
    </div>
  );
};
