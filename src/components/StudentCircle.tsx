import React, { useRef, useEffect } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { AttendanceStatus } from '../types/attendance';

interface StudentCircleProps {
  rollNumber: string;
  status: AttendanceStatus;
  isPureNumber: boolean;
  onStatusChange: (newStatus: AttendanceStatus) => void;
  isHighlighted?: boolean;
}

export const StudentCircle: React.FC<StudentCircleProps> = ({
  rollNumber,
  status,
  isPureNumber: isPureNum,
  onStatusChange,
  isHighlighted = false,
}) => {
  const clickTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Reliable Single Tap (Present) vs Double Tap (Absent) detector
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Avoid double-firing on touch + synthetic click
    if (e.type === 'touchend') {
      e.preventDefault();
    }

    if (clickTimeoutRef.current !== null) {
      // Double tap confirmed within window!
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onStatusChange('absent');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    } else {
      // First tap: delay by 230ms to wait for potential second tap
      clickTimeoutRef.current = window.setTimeout(() => {
        clickTimeoutRef.current = null;
        onStatusChange('present');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
      }, 230);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      onStatusChange('present');
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      onStatusChange('absent');
    } else if (e.key === 'u' || e.key === 'U' || e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onStatusChange('unmarked');
    }
  };

  // Context menu (right click) resets to unmarked for rapid correction
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onStatusChange('unmarked');
  };

  // Color styles based on status
  let circleStyles = '';
  let statusBadge = null;

  if (status === 'present') {
    circleStyles =
      'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/30';
    statusBadge = (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 tabular-nums">
        <Check className="w-3 h-3 stroke-[3]" /> PRESENT
      </span>
    );
  } else if (status === 'absent') {
    circleStyles =
      'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20 ring-2 ring-rose-400/30';
    statusBadge = (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-700 tabular-nums">
        <X className="w-3 h-3 stroke-[3]" /> ABSENT
      </span>
    );
  } else {
    // Unmarked
    circleStyles =
      'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-sm';
    statusBadge = (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400 tabular-nums">
        <Minus className="w-2.5 h-2.5 stroke-[2]" /> UNMARKED
      </span>
    );
  }

  const highlightRing = isHighlighted ? 'ring-4 ring-indigo-500 ring-offset-2' : '';

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 no-select ${
        isHighlighted ? 'bg-indigo-50/70 border border-indigo-200' : 'bg-transparent'
      }`}
    >
      {/* Touch & Click Button */}
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        aria-label={`Student roll number ${rollNumber}, status ${status}. Single tap for present, double tap for absent.`}
        className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-150 cursor-pointer active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${circleStyles} ${highlightRing} ${
          isPureNum
            ? 'w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl font-bold'
            : 'w-12 h-12 sm:w-14 sm:h-14'
        }`}
      >
        {isPureNum ? (
          /* MODE A: Pure numbers - displayed large and centered inside the circle */
          <span className="font-mono tabular-nums tracking-tight select-none">
            {rollNumber}
          </span>
        ) : (
          /* MODE B: Alphanumeric - circle acts as clear status icon indicator */
          <span className="select-none flex items-center justify-center">
            {status === 'present' ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : status === 'absent' ? (
              <X className="w-6 h-6 stroke-[3]" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
            )}
          </span>
        )}
      </button>

      {/* Outside Labels */}
      {!isPureNum && (
        <span
          className="mt-1.5 font-mono text-xs sm:text-sm font-semibold text-slate-800 tracking-tight text-center max-w-full break-all select-none px-1"
          title={rollNumber}
        >
          {rollNumber}
        </span>
      )}

      {/* Visual Accessible Status Indicator (Not relying only on color) */}
      <div className="mt-1 select-none flex items-center justify-center">
        {statusBadge}
      </div>
    </div>
  );
};
