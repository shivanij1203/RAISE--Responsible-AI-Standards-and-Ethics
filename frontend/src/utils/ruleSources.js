/**
 * "Oct 30, 2026" for an ISO date like "2026-10-30", or '' when there is none.
 * Parsed as a calendar date so the day does not shift with the time zone.
 * @param {string | null | undefined} isoDate
 * @returns {string}
 */
export function formatCheckedDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
  if (!match) return '';
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
