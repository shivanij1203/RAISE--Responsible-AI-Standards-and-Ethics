import { USE_CASE_LABELS_SHORT } from '../../constants/useCases';

/**
 * Step 2: which recorded AI uses belong in this course's statement. Each one
 * shows the sentence it adds, written from what was recorded.
 * @param {{
 *   aiUses: { id: number, name: string, aiUseCase: string, sentence: string }[],
 *   selected: number[],
 *   onToggle: (id: number, checked: boolean) => void,
 * }} props
 */
function StepUses({ aiUses, selected, onToggle }) {
  if (aiUses.length === 0) {
    return (
      <p className="cs-empty">
        You have no AI uses recorded yet. You can still continue; the statement will leave a line for you to
        describe how you use AI in this course.
      </p>
    );
  }
  return (
    <fieldset className="cs-fieldset">
      <legend>AI uses in this course</legend>
      <p className="cs-hint">Teaching and grading uses are selected to start. Each one adds the sentence shown.</p>
      <ul className="cs-use-list">
        {aiUses.map((use) => {
          const id = `cs-use-${use.id}`;
          return (
            <li key={use.id} className="cs-use">
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(use.id)}
                aria-describedby={`${id}-sentence`}
                onChange={(e) => onToggle(use.id, e.target.checked)}
              />
              <div>
                <label htmlFor={id} className="cs-use-name">
                  {use.name}
                  <span className="cs-use-kind"> · {USE_CASE_LABELS_SHORT[use.aiUseCase] || use.aiUseCase}</span>
                </label>
                <p id={`${id}-sentence`} className="cs-use-sentence">{use.sentence}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export default StepUses;
