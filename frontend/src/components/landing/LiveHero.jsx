import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks } from 'lucide-react';
import HeroChecklist from './HeroChecklist';
import { previewChecklist } from '../../services/api';
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const TEACHING_SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
// The Teaching checklist, generated from the real rules (export_landing_examples),
// so the first auto-play needs no request.
const TEACHING_PREVIEW = landingData.teachingPreview;
const PLACEHOLDERS = [
  'I use ChatGPT to draft quiz questions for my course.',
  'I use Claude to summarize interview transcripts for my study.',
  'I use an AI tool to help screen applications for our program.',
];
const MAX_LENGTH = 300;
const COUNTER_FROM = 240;
const DEBOUNCE_MS = 600;
const TYPE_MS = 26;
const TYPE_START_MS = 450;
const PLACEHOLDER_MS = 3200;

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 429) return 'You have tried a lot of sentences. Try again in an hour, or pick an example below.';
  if (status === 400) return err.response?.data?.error || 'Write one sentence about how you use AI.';
  return 'We could not reach RAISE just now. Please try again.';
}

/**
 * Type a sentence, see the checklist RAISE would suggest. Plays the Teaching
 * example once on load so the hero is never empty.
 * @param {{ onWorkThrough: (sentence: string) => void, busy: boolean }} props
 */
function LiveHero({ onWorkThrough, busy }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState(0);
  const requestId = useRef(0);
  const runCount = useRef(0);
  const autoplaying = useRef(true);
  const debounceTimer = useRef(null);

  const showResult = useCallback((sentence, data) => {
    runCount.current += 1;
    setResult({ sentence, data, run: runCount.current });
  }, []);

  const showTeaching = useCallback(() => {
    autoplaying.current = false;
    requestId.current += 1;
    setText(TEACHING_SENTENCE);
    showResult(TEACHING_SENTENCE, TEACHING_PREVIEW);
  }, [showResult]);

  const runPreview = useCallback(async (sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const data = await previewChecklist(trimmed);
      if (id === requestId.current) showResult(trimmed, data);
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [showResult]);

  // First load: type the Teaching sentence in once, then show its checklist.
  useEffect(() => {
    if (prefersReducedMotion()) {
      showTeaching();
      return undefined;
    }
    let typed = 0;
    let timer;
    const tick = () => {
      if (!autoplaying.current) return;
      typed += 1;
      setText(TEACHING_SENTENCE.slice(0, typed));
      if (typed < TEACHING_SENTENCE.length) timer = setTimeout(tick, TYPE_MS);
      else showTeaching();
    };
    timer = setTimeout(tick, TYPE_START_MS);
    return () => clearTimeout(timer);
  }, [showTeaching]);

  // Rotate example placeholders while the box is empty.
  const isEmpty = text === '';
  useEffect(() => {
    if (!isEmpty || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => setPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), PLACEHOLDER_MS);
    return () => clearInterval(timer);
  }, [isEmpty]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function handleFocus() {
    if (autoplaying.current) showTeaching();
  }

  function handleChange(event) {
    autoplaying.current = false;
    const value = event.target.value.slice(0, MAX_LENGTH);
    setText(value);
    clearTimeout(debounceTimer.current);
    if (value.trim()) debounceTimer.current = setTimeout(() => runPreview(value), DEBOUNCE_MS);
  }

  function handleSubmit(event) {
    event.preventDefault();
    autoplaying.current = false;
    clearTimeout(debounceTimer.current);
    runPreview(text);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
  }

  return (
    <div className="lh-card">
      <form className="lh-form" onSubmit={handleSubmit}>
        <label htmlFor="lh-input" className="lh-label">Describe how you use AI in one sentence.</label>
        <div className="lh-input-row">
          <textarea
            id="lh-input"
            className="lh-input"
            rows={2}
            value={text}
            maxLength={MAX_LENGTH}
            placeholder={PLACEHOLDERS[placeholder]}
            onChange={handleChange}
            onFocus={handleFocus}
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
      {result
        ? <HeroChecklist key={result.run} result={result} onWorkThrough={onWorkThrough} busy={busy} />
        : <div className="lh-result lh-result-empty" aria-hidden="true"></div>}
    </div>
  );
}

export default LiveHero;
