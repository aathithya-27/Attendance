import React, { useState, useCallback } from 'react';
import {
  Calendar,
  Layers,
  History,
  Plus,
  Pencil,
} from 'lucide-react';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceSummary } from '../components/AttendanceSummary';
import { AttendanceGrid } from '../components/AttendanceGrid';
import { SearchFilter } from '../components/SearchFilter';
import { DateSelector } from '../components/DateSelector';
import { ExportButtons } from '../components/ExportButtons';
import { RosterConfigModal } from '../components/RosterConfigModal';
import { AttendanceHistory } from '../components/AttendanceHistory';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ToastContainer, ToastMessage } from '../components/Toast';
import { exportAttendanceToExcel } from '../services/excelExport';
import { exportAttendanceGridImage } from '../services/imageExport';
import { formatDisplayDate } from '../utils/dateUtils';
import { StatusFilter } from '../types/attendance';

export const Dashboard: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    session,
    allSessions,
    isLoading,
    isSaved,
    lastSavedTime,
    stats,
    searchQuery,
    setSearchQuery,
    updateStudentStatus,
    markAllStudents,
    configureNewRoster,
    clearTodayAttendance,
    deleteSession,
  } = useAttendance();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Excel Export
  const handleExportExcel = () => {
    if (!session) return;
    try {
      exportAttendanceToExcel(session, stats);
      addToast('success', 'Excel file downloaded.');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to generate Excel file.');
    }
  };

  // Image Export: Exports strictly the attendance grid based on selected columns
  const handleExportImage = async () => {
    if (!session) return;
    setIsExportingImage(true);
    try {
      await exportAttendanceGridImage(session.students, session.columns, session.date);
      addToast('success', 'Attendance grid PNG downloaded.');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to export grid image.');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Reset confirmed
  const handleConfirmReset = async () => {
    await clearTodayAttendance();
    setIsResetConfirmOpen(false);
    addToast('info', 'Attendance reset to unmarked.');
  };

  // Delete historical session confirmed
  const handleConfirmDeleteSession = async () => {
    if (sessionToDelete) {
      const targetDate = sessionToDelete;
      setSessionToDelete(null);
      await deleteSession(targetDate);
      addToast('info', 'Attendance session deleted.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Clean, Minimal Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('board')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({allSessions.length})</span>
              </button>
            </nav>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Roster</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {activeTab === 'history' ? (
          <AttendanceHistory
            sessions={allSessions}
            activeDate={currentDate}
            onSelectDate={(date) => {
              setCurrentDate(date);
              setActiveTab('board');
            }}
            onDeleteSession={(date) => setSessionToDelete(date)}
            onClose={() => setActiveTab('board')}
          />
        ) : (
          <>
            {/* Date Bar & Auto-save Status */}
            <DateSelector
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              isSaved={isSaved}
              lastSavedAt={lastSavedTime}
            />

            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-xs text-slate-500">Loading attendance data...</p>
              </div>
            ) : !session ? (
              /* Professional Empty State when no session exists for the date */
              <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No Attendance Session for {formatDisplayDate(currentDate)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Enter your roll-number range to generate attendance for this session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Attendance</span>
                </button>
              </div>
            ) : (
              <>
                {/* Active Roster Info Strip with "Edit" Button */}
                <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {session.title && (
                      <>
                        <span className="font-bold text-slate-900">{session.title}</span>
                        <span className="text-slate-300">·</span>
                      </>
                    )}
                    <span className="font-mono text-slate-700 font-semibold">
                      {session.fromRoll} → {session.toRoll}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">
                      {session.students.length} students ({session.rows}×{session.columns})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(true)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer self-start sm:self-auto"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Summary Statistics (4 Cards, no percentage rate) */}
                <AttendanceSummary stats={stats} />

                {/* Export Actions */}
                <ExportButtons
                  onExportExcel={handleExportExcel}
                  onExportImage={handleExportImage}
                  onOpenNewClassDialog={() => setIsConfigOpen(true)}
                  isExportingImage={isExportingImage}
                  disabled={!session || session.students.length === 0}
                />

                {/* Search & Filter Controls (Single Reset Button with confirmation) */}
                <SearchFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                  counts={{
                    all: stats.total,
                    present: stats.present,
                    absent: stats.absent,
                    unmarked: stats.unmarked,
                  }}
                  onMarkAllPresent={() => {
                    markAllStudents('present');
                    addToast('success', 'Marked all Present.');
                  }}
                  onMarkAllAbsent={() => {
                    markAllStudents('absent');
                    addToast('info', 'Marked all Absent.');
                  }}
                  onResetAllUnmarked={() => {
                    setIsResetConfirmOpen(true);
                  }}
                />

                {/* Responsive Attendance Grid (Recording View) */}
                <AttendanceGrid
                  students={session.students}
                  rows={session.rows}
                  columns={session.columns}
                  onStatusChange={updateStudentStatus}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Modals & Dialogs */}
      <RosterConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onGenerate={(config) => {
          configureNewRoster(config);
          addToast('success', `Roster created (${config.fromRoll} to ${config.toRoll}).`);
        }}
        currentDate={currentDate}
        initialFrom={session?.fromRoll || ''}
        initialTo={session?.toRoll || ''}
        initialRows={session?.rows || 4}
        initialCols={session?.columns || 10}
        initialTitle={session?.title || ''}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset attendance?"
        message="All attendance markings for this session will be reset to unmarked."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Delete Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Delete attendance session?"
        message={`Are you sure you want to permanently delete the attendance session for ${
          sessionToDelete ? formatDisplayDate(sessionToDelete) : ''
        }?`}
        confirmLabel="Delete Session"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};
