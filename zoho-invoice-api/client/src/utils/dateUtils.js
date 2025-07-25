/**
 * Utility functions for date formatting and month labels.
 */

/**
 * Converts a YYYY-MM string to a formatted month label (e.g., 'March '24').
 * @param {string} ym - Year-month string (YYYY-MM)
 * @returns {string}
 */
export function formatMonthLabel(ym) {
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const monthName = date.toLocaleString('default', { month: 'long' });
  return `${monthName} '${String(year).slice(2)}`;
}

/**
 * Returns the current month as a YYYY-MM string.
 * @returns {string}
 */
export function getCurrentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formats a date string as DD-MM-YYYY.
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
} 