import { formatCheckedDate } from '../../utils/ruleSources';
import { POLICY_LABELS } from '../../utils/courseStatement';

/** The Provost sample's text and source, collapsed by default. */
function SampleText({ policy }) {
  const checked = formatCheckedDate(policy.source.lastChecked);
  return (
    <details className="cs-sample">
      <summary>Read the sample text</summary>
      {policy.paragraphs.map((p) => <p key={p}>{p}</p>)}
      <p className="cs-sample-source">
        Source:{' '}
        <a href={policy.source.url} target="_blank" rel="noopener noreferrer">{policy.source.name}</a>
        {' '}({policy.source.version}{checked && `; checked ${checked}`})
      </p>
    </details>
  );
}

/**
 * One checkbox group: the uses students may (or may not) use AI for.
 * @param {{ legend: string, idPrefix: string, uses: {key: string, label: string}[],
 *   checked: string[], onToggle: (key: string, checked: boolean) => void }} props
 */
function UseGroup({ legend, idPrefix, uses, checked, onToggle }) {
  return (
    <fieldset className="cs-fieldset cs-use-group">
      <legend>{legend}</legend>
      {uses.map((use) => {
        const id = `${idPrefix}-${use.key}`;
        return (
          <div key={use.key} className="cs-check">
            <input id={id} type="checkbox" checked={checked.includes(use.key)}
              onChange={(e) => onToggle(use.key, e.target.checked)} />
            <label htmlFor={id}>{use.label}</label>
          </div>
        );
      })}
    </fieldset>
  );
}

/**
 * Step 3: what students may use AI for. A USF Provost sample is the starting
 * point, or the professor writes their own; checkboxes and a citation line
 * add specifics.
 * @param {{
 *   form: import('../../utils/courseStatement').StatementForm,
 *   policies: { key: string, title: string, paragraphs: string[], source: object }[],
 *   studentUses: { key: string, label: string }[],
 *   onPolicy: (policy: string) => void,
 *   onToggleUse: (list: 'allowed' | 'notAllowed', key: string, checked: boolean) => void,
 *   onCiteLine: (value: string) => void,
 *   rebuildNote: boolean,
 * }} props
 */
function StepStudentUse({ form, policies, studentUses, onPolicy, onToggleUse, onCiteLine, rebuildNote }) {
  const options = [...policies, { key: 'custom', title: 'Write my own policy with the choices below.' }];
  return (
    <div className="cs-fields">
      <fieldset className="cs-fieldset">
        <legend>Starting point</legend>
        <p className="cs-hint">
          The USF Office of the Provost offers two sample policies. The statement uses the sample word for word,
          then adds your choices below. You can edit everything in the next step.
        </p>
        {options.map((option) => {
          const id = `cs-policy-${option.key}`;
          return (
            <div key={option.key} className="cs-policy">
              <input id={id} type="radio" name="cs-policy" value={option.key}
                checked={form.policy === option.key} onChange={() => onPolicy(option.key)} />
              <div>
                <label htmlFor={id} className="cs-policy-label">{POLICY_LABELS[option.key]}</label>
                {option.paragraphs ? <SampleText policy={option} /> : <p className="cs-hint">{option.title}</p>}
              </div>
            </div>
          );
        })}
      </fieldset>

      <div className="cs-use-groups">
        <UseGroup legend="Students may use AI for" idPrefix="cs-allowed" uses={studentUses}
          checked={form.allowed} onToggle={(key, on) => onToggleUse('allowed', key, on)} />
        <UseGroup legend="Students may not use AI for" idPrefix="cs-not-allowed" uses={studentUses}
          checked={form.notAllowed} onToggle={(key, on) => onToggleUse('notAllowed', key, on)} />
      </div>

      <div className="cs-field">
        <label htmlFor="cs-cite">How to cite or disclose AI use <span className="cs-optional">(optional)</span></label>
        <input id="cs-cite" type="text" value={form.citeLine} maxLength={500}
          placeholder="e.g., Add a short note at the end saying which tool you used and for what."
          onChange={(e) => onCiteLine(e.target.value)} />
      </div>

      {rebuildNote && (
        <p className="cs-note">
          Continuing rebuilds the statement from these choices and replaces edits you made to its text.
        </p>
      )}
    </div>
  );
}

export default StepStudentUse;
