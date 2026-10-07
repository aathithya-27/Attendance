import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AttendanceSession,
  AttendanceStats,
  AttendanceStatus,
  StudentAttendance,
} from '../types/attendance';
import { attendanceStorage } from '../services/attendanceStorage';
import { generateRollNumbers } from '../services/rollNumberGenerator';
import { getTodayISO } from '../utils/dateUtils';

export function useAttendance() {
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayISO());
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [allSessions, setAllSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const saveTimeoutRef = useRef<number | null>(null);

  // Load all sessions for history
  const refreshAllSessions = useCallback(async () => {
    try {
      const sessions = await attendanceStorage.getAllAttendance();
      setAllSessions(sessions);
      return sessions;
    } catch (err) {
      console.error('Failed to load session list:', err);
      return [];
    }
  }, []);

  // Load session when date changes (WITHOUT creating mock data if absent)
  const loadDateSession = useCallback(
    async (targetDate: string) => {
      setIsLoading(true);
      try {
        const existing = await attendanceStorage.getAttendanceByDate(targetDate);
        if (existing) {
          setSession(existing);
          setIsSaved(true);
          setLastSavedTime(
            new Date(existing.updatedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        } else {
          // No saved attendance for this date: don't create mock data, leave it empty
          setSession(null);
          setIsSaved(true);
          setLastSavedTime(null);
        }
      } catch (err) {
        console.error('Error loading attendance session:', err);
        setSession(null);
      } finally {
        setIsLoading(false);
        refreshAllSessions();
      }
    },
    [refreshAllSessions]
  );

  useEffect(() => {
    loadDateSession(currentDate);
  }, [currentDate, loadDateSession]);

  // Debounced auto-save when student statuses change
  const triggerAutoSave = useCallback(
    (updated: AttendanceSession) => {
      setIsSaved(false);
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          await attendanceStorage.saveAttendance(updated);
          setIsSaved(true);
          setLastSavedTime(
            new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );
          refreshAllSessions();
        } catch (err) {
          console.error('Auto-save error:', err);
        }
      }, 300);
    },
    [refreshAllSessions]
  );

  // Update a single student status
  const updateStudentStatus = useCallback(
    (rollNumber: string, newStatus: AttendanceStatus) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updatedStudents = prev.students.map((student) => {
          if (student.rollNumber === rollNumber) {
            return {
              ...student,
              status: newStatus,
              updatedAt: Date.now(),
            };
          }
          return student;
        });

        const updatedSession = {
          ...prev,
          students: updatedStudents,
          updatedAt: new Date().toISOString(),
        };

        triggerAutoSave(updatedSession);
        return updatedSession;
      });
    },
    [triggerAutoSave]
  );

  // Bulk update
  const markAllStudents = useCallback(
    (targetStatus: AttendanceStatus) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updatedStudents = prev.students.map((student) => ({
          ...student,
          status: targetStatus,
          updatedAt: Date.now(),
        }));

        const updatedSession = {
          ...prev,
          students: updatedStudents,
          updatedAt: new Date().toISOString(),
        };

        triggerAutoSave(updatedSession);
        return updatedSession;
      });
    },
    [triggerAutoSave]
  );

  // Generate / Configure roster for a date
  const configureNewRoster = useCallback(
    async (config: {
      fromRoll: string;
      toRoll: string;
      rows: number;
      columns: number;
      date: string;
      title?: string;
    }) => {
      const gen = generateRollNumbers(config.fromRoll, config.toRoll);
      if (!gen.success) return;

      const newStudents: StudentAttendance[] = gen.rollNumbers.map((rn) => ({
        rollNumber: rn,
        status: 'unmarked',
      }));

      const newSession: AttendanceSession = {
        id: `session-${config.date}`,
        date: config.date,
        fromRoll: config.fromRoll.trim(),
        toRoll: config.toRoll.trim(),
        rows: config.rows,
        columns: config.columns,
        students: newStudents,
        title: config.title?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSession(newSession);
      setCurrentDate(config.date);
      await attendanceStorage.saveAttendance(newSession);
      setIsSaved(true);
      setLastSavedTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      refreshAllSessions();
    },
    [refreshAllSessions]
  );

  // Clear current date's markings
  const clearTodayAttendance = useCallback(async () => {
    if (!session) return;
    const clearedStudents = session.students.map((s) => ({
      ...s,
      status: 'unmarked' as const,
      updatedAt: Date.now(),
    }));

    const updatedSession: AttendanceSession = {
      ...session,
      students: clearedStudents,
      updatedAt: new Date().toISOString(),
    };

    setSession(updatedSession);
    await attendanceStorage.saveAttendance(updatedSession);
    setIsSaved(true);
    refreshAllSessions();
  }, [session, refreshAllSessions]);

  // Delete a session completely from history
  const deleteSession = useCallback(
    async (targetDate: string) => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      await attendanceStorage.deleteAttendance(targetDate);
      const remaining = await refreshAllSessions();

      if (targetDate === currentDate) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setCurrentDate(next.date);
          setSession(next);
        } else {
          setSession(null);
        }
      }
    },
    [currentDate, refreshAllSessions]
  );

  // Live Statistics
  const stats: AttendanceStats = useMemo(() => {
    if (!session || session.students.length === 0) {
      return { total: 0, present: 0, absent: 0, unmarked: 0, percentage: 0 };
    }

    const total = session.students.length;
    let present = 0;
    let absent = 0;
    let unmarked = 0;

    for (const student of session.students) {
      if (student.status === 'present') present++;
      else if (student.status === 'absent') absent++;
      else unmarked++;
    }

    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

    return {
      total,
      present,
      absent,
      unmarked,
      percentage,
    };
  }, [session]);

  return {
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
  };
}
