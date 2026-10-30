/**
 * When an AI use last changed: its newest decision, completed item, or creation.
 * @param {{ createdAt: string, decisions?: {loggedAt: string}[], checkpoints?: {completedAt?: string}[] }} project
 * @returns {Date}
 */
export function lastUpdatedAt(project) {
  const times = [
    project.createdAt,
    ...(project.decisions || []).map((d) => d.loggedAt),
    ...(project.checkpoints || []).map((c) => c.completedAt),
  ].filter(Boolean).map((t) => new Date(t).getTime());
  return new Date(Math.max(...times));
}

/**
 * "today", "yesterday", or "on Oct 28".
 * @param {Date} date
 * @param {Date} [now]
 */
export function describeDay(date, now = new Date()) {
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
