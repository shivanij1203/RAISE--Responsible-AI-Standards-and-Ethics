import { GUIDANCE_LAST_REVIEWED } from '../constants/attribution';

/** "Guidance last reviewed: October 7, 2026", from the one constant in attribution.js. */
export function guidanceReviewedLabel() {
  // Parse as a calendar date so no time zone can shift the day.
  const [year, month, day] = GUIDANCE_LAST_REVIEWED.split('-').map(Number);
  const formatted = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return `Guidance last reviewed: ${formatted}`;
}
