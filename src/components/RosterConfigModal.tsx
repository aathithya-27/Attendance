import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { generateRollNumbers, calculateDefaultGrid } from '../services/rollNumberGenerator';

interface RosterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: {
    fromRoll: string;
    toRoll: string;
    rows: number;
    columns: number;
    date: string;
    title?: string;
  }) => void;
  currentDate: string;
  initialFrom?: string;
  initialTo?: string;
  initialRows?: number;
  initialCols?: number;
  initialTitle?: string;
}

export const RosterConfigModal: React.FC<RosterConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  currentDate,
  initialFrom = '',
  initialTo = '',
  initialRows = 4,
  initialCols = 10,
  initialTitle = '',
}) => {
  const [fromRoll, setFromRoll] = useState(initialFrom);
  const [toRoll, setToRoll] = useState(initialTo);
  const [rows, setRows] = useState<string>(String(initialRows || 4));
  const [cols, setCols] = useState<string>(String(initialCols || 10));
  const [title, setTitle] = useState(initialTitle);
  const [date, setDate] = useState(currentDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromRoll(initialFrom);
      setToRoll(initialTo);
      setRows(String(initialRows || 4));
      setCols(String(initialCols || 10));
      setTitle(initialTitle);
      setDate(currentDate);
      setErrorMsg(null);
    }
  }, [isOpen, initialFrom, initialTo, initialRows, initialCols, initialTitle, currentDate]);

  // Live calculation of roll range
  const calculation = React.useMemo(() => {
    if (!fromRoll.trim() || !toRoll.trim()) return null;
    return generateRollNumbers(fromRoll, toRoll);
  }, [fromRoll, toRoll]);

  // Auto-adjust grid rows & cols when a valid range is typed for the first time
  const handleAutoFit = () => {
    if (calculation && calculation.success && calculation.total > 0) {
      const grid = calculateDefaultGrid(calculation.total);
      setRows(String(grid.rows));
      setCols(String(grid.columns));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = generateRollNumbers(fromRoll, toRoll);
    if (!validation.success) {
      setErrorMsg(validation.errorMessage || 'Invalid roll number range.');
      return;
    }

    const parsedRows = parseInt(rows.trim(), 10);
    const parsedCols = parseInt(cols.trim(), 10);

    if (isNaN(parsedRows) || parsedRows <= 0) {
      setErrorMsg('Rows must be a positive number greater than 0.');
      return;
    }

    if (isNaN(parsedCols) || parsedCols <= 0) {
      setErrorMsg('Columns must be a positive number greater than 0.');
      return;
    }

    onGenerate({
      fromRoll: fromRoll.trim(),
      toRoll: toRoll.trim(),
      rows: parsedRows,
      columns: parsedCols,
      date,
      title: title.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-md bg-white rounded-xl p-5 sm:p-6 shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Roster Setup</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Class Title (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Class / Section (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MBA Section A"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Roll Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Roll <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fromRoll}
                onChange={(e) => setFromRoll(e.target.value)}
                placeholder="e.g. 26MBA061 or 1"
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Roll <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={toRoll}
                onChange={(e) => setToRoll(e.target.value)}
                placeholder="e.g. 26MBA100 or 60"
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Range Calculation Feedback */}
          {calculation && (
            <div
              className={`p-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                calculation.success
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span>
                {calculation.success
                  ? `Total: ${calculation.total} students (${calculation.isPureNumericSeries ? 'Numeric' : 'Alphanumeric'})`
                  : calculation.errorMessage}
              </span>
              {calculation.success && (
                <button
                  type="button"
                  onClick={handleAutoFit}
                  className="text-[11px] underline hover:no-underline font-semibold cursor-pointer text-slate-700"
                >
                  Auto-fit
                </button>
              )}
            </div>
          )}

          {/* Seating Grid (Rows & Columns with safe backspacing) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rows
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={rows}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty string on backspace or digits only
                  if (val === '' || /^\d+$/.test(val)) {
                    setRows(val);
                  }
                }}
                placeholder="e.g. 4"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Columns
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={cols}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty string on backspace or digits only
                  if (val === '' || /^\d+$/.test(val)) {
                    setCols(val);
                  }
                }}
                placeholder="e.g. 10"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Generate Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
