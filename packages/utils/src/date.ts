/**
 * Format a date for display in Indian format (DD/MM/YYYY).
 */
export function formatDateIN(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Get current Indian academic year (April–March).
 * In March 2026, the academic year is "2025-2026".
 * In April 2026, the academic year is "2026-2027".
 */
export function getCurrentAcademicYear(now: Date = new Date()): string {
  const month = now.getMonth(); // 0-indexed: 0=Jan, 3=April
  const year = now.getFullYear();

  if (month >= 3) {
    // April onwards
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Format date-time for Indian timezone display.
 */
export function formatDateTimeIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}
