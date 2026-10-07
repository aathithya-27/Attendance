import React, { useState } from 'react';
import { LayoutGrid, Smartphone } from 'lucide-react';
import { StudentAttendance, AttendanceStatus, StatusFilter } from '../types/attendance';
import { StudentCircle } from './StudentCircle';
import { isPureNumber } from '../services/rollNumberGenerator';

interface AttendanceGridProps {
  students: StudentAttendance[];
  rows: number;
  columns: number;
  onStatusChange: (rollNumber: string, newStatus: AttendanceStatus) => void;
  searchQuery: string;
  statusFilter: StatusFilter;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  students,
  columns,
  onStatusChange,
  searchQuery,
  statusFilter,
}) => {
  const [viewMode, setViewMode] = useState<'classroom' | 'fit'>('classroom');

  const query = searchQuery.trim().toLowerCase();
  const isPureSeries = students.length > 0 && isPureNumber(students[0].rollNumber);

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesQuery = !query || student.rollNumber.toLowerCase().includes(query);
    const matchesFilter =
      statusFilter === 'all' || student.status === statusFilter;
    return matchesQuery && matchesFilter;
  });

  if (students.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <p className="text-slate-500 text-xs">No students in this roster.</p>
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <p className="text-slate-700 font-semibold text-xs">No matching students found</p>
        <p className="text-slate-400 text-xs mt-1">
          Try clearing your search query or choosing another filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-5 space-y-3">
      {/* Grid Layout Toggle Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100" data-export-ignore="true">
        <span className="text-xs font-semibold text-slate-700">
          {viewMode === 'classroom'
            ? `Seating Layout (${columns} Columns)`
            : 'Fit Screen (Responsive Flow)'}
        </span>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'classroom' ? 'fit' : 'classroom')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
          title="Toggle between fixed classroom seating grid and mobile screen-fit flow"
        >
          {viewMode === 'classroom' ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
              <span>Switch to Fit Screen</span>
            </>
          ) : (
            <>
              <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
              <span>Switch to Seating Grid ({columns} Cols)</span>
            </>
          )}
        </button>
      </div>

      {/* Grid Display */}
      {viewMode === 'classroom' ? (
        /* Classroom Seating Grid (exact columns, smooth scroll if viewport narrower than grid) */
        <div className="overflow-x-auto pb-1">
          <div
            className="attendance-grid-container grid gap-2 sm:gap-3 min-w-max"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(${isPureSeries ? '64px' : '76px'}, 1fr))`,
            }}
          >
            {filteredStudents.map((student) => {
              const isMatch = !!query && student.rollNumber.toLowerCase().includes(query);
              const isPure = isPureNumber(student.rollNumber);

              return (
                <StudentCircle
                  key={student.rollNumber}
                  rollNumber={student.rollNumber}
                  status={student.status}
                  isPureNumber={isPure}
                  isHighlighted={isMatch}
                  onStatusChange={(newStatus) => onStatusChange(student.rollNumber, newStatus)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Fit Screen Flow (auto wraps to fit phone/tablet screen without horizontal scrolling) */
        <div
          className="attendance-grid-container grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${isPureSeries ? '58px' : '72px'}, 1fr))`,
          }}
        >
          {filteredStudents.map((student) => {
            const isMatch = !!query && student.rollNumber.toLowerCase().includes(query);
            const isPure = isPureNumber(student.rollNumber);

            return (
              <StudentCircle
                key={student.rollNumber}
                rollNumber={student.rollNumber}
                status={student.status}
                isPureNumber={isPure}
                isHighlighted={isMatch}
                onStatusChange={(newStatus) => onStatusChange(student.rollNumber, newStatus)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
