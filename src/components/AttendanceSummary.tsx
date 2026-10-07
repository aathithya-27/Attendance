import React from 'react';
import { AttendanceStats } from '../types/attendance';

interface AttendanceSummaryProps {
  stats: AttendanceStats;
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ stats }) => {
  return (
    <div className="w-full space-y-2.5">
      {/* 4 Metric Cards (Attendance Rate removed) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Students */}
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {stats.total}
          </p>
        </div>

        {/* Present */}
        <div className="bg-white border border-emerald-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Present
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {stats.present}
          </p>
        </div>

        {/* Absent */}
        <div className="bg-white border border-rose-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Absent
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-0.5">
            {stats.absent}
          </p>
        </div>

        {/* Unmarked */}
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Unmarked
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-600 mt-0.5">
            {stats.unmarked}
          </p>
        </div>
      </div>

      {/* Progress Bar (no percentage) */}
      {stats.total > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-medium">
            <span>Marked: {stats.present + stats.absent} of {stats.total} students</span>
            <span className="font-mono text-slate-500">{stats.present} Present · {stats.absent} Absent</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 transition-all duration-200"
              style={{ width: `${(stats.present / stats.total) * 100}%` }}
              title={`Present: ${stats.present}`}
            />
            <div
              className="bg-rose-600 transition-all duration-200"
              style={{ width: `${(stats.absent / stats.total) * 100}%` }}
              title={`Absent: ${stats.absent}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
