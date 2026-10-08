// Starting points for a first demo session. Each one goes through the normal
// Quick Add path (App sets templateSeed), so RAISE reads the sentence the
// same way it reads anything a person types.
export const DEMO_EXAMPLES = [
  {
    key: 'teaching',
    title: 'Teaching',
    sentence: "I'm using ChatGPT to give first-pass grades and feedback on student essays.",
    category: 'grading',
    recommended: true,
  },
  {
    key: 'research',
    title: 'Research',
    sentence: "I'm using ChatGPT to help code de-identified student interview transcripts for a research study.",
    category: 'research',
  },
  {
    key: 'administration',
    title: 'Administration',
    sentence: "I'm using an AI tool to help screen applications for our MS program.",
    category: 'admin',
  },
];

const PICKER_SEEN_KEY = 'raise_example_picker_seen';

/** True the first time in this browser session; storage errors count as "seen". */
export function shouldShowExamplePicker() {
  try {
    return window.sessionStorage.getItem(PICKER_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

export function markExamplePickerSeen() {
  try {
    window.sessionStorage.setItem(PICKER_SEEN_KEY, '1');
  } catch {
    // Private mode or blocked storage: the picker may show again, which is harmless.
  }
}
