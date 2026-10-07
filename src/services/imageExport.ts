import { StudentAttendance } from '../types/attendance';
import { formatExportDate } from '../utils/dateUtils';
import { isPureNumber } from './rollNumberGenerator';

/**
 * Exports strictly the attendance grid using direct HTML5 Canvas rendering.
 * This guarantees 100% reliable rendering with zero blank/white images,
 * zero viewport clipping, and zero cross-origin stylesheet errors.
 */
export async function exportAttendanceGridImage(
  students: StudentAttendance[],
  columns: number,
  dateIso: string
): Promise<void> {
  const formattedDate = formatExportDate(dateIso);
  const filename = `Attendance_Grid_${formattedDate}.png`;

  const cols = Math.max(1, columns);
  const totalRows = Math.ceil(students.length / cols);

  const colWidth = 84;
  const rowHeight = 92;
  const padding = 28;
  const headerHeight = 52;

  const width = cols * colWidth + padding * 2;
  const height = totalRows * rowHeight + headerHeight + padding * 2;

  // 2x Retina resolution for sharp rendering
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.scale(dpr, dpr);

  // 1. Clean White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Header
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.font = 'bold 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('RollCall Attendance Roster', padding, padding);

  ctx.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Date: ${formattedDate}`, padding, padding + 22);

  // Header Summary Stats
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  ctx.textAlign = 'right';
  ctx.font = '600 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    `Total: ${students.length}   |   Present: ${presentCount}   |   Absent: ${absentCount}`,
    width - padding,
    padding + 12
  );

  // Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding + headerHeight - 6);
  ctx.lineTo(width - padding, padding + headerHeight - 6);
  ctx.stroke();

  // 3. Draw Student Attendance Circles
  students.forEach((student, index) => {
    const isPure = isPureNumber(student.rollNumber);
    const col = index % cols;
    const row = Math.floor(index / cols);

    const cx = padding + col * colWidth + colWidth / 2;
    const cy = padding + headerHeight + row * rowHeight + 28;
    const radius = 22;

    // Outer Circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    if (student.status === 'present') {
      ctx.fillStyle = '#16a34a';
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
    } else if (student.status === 'absent') {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
    }

    ctx.fill();
    ctx.stroke();

    // Inside Circle Graphic
    if (isPure) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = student.status === 'unmarked' ? '#334155' : '#ffffff';
      ctx.fillText(student.rollNumber, cx, cy);
    } else {
      if (student.status === 'present') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx - 2, cy + 5);
        ctx.lineTo(cx + 7, cy - 5);
        ctx.stroke();
      } else if (student.status === 'absent') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.moveTo(cx + 5, cy - 5);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Roll Number Label below circle (for alphanumeric)
    if (!isPure) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(student.rollNumber, cx, cy + radius + 4);
    }

    // Status Label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '600 10px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const labelY = cy + radius + (isPure ? 5 : 18);
    if (student.status === 'present') {
      ctx.fillStyle = '#15803d';
      ctx.fillText('✓ Present', cx, labelY);
    } else if (student.status === 'absent') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('✕ Absent', cx, labelY);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Unmarked', cx, labelY);
    }
  });

  // 4. Download generated PNG
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
