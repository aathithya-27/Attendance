export type AttendanceStatus = 'unmarked' | 'present' | 'absent';

export interface StudentAttendance {
  rollNumber: string;
  status: AttendanceStatus;
  updatedAt?: number;
}

export interface AttendanceSession {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  displayDate?: string;
  fromRoll: string;
  toRoll: string;
  rows: number;
  columns: number;
  students: StudentAttendance[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  title?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  unmarked: number;
  percentage: number;
}

export type StatusFilter = 'all' | 'present' | 'absent' | 'unmarked';
