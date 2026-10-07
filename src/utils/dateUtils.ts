/**
 * Date utility helpers for RollCall
 */

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(isoString: string): string {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-').map(Number);
  if (!year || !month || !day) return isoString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimelineDate(isoString: string): string {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-').map(Number);
  if (!year || !month || !day) return isoString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatExportDate(isoString: string): string {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-');
  if (!year || !month || !day) return isoString;
  return `${day}-${month}-${year}`;
}

export function shiftDateDays(isoString: string, deltaDays: number): string {
  const [year, month, day] = isoString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMonthGroup(isoString: string): string {
  if (!isoString) return 'Other';
  const [year, month, day] = isoString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}
