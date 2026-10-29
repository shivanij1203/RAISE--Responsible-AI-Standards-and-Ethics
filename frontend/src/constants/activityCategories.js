export const ACTIVITY_CATEGORIES = [
  {
    key: 'research',
    label: 'Research',
    description: 'IRB studies, data collection, analysis, manuscripts.',
    tone: 'blue',
  },
  {
    key: 'teaching',
    label: 'Teaching',
    description: 'Course materials, lectures, classroom activities, syllabi.',
    tone: 'green',
  },
  {
    key: 'grading',
    label: 'Grading',
    description: 'Essay grading, rubric scoring, feedback on student work.',
    tone: 'orange',
  },
  {
    key: 'admin',
    label: 'Administration',
    description: 'Committee work, reviews, reports, administrative tasks.',
    tone: 'purple',
  },
];

// What people see: three groups, the same words as the landing examples.
// Grading is still stored as its own key (Quick Add offers it), but it is
// shown as Teaching everywhere a category is displayed or filtered.
export const DISPLAY_CATEGORIES = [
  { key: 'teaching', label: 'Teaching', tone: 'green' },
  { key: 'research', label: 'Research', tone: 'blue' },
  { key: 'admin', label: 'Administration', tone: 'purple' },
];

/** The display group for a stored category key (grading shows as teaching). */
export function displayCategoryKey(key) {
  return key === 'grading' ? 'teaching' : key || null;
}

export function getCategoryLabel(key) {
  return DISPLAY_CATEGORIES.find((c) => c.key === displayCategoryKey(key))?.label || null;
}

export function getCategoryTone(key) {
  return DISPLAY_CATEGORIES.find((c) => c.key === displayCategoryKey(key))?.tone || null;
}
