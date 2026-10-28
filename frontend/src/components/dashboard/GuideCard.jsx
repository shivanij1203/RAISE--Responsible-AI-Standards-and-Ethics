import { Check } from 'lucide-react';
import './guideCard.css';

const STEPS = [
  { key: 'scan', label: '1. Scan the sample file' },
  { key: 'answer', label: '2. Answer one item' },
  { key: 'record', label: '3. Get your record' },
];

/**
 * "Here's your checklist": three guided steps for a demo AI use. Each step
 * ticks off once done. Hidden for the session with "Got it, hide this".
 * @param {{
 *   done: string[],
 *   onScan: () => void,
 *   onAnswer: () => void,
 *   onRecord: () => void,
 *   onHide: () => void,
 * }} props
 */
function GuideCard({ done, onScan, onAnswer, onRecord, onHide }) {
  const actions = { scan: onScan, answer: onAnswer, record: onRecord };
  return (
    <section className="gc" aria-labelledby="gc-title">
      <div className="gc-head">
        <h2 id="gc-title" className="gc-title">Here&rsquo;s your checklist</h2>
        <button type="button" className="gc-hide" onClick={onHide}>Got it, hide this</button>
      </div>
      <p className="gc-line">RAISE read your sentence and listed what to check. Try these three steps:</p>
      <ol className="gc-steps">
        {STEPS.map((step) => {
          const isDone = done.includes(step.key);
          return (
            <li key={step.key}>
              <button
                type="button"
                className={`gc-step ${isDone ? 'is-done' : ''}`}
                onClick={actions[step.key]}
              >
                <span className="gc-tick" aria-hidden="true">{isDone && <Check size={14} strokeWidth={3} />}</span>
                <span>{step.label}</span>
                {isDone && <span className="visually-hidden"> (done)</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default GuideCard;
