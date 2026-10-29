import { useEffect, useState } from 'react';
import { fetchSmartDefaults, logDecision } from '../../services/api';

const TITLE = 'Get a suggested answer';

// Same comparison the server uses: whitespace and letter case do not count
// as an edit.
function normalize(text) {
  return (text || '').split(/\s+/).filter(Boolean).join(' ').toLowerCase();
}

function SuggestionCard({ draft, onSave }) {
  const [text, setText] = useState(draft.suggestedDescription);
  const [notes, setNotes] = useState(draft.suggestedNotes || '');
  const [reviewed, setReviewed] = useState(false);
  const [status, setStatus] = useState('open'); // open | saving | saved | skipped
  const [error, setError] = useState('');

  const edited = normalize(text) !== normalize(draft.suggestedDescription);
  const canSave = text.trim() && (edited || reviewed) && status === 'open';
  const fieldId = `sd-text-${draft.checkpointId}`;
  const reviewId = `sd-reviewed-${draft.checkpointId}`;

  async function handleSave() {
    if (!canSave) return;
    setStatus('saving');
    setError('');
    try {
      await onSave({ text: text.trim(), notes, reviewed });
      setStatus('saved');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this answer. Try again.');
      setStatus('open');
    }
  }

  const locked = status === 'saved' || status === 'skipped';
  const cardClass = status === 'saved' ? 'sd-card-applied' : status === 'skipped' ? 'sd-card-skipped' : '';

  return (
    <div className={`sd-card ${cardClass}`}>
      <div className="sd-card-header">
        <div className="sd-card-title">{draft.checkpointLabel}</div>
      </div>

      <label className="sd-card-label" htmlFor={fieldId}>
        Suggested starting point. Edit it to match what you actually did.
      </label>
      <textarea
        id={fieldId}
        className="sd-card-desc"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      {draft.suggestedNotes && (
        <details className="sd-card-notes">
          <summary>Notes to check (optional)</summary>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={locked}
          />
        </details>
      )}

      {!locked && (
        <label className="sd-card-reviewed" htmlFor={reviewId}>
          <input
            id={reviewId}
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          I reviewed this and it reflects my activity.
        </label>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="sd-card-actions">
        {status === 'saved' && <span className="sd-applied-tag">Saved. This item is marked addressed.</span>}
        {status === 'skipped' && (
          <>
            <span className="sd-skipped-tag">Skipped</span>
            <button className="btn-link" onClick={() => setStatus('open')}>Undo skip</button>
          </>
        )}
        {(status === 'open' || status === 'saving') && (
          <>
            {!canSave && status === 'open' && (
              <span className="sd-card-hint">Edit the text or tick the box to save.</span>
            )}
            <button className="btn-secondary sd-skip-btn" onClick={() => setStatus('skipped')}>
              Skip
            </button>
            <button
              className="btn-primary sd-apply-btn"
              onClick={handleSave}
              disabled={!canSave}
            >
              {status === 'saving' ? 'Saving...' : 'Save answer'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** The first focus item that has a suggestion goes first; the rest keep their order. */
function orderDrafts(drafts, focusIds) {
  const leadId = focusIds.find((id) => drafts.some((d) => d.checkpointId === id));
  if (!leadId) return drafts;
  return [...drafts.filter((d) => d.checkpointId === leadId), ...drafts.filter((d) => d.checkpointId !== leadId)];
}

/**
 * @param {{
 *   project: object,
 *   onClose: () => void,
 *   onCheckpointApplied?: (checkpointId: string) => void,
 *   focusIds?: string[],
 * }} props
 * focusIds: item ids to show first, in order (the demo guide passes the open
 * high-priority items). The first one with a suggestion leads the list.
 */
function SmartDefaultsModal({ project, onClose, onCheckpointApplied, focusIds = [] }) {
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSmartDefaults(project.id)
      .then((res) => setDrafts(res.drafts || []))
      .catch(() => setError('Could not load suggestions.'));
  }, [project.id]);

  async function saveAnswer(draft, { text, notes, reviewed }) {
    await logDecision(project.id, {
      checkpoint: draft.checkpointId,
      description: text,
      notes: notes || '',
      proofType: 'smart_default',
      reviewed,
    });
    if (onCheckpointApplied) onCheckpointApplied(draft.checkpointId);
  }

  if (drafts === null) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{TITLE}</h2>
          {error ? <p className="error-text">{error}</p> : <p>Loading suggestions...</p>}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{TITLE}</h2>
          <p className="sd-empty">
            No suggestions for this activity. Either every item is addressed, or the
            remaining items need an answer in your own words.
          </p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{TITLE}</h2>
        <p className="sd-subtitle">
          RAISE suggests a starting point for {drafts.length} item{drafts.length === 1 ? '' : 's'} based
          on your activity details. A suggestion is not an answer. Edit each one to match what you
          actually did, or confirm you reviewed it, before you save it. Each saved answer is added to
          this activity's record.
        </p>

        <div className="sd-cards">
          {orderDrafts(drafts, focusIds).map((d, i) => (
            <div key={d.checkpointId} className={i === 0 && focusIds.includes(d.checkpointId) ? 'sd-focus' : undefined}>
              <SuggestionCard draft={d} onSave={(fields) => saveAnswer(d, fields)} />
            </div>
          ))}
        </div>

        <div className="modal-actions sd-modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default SmartDefaultsModal;
