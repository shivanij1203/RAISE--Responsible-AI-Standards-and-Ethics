import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import './shortAnswer.css';

/**
 * @typedef {{
 *   key: string, title: string, text: string, button: string,
 *   kind: 'acknowledge' | 'scan' | 'anonymize' | 'statement' | 'disclosure' | 'suggest',
 *   targets: string[], done: boolean, highPriority: boolean,
 *   note: string, noteRules: string[], noteSources: { name: string, url: string }[],
 * }} ActionCard
 */

/** The rule text behind an acknowledgment card, with "Got it" to record it. */
function AcknowledgePanel({ card, busy, onConfirm }) {
  return (
    <div className="ac-panel" id={`ac-panel-${card.key}`}>
      {card.note && <p>{card.note}</p>}
      {card.noteRules.length > 0 && (
        <ul className="ac-rules">
          {card.noteRules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      )}
      {card.noteSources.length > 0 && (
        <p className="ac-sources">
          Source:{' '}
          {card.noteSources.map((source, i) => (
            <span key={source.url}>
              {i > 0 && ' · '}
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
            </span>
          ))}
        </p>
      )}
      <button type="button" className="btn-primary" onClick={onConfirm} disabled={busy}>
        {busy ? 'Saving…' : 'Got it'}
      </button>
    </div>
  );
}

/**
 * "A safer way to do this": up to four cards that each do one piece of the
 * work and mark the related checklist items addressed when finished.
 * @param {{
 *   cards: ActionCard[],
 *   busyKey: string | null,
 *   canAct: boolean,
 *   onStart: (card: ActionCard) => void,
 *   onAcknowledge: (card: ActionCard) => void,
 * }} props
 */
function ActionCards({ cards, busyKey, canAct, onStart, onAcknowledge }) {
  const [open, setOpen] = useState(null);
  if (cards.length === 0) return null;

  return (
    <section className="ac-section" aria-labelledby="ac-title">
      <h2 id="ac-title" className="ac-title">A safer way to do this</h2>
      <ul className="ac-grid">
        {cards.map((card) => {
          const isOpen = open === card.key && !card.done;
          return (
            <li key={card.key} className={`ac-card ${card.done ? 'is-done' : ''}`}>
              <div className="ac-head">
                <h3 className="ac-card-title">{card.title}</h3>
                {card.highPriority && !card.done && <span className="ac-badge">High priority</span>}
              </div>
              <p className="ac-text">{card.text}</p>
              {card.done ? (
                <p className="ac-done"><CheckCircle2 size={18} aria-hidden="true" /> Done</p>
              ) : canAct && (
                card.kind === 'acknowledge' ? (
                  <>
                    <button type="button" className="btn-secondary ac-button" aria-expanded={isOpen}
                      aria-controls={`ac-panel-${card.key}`} onClick={() => setOpen(isOpen ? null : card.key)}>
                      {isOpen ? 'Hide' : card.button}
                    </button>
                    {isOpen && (
                      <AcknowledgePanel card={card} busy={busyKey === card.key}
                        onConfirm={() => onAcknowledge(card)} />
                    )}
                  </>
                ) : (
                  <button type="button" className="btn-primary ac-button" onClick={() => onStart(card)}
                    disabled={busyKey === card.key}>
                    {card.button}
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ActionCards;
