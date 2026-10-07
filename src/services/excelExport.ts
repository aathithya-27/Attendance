import * as XLSX from 'xlsx';
import { AttendanceSession, AttendanceStats } from '../types/attendance';
import { formatExportDate } from '../utils/dateUtils';

/**
 * Generates and downloads an Excel (.xlsx) attendance report.
 */
export function exportAttendanceToExcel(
  session: AttendanceSession,
  stats: AttendanceStats
): void {
  const formattedDate = formatExportDate(session.date);

  // 1. Prepare structured sheet data
  const sheetData: (string | number)[][] = [
    ['ROLLCALL ATTENDANCE REPORT'],
    ['Generated Date:', formattedDate],
    ['Roll Range:', `${session.fromRoll} to ${session.toRoll}`],
    [''],
    ['SUMMARY STATISTICS', ''],
    ['Total Enrolled:', stats.total],
    ['Present Students:', stats.present],
    ['Absent Students:', stats.absent],
    ['Unmarked Students:', stats.unmarked],
    [''],
    ['DETAILED STUDENT ATTENDANCE ROSTER'],
    ['S.No', 'Roll Number', 'Attendance Status', 'Date', 'Marked Timestamp'],
  ];

  session.students.forEach((student, index) => {
    let statusLabel = 'Unmarked';
    if (student.status === 'present') statusLabel = 'Present';
    if (student.status === 'absent') statusLabel = 'Absent';

    const timestamp = student.updatedAt
      ? new Date(student.updatedAt).toLocaleTimeString('en-GB')
      : '-';

    sheetData.push([
      index + 1,
      student.rollNumber,
      statusLabel,
      formattedDate,
      timestamp,
    ]);
  });

  // 2. Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 3. Define column widths for high legibility
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 22 }, // Roll Number
    { wch: 20 }, // Attendance Status
    { wch: 16 }, // Date
    { wch: 20 }, // Timestamp
  ];

  // 4. Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance Roster');

  // 5. Trigger download
  const filename = `Attendance_${formattedDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
