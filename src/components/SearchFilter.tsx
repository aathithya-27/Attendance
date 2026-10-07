import React from 'react';
import { Search, X } from 'lucide-react';
import { StatusFilter } from '../types/attendance';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: {
    all: number;
    present: number;
    absent: number;
    unmarked: number;
  };
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  onResetAllUnmarked: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  counts,
  onMarkAllPresent,
  onMarkAllAbsent,
  onResetAllUnmarked,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5" data-export-ignore="true">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roll number..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onMarkAllPresent}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition cursor-pointer"
          >
            All Present
          </button>
          <button
            type="button"
            onClick={onMarkAllAbsent}
            className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition cursor-pointer"
          >
            All Absent
          </button>
          <button
            type="button"
            onClick={onResetAllUnmarked}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('present')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
              statusFilter === 'present'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Present ({counts.present})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('absent')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Absent ({counts.absent})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('unmarked')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer ${
              statusFilter === 'unmarked'
                ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unmarked ({counts.unmarked})
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Single tap: Present · Double tap: Absent
        </div>
      </div>
    </div>
  );
};
