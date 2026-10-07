import React from 'react';
import { Trash2, ArrowUpRight } from 'lucide-react';
import { AttendanceSession } from '../types/attendance';
import { formatTimelineDate, formatMonthGroup } from '../utils/dateUtils';

interface AttendanceHistoryProps {
  sessions: AttendanceSession[];
  activeDate: string;
  onSelectDate: (date: string) => void;
  onDeleteSession: (date: string) => void;
  onClose?: () => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  sessions,
  activeDate,
  onSelectDate,
  onDeleteSession,
  onClose,
}) => {
  const groupedSessions = React.useMemo(() => {
    const groups: { [month: string]: AttendanceSession[] } = {};
    for (const session of sessions) {
      const month = formatMonthGroup(session.date);
      if (!groups[month]) groups[month] = [];
      groups[month].push(session);
    }
    return groups;
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <p className="text-sm font-semibold text-slate-800">No attendance sessions saved</p>
        <p className="text-xs text-slate-500 mt-1">
          When you mark and save attendance, previous sessions will be listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h3 className="text-sm font-bold text-slate-900">Attendance History</h3>
        <span className="text-xs text-slate-500">
          {sessions.length} recorded {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      <div className="space-y-5 max-h-[550px] overflow-y-auto">
        {Object.entries(groupedSessions).map(([month, monthSessions]) => (
          <div key={month} className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {month}
            </h4>

            <div className="space-y-1.5">
              {monthSessions.map((session) => {
                const isActive = session.date === activeDate;
                const total = session.students.length;
                const presentCount = session.students.filter((s) => s.status === 'present').length;
                const absentCount = session.students.filter((s) => s.status === 'absent').length;
                const percentage =
                  total > 0 ? Math.round((presentCount / total) * 1000) / 10 : 0;

                return (
                  <div
                    key={session.date}
                    className={`flex items-center justify-between p-3 rounded-lg border transition ${
                      isActive
                        ? 'bg-slate-50 border-slate-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        onSelectDate(session.date);
                        onClose?.();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatTimelineDate(session.date)}
                        </span>
                        {session.title && (
                          <span className="text-xs text-slate-500 font-normal">
                            · {session.title}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500 font-medium space-x-2">
                        <span>{total} Total</span>
                        <span>·</span>
                        <span className="text-emerald-700">{presentCount} Present</span>
                        <span>·</span>
                        <span className="text-rose-700">{absentCount} Absent</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(session.date);
                          onClose?.();
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Load this session"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteSession(session.date);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
