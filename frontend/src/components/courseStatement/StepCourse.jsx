/**
 * Step 1: course name and term.
 * @param {{
 *   form: import('../../utils/courseStatement').StatementForm,
 *   errors: { courseName?: string, term?: string },
 *   onChange: (field: string, value: string) => void,
 * }} props
 */
function StepCourse({ form, errors, onChange }) {
  return (
    <div className="cs-fields">
      <div className="cs-field">
        <label htmlFor="cs-course">Course name</label>
        <input
          id="cs-course"
          type="text"
          value={form.courseName}
          maxLength={200}
          placeholder="e.g., PSY 3213 Research Methods"
          aria-invalid={!!errors.courseName}
          aria-describedby={errors.courseName ? 'cs-course-error' : undefined}
          onChange={(e) => onChange('courseName', e.target.value)}
        />
        {errors.courseName && <p id="cs-course-error" className="cs-error">{errors.courseName}</p>}
      </div>
      <div className="cs-field">
        <label htmlFor="cs-term">Term</label>
        <input
          id="cs-term"
          type="text"
          value={form.term}
          maxLength={100}
          placeholder="e.g., Spring 2027"
          aria-invalid={!!errors.term}
          aria-describedby={errors.term ? 'cs-term-error' : undefined}
          onChange={(e) => onChange('term', e.target.value)}
        />
        {errors.term && <p id="cs-term-error" className="cs-error">{errors.term}</p>}
      </div>
    </div>
  );
}

export default StepCourse;
