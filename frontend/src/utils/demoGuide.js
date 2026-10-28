// Session-only state for the demo guide card on an activity page: which AI
// uses were created from a demo button, which guide steps are done, and
// whether the visitor hid the card. Storage errors mean "not set".

const GUIDED_KEY = 'raise_guided_projects';
const stepKey = (projectId) => `raise_guide_steps_${projectId}`;
const hiddenKey = (projectId) => `raise_guide_hidden_${projectId}`;

function read(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode or storage off: the guide simply will not remember.
  }
}

function readList(key) {
  try {
    const value = JSON.parse(read(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function markGuided(projectId) {
  const ids = readList(GUIDED_KEY);
  if (!ids.includes(String(projectId))) write(GUIDED_KEY, JSON.stringify([...ids, String(projectId)]));
}

export function isGuided(projectId) {
  return readList(GUIDED_KEY).includes(String(projectId));
}

export function isGuideHidden(projectId) {
  return read(hiddenKey(projectId)) === '1';
}

export function hideGuide(projectId) {
  write(hiddenKey(projectId), '1');
}

/** Steps done so far, e.g. ['scan', 'answer']. */
export function doneSteps(projectId) {
  return readList(stepKey(projectId));
}

/** Marks a step done and returns the new list. */
export function markStepDone(projectId, step) {
  const steps = doneSteps(projectId);
  if (steps.includes(step)) return steps;
  const next = [...steps, step];
  write(stepKey(projectId), JSON.stringify(next));
  return next;
}
