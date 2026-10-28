import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks } from 'lucide-react';
import HeroChecklist from './HeroChecklist';
import { previewChecklist } from '../../services/api';
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';

// Starts on the Teaching example, generated from the real rules
// (export_landing_examples), so the card is filled in with no request.
const TEACHING_SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
const TEACHING_PREVIEW = landingData.examplePreviews.teaching;
const MAX_LENGTH = 300;
const COUNTER_FROM = 240;
const DEBOUNCE_MS = 600;

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 429) return 'You have tried a lot of sentences. Try again in an hour, or pick an example below.';
  if (status === 400) return err.response?.data?.error || 'Write one sentence about how you use AI.';
  return 'We could not reach RAISE just now. Please try again.';
}

/**
 * Type a sentence, see the checklist RAISE would suggest.
 * @param {{ onWorkThrough: (sentence: string) => void, busy: boolean, inputId: string }} props
 */
function LiveHero({ onWorkThrough, busy, inputId }) {
  const runCount = useRef(1);
  const [text, setText] = useState(TEACHING_SENTENCE);
  const [result, setResult] = useState({ sentence: TEACHING_SENTENCE, data: TEACHING_PREVIEW, run: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const debounceTimer = useRef(null);

  const runPreview = useCallback(async (sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const data = await previewChecklist(trimmed);
      if (id !== requestId.current) return;
      runCount.current += 1;
      setResult({ sentence: trimmed, data, run: runCount.current });
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function handleChange(event) {
    const value = event.target.value.slice(0, MAX_LENGTH);
    setText(value);
    clearTimeout(debounceTimer.current);
    if (value.trim()) debounceTimer.current = setTimeout(() => runPreview(value), DEBOUNCE_MS);
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearTimeout(debounceTimer.current);
    runPreview(text);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
  }

  return (
    <div className="lh-card">
      <form className="lh-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="lh-label">Describe how you use AI in one sentence.</label>
        <p className="lh-hint" id={`${inputId}-hint`}>Paste or type your own. RAISE updates the checklist as you go.</p>
        <div className="lh-input-row">
          <textarea
            id={inputId}
            className="lh-input"
            rows={2}
            value={text}
            maxLength={MAX_LENGTH}
            aria-describedby={`${inputId}-hint`}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="lh-submit" disabled={!text.trim() || loading}>
            <ListChecks size={16} aria-hidden="true" /> Show checklist
          </button>
        </div>
        <div className="lh-status">
          {loading && <span>Reading your sentence…</span>}
          {text.length >= COUNTER_FROM && <span className="lh-count">{text.length}/{MAX_LENGTH}</span>}
        </div>
      </form>
      {error && <p className="lh-error" role="alert">{error}</p>}
      <HeroChecklist
        key={result.run}
        result={result}
        onWorkThrough={onWorkThrough}
        onInteract={() => {}}
        busy={busy}
        autoplay={false}
      />
    </div>
  );
}

export default LiveHero;
