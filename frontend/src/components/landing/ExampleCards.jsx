import { Building2, FlaskConical, GraduationCap } from 'lucide-react';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import landingData from '../../constants/landingExamples.json';

const ICONS = { teaching: GraduationCap, research: FlaskConical, administration: Building2 };

// Short names for the high-priority checklist items (by checkpoint id).
const SHORT_NAMES = {
  irb: 'IRB coverage',
  data_deidentified: 'De-identification',
  participant_consent: 'Participant consent',
  ferpa_compliance: 'FERPA',
  grading_fairness: 'Fairness of AI grades',
  decision_impact: 'Decisions about people',
};
const MAX_TAGS = 3;

function flagged(exampleKey) {
  const data = landingData.examples.find((e) => e.key === exampleKey);
  if (!data) return { count: 0, tags: [] };
  return {
    count: data.itemCount,
    tags: data.highPriority.slice(0, MAX_TAGS).map((h) => SHORT_NAMES[h.id] || h.label),
  };
}

/**
 * The three demo examples. Each button starts a demo session and opens that
 * example directly.
 * @param {{ onTry: (example: object) => void, busyKey: string | null }} props
 */
function ExampleCards({ onTry, busyKey }) {
  return (
    <ul className="lp-examples">
      {DEMO_EXAMPLES.map((ex, index) => {
        const Icon = ICONS[ex.key];
        const { count, tags } = flagged(ex.key);
        return (
          <li
            key={ex.key}
            className={`lp-example reveal ${ex.recommended ? 'lp-example-recommended' : ''}`}
            style={{ '--reveal-delay': `${index * 90}ms` }}
          >
            <div className="lp-example-head">
              <span className="lp-example-icon" aria-hidden="true">{Icon && <Icon size={22} strokeWidth={1.75} />}</span>
              <h3>{ex.title}</h3>
              {ex.recommended && <span className="lp-example-badge">Recommended</span>}
            </div>
            <p className="lp-example-sentence">&ldquo;{ex.sentence}&rdquo;</p>
            <div className="lp-example-flags">
              <span className="lp-example-count">Flags {count} items, including</span>
              <ul className="lp-example-tags">
                {tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <button
              className={ex.recommended ? 'lp-btn-hero lp-example-btn' : 'lp-btn-secondary lp-example-btn'}
              onClick={() => onTry(ex)}
              disabled={busyKey !== null}
              aria-busy={busyKey === ex.key}
            >
              {busyKey === ex.key ? 'Starting…' : 'Try this example'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ExampleCards;
