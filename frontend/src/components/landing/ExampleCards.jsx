import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import landingData from '../../constants/landingExamples.json';

// Short names for the high-priority checklist items (by checkpoint id).
const SHORT_NAMES = {
  irb: 'IRB coverage',
  data_deidentified: 'de-identification',
  participant_consent: 'participant consent',
  ferpa_compliance: 'FERPA',
  grading_fairness: 'fairness of AI grades',
  decision_impact: 'impact on decisions about people',
};

function joinWords(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')}, and ${words[words.length - 1]}`;
}

/** One line from the real checklist, e.g. "Flags 7 items, including FERPA and de-identification." */
function flagSummary(exampleKey) {
  const data = landingData.examples.find((e) => e.key === exampleKey);
  if (!data) return '';
  const names = data.highPriority.map((h) => SHORT_NAMES[h.id] || h.label);
  return `Flags ${data.itemCount} items, including ${joinWords(names)}.`;
}

/**
 * The three demo examples. Each button starts a demo session and opens that
 * example directly.
 * @param {{ onTry: (example: object) => void, busyKey: string | null }} props
 */
function ExampleCards({ onTry, busyKey }) {
  return (
    <ul className="lp-examples">
      {DEMO_EXAMPLES.map((ex) => (
        <li key={ex.key} className={`lp-example ${ex.recommended ? 'lp-example-recommended' : ''}`}>
          <div className="lp-example-head">
            <h3>{ex.title}</h3>
            {ex.recommended && <span className="lp-example-badge">Recommended</span>}
          </div>
          <p className="lp-example-sentence">&ldquo;{ex.sentence}&rdquo;</p>
          <p className="lp-example-flags">{flagSummary(ex.key)}</p>
          <button
            className={ex.recommended ? 'lp-btn-hero lp-example-btn' : 'lp-btn-secondary lp-example-btn'}
            onClick={() => onTry(ex)}
            disabled={busyKey !== null}
            aria-busy={busyKey === ex.key}
          >
            {busyKey === ex.key ? 'Starting…' : 'Try this example'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ExampleCards;
