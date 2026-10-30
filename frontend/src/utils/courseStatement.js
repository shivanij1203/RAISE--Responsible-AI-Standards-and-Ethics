// Helpers for the course AI statement flow (components/courseStatement).

export const STEPS = [
  { key: 'course', title: 'Course' },
  { key: 'uses', title: 'Your AI uses' },
  { key: 'students', title: 'Student AI use' },
  { key: 'preview', title: 'Preview and copy' },
];

export const POLICY_LABELS = {
  acceptable: 'USF sample: Acceptable Use',
  restricted: 'USF sample: Restricted Use',
  custom: 'Write my own',
};

/**
 * @typedef {{
 *   courseName: string, term: string, projectIds: number[],
 *   policy: 'acceptable' | 'restricted' | 'custom',
 *   allowed: string[], notAllowed: string[], citeLine: string,
 * }} StatementForm
 */

/** @returns {StatementForm} */
export function emptyForm() {
  return { courseName: '', term: '', projectIds: [], policy: 'acceptable', allowed: [], notAllowed: [], citeLine: '' };
}

/** A saved statement from the API as form values. */
export function formFromStatement(statement) {
  return {
    courseName: statement.courseName,
    term: statement.term,
    projectIds: statement.projectIds,
    policy: statement.policy,
    allowed: statement.allowed,
    notAllowed: statement.notAllowed,
    citeLine: statement.citeLine,
  };
}

/** The form as the API expects it. @param {StatementForm} form */
export function toPayload(form) {
  return {
    course_name: form.courseName.trim(),
    term: form.term.trim(),
    project_ids: form.projectIds,
    policy: form.policy,
    allowed: form.allowed,
    not_allowed: form.notAllowed,
    cite_line: form.citeLine.trim(),
  };
}

/** A stable key for the choices, to tell whether the text needs rebuilding. */
export function choicesKey(form) {
  const payload = toPayload(form);
  return JSON.stringify({
    ...payload,
    project_ids: [...payload.project_ids].sort((a, b) => a - b),
    allowed: [...payload.allowed].sort(),
    not_allowed: [...payload.not_allowed].sort(),
  });
}

/**
 * Starting checkboxes for a policy. Restricted Use marks every student use
 * as not allowed; the other two start empty for the professor to fill in.
 * @param {string} policy
 * @param {{key: string}[]} studentUses
 */
export function presetFor(policy, studentUses) {
  if (policy === 'restricted') return { allowed: [], notAllowed: studentUses.map((u) => u.key) };
  return { allowed: [], notAllowed: [] };
}

/**
 * Mark one student use allowed or not allowed. A use is never in both lists.
 * @param {StatementForm} form
 * @param {'allowed' | 'notAllowed'} list
 * @param {string} key
 * @param {boolean} checked
 * @returns {StatementForm}
 */
export function toggleStudentUse(form, list, key, checked) {
  const other = list === 'allowed' ? 'notAllowed' : 'allowed';
  return {
    ...form,
    [list]: checked ? [...form[list].filter((k) => k !== key), key] : form[list].filter((k) => k !== key),
    [other]: checked ? form[other].filter((k) => k !== key) : form[other],
  };
}

/** "PSY 3213 AI statement.docx", without characters file systems reject. */
export function docxFilename(courseName) {
  const safe = courseName.replace(/[^A-Za-z0-9 ._-]+/g, '').trim() || 'Course';
  return `${safe} AI statement.docx`;
}
