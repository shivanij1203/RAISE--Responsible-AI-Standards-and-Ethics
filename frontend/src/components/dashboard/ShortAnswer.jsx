import { AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import './shortAnswer.css';

const ICONS = { fine: CheckCircle2, change: AlertTriangle, check_with: Building2 };

/**
 * "The short answer" at the top of an AI use: a plain headline built from
 * fixed rules, two or three reasons with their sources, and a note that it
 * is not a compliance decision. The headline is a live region, so a screen
 * reader hears it change as action cards are finished.
 * @param {{ answer: {
 *   kind: 'fine' | 'change' | 'check_with', headline: string, note: string,
 *   reasons: { text: string, source: { name: string, url: string | null } }[],
 * } }} props
 */
function ShortAnswer({ answer }) {
  const Icon = ICONS[answer.kind] || AlertTriangle;
  return (
    <section className={`sa-card sa-${answer.kind}`} aria-labelledby="sa-title">
      <p id="sa-title" className="sa-eyebrow">The short answer</p>
      <div className="sa-headline-row" aria-live="polite">
        <Icon className="sa-icon" size={28} strokeWidth={2} aria-hidden="true" />
        <h2 className="sa-headline">{answer.headline}</h2>
      </div>
      {answer.reasons.length > 0 && (
        <>
          <h3 className="sa-why-title">Why</h3>
          <ul className="sa-why">
            {answer.reasons.map((reason) => (
              <li key={reason.text}>
                {reason.text}{' '}
                <span className="sa-source">
                  {reason.source.url ? (
                    <a href={reason.source.url} target="_blank" rel="noopener noreferrer">{reason.source.name}</a>
                  ) : reason.source.name}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="sa-note">{answer.note}</p>
    </section>
  );
}

export default ShortAnswer;
