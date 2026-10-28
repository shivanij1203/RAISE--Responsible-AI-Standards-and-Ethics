import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks } from 'lucide-react';
import HeroChecklist from './HeroChecklist';
import { previewChecklist } from '../../services/api';
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

// The three examples with their checklists, generated from the real rules
// (export_landing_examples), so the auto-cycle needs no requests.
const EXAMPLES = DEMO_EXAMPLES.map((ex) => ({
  key: ex.key, title: ex.title, sentence: ex.sentence, preview: landingData.examplePreviews[ex.key],
}));
const PLACEHOLDERS = [
  'I use ChatGPT to draft quiz questions for my course.',
  'I use Claude to summarize interview transcripts for my study.',
  'I use an AI tool to help screen applications for our program.',
];
const MAX_LENGTH = 300;
const COUNTER_FROM = 240;
const DEBOUNCE_MS = 600;
const TYPE_MS = 24;
const TYPE_START_MS = 450;
const PLACEHOLDER_MS = 3200;
const DWELL_MS = 5000;
const CLEAR_MS = 450;
// Time for the chips, items, and record count-up to finish (see HeroChecklist).
const BUILD_MS = 2600;

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 429) return 'You have tried a lot of sentences. Try again in an hour, or pick an example below.';
  if (status === 400) return err.response?.data?.error || 'Write one sentence about how you use AI.';
  return 'We could not reach RAISE just now. Please try again.';
}

function ExampleDots({ activeKey, onJump }) {
  const active = EXAMPLES.find((ex) => ex.key === activeKey);
  return (
    <div className="lh-dots">
      <div role="group" aria-label="Examples" className="lh-dots-row">
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.key}
            type="button"
            className={`lh-dot ${ex.key === activeKey ? 'is-active' : ''}`}
            aria-label={`Show the ${ex.title} example`}
            aria-pressed={ex.key === activeKey}
            onClick={() => onJump(i)}
          />
        ))}
      </div>
      <span className="lh-dots-label">{active ? `${active.title} example` : 'Your sentence'}</span>
    </div>
  );
}

/**
 * Type a sentence, see the checklist RAISE would suggest. Until the visitor
 * interacts, the card cycles through the three examples. With reduced motion
 * it shows the Teaching example, fully rendered, and never cycles.
 * @param {{ onWorkThrough: (sentence: string) => void, busy: boolean }} props
 */
function LiveHero({ onWorkThrough, busy }) {
  const [reduced] = useState(prefersReducedMotion);
  const runCount = useRef(1);
  const [cycling, setCycling] = useState(!reduced);
  const [cycleKey, setCycleKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('typing');
  const [clearing, setClearing] = useState(false);
  const [text, setText] = useState(reduced ? EXAMPLES[0].sentence : '');
  const [result, setResult] = useState(reduced
    ? { sentence: EXAMPLES[0].sentence, data: EXAMPLES[0].preview, run: 1, exampleKey: EXAMPLES[0].key }
    : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState(0);
  const requestId = useRef(0);
  const debounceTimer = useRef(null);

  const showExample = useCallback((i) => {
    runCount.current += 1;
    const ex = EXAMPLES[i];
    setResult({ sentence: ex.sentence, data: ex.preview, run: runCount.current, exampleKey: ex.key });
  }, []);

  // The auto-cycle: type, show, wait, clear, next. Every state change happens
  // inside a timer, and stopping the cycle cancels whatever is pending.
  useEffect(() => {
    if (!cycling) return undefined;
    const ex = EXAMPLES[index];
    if (phase === 'typing') {
      let typed = 0;
      let interval;
      const start = setTimeout(() => {
        interval = setInterval(() => {
          typed += 1;
          setText(ex.sentence.slice(0, typed));
          if (typed >= ex.sentence.length) {
            clearInterval(interval);
            showExample(index);
            setPhase('showing');
          }
        }, TYPE_MS);
      }, TYPE_START_MS);
      return () => {
        clearTimeout(start);
        clearInterval(interval);
      };
    }
    if (phase === 'showing') {
      const timer = setTimeout(() => {
        setClearing(true);
        setPhase('clearing');
      }, BUILD_MS + DWELL_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setClearing(false);
      setResult(null);
      setText('');
      setIndex((i) => (i + 1) % EXAMPLES.length);
      setPhase('typing');
    }, CLEAR_MS);
    return () => clearTimeout(timer);
  }, [cycling, index, phase, cycleKey, showExample]);

  // Rotate example placeholders while the box is empty and nothing is playing.
  const showPlaceholders = text === '' && !cycling && !reduced;
  useEffect(() => {
    if (!showPlaceholders) return undefined;
    const timer = setInterval(() => setPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), PLACEHOLDER_MS);
    return () => clearInterval(timer);
  }, [showPlaceholders]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  /** Stops the auto-cycle for good, leaving the current example fully shown. */
  function stopCycling() {
    if (!cycling) return;
    setCycling(false);
    setClearing(false);
    if (phase !== 'showing') {
      setText(EXAMPLES[index].sentence);
      showExample(index);
    }
  }

  function jumpTo(i) {
    requestId.current += 1;
    clearTimeout(debounceTimer.current);
    setError('');
    setLoading(false);
    setClearing(false);
    setIndex(i);
    if (cycling) {
      setText('');
      setResult(null);
      setPhase('typing');
      setCycleKey((k) => k + 1);
    } else {
      setText(EXAMPLES[i].sentence);
      showExample(i);
    }
  }

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
      setResult({ sentence: trimmed, data, run: runCount.current, exampleKey: null });
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  function handleChange(event) {
    stopCycling();
    const value = event.target.value.slice(0, MAX_LENGTH);
    setText(value);
    clearTimeout(debounceTimer.current);
    if (value.trim()) debounceTimer.current = setTimeout(() => runPreview(value), DEBOUNCE_MS);
  }

  function handleSubmit(event) {
    event.preventDefault();
    stopCycling();
    clearTimeout(debounceTimer.current);
    runPreview(text);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
  }

  const activeKey = result ? result.exampleKey : (cycling ? EXAMPLES[index].key : null);

  return (
    <div className="lh-wrap">
      <div className={`lh-card ${clearing ? 'is-clearing' : ''}`}>
        <form className="lh-form" onSubmit={handleSubmit}>
          <label htmlFor="lh-input" className="lh-label">Describe how you use AI in one sentence.</label>
          <div className="lh-input-row">
            <textarea
              id="lh-input"
              className="lh-input"
              rows={2}
              value={text}
              maxLength={MAX_LENGTH}
              placeholder={showPlaceholders ? PLACEHOLDERS[placeholder] : ''}
              onChange={handleChange}
              onFocus={stopCycling}
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
          ? (
            <HeroChecklist
              key={result.run}
              result={result}
              onWorkThrough={onWorkThrough}
              onInteract={stopCycling}
              busy={busy}
              autoplay={cycling}
            />
          )
          : <div className="lh-result lh-result-empty" aria-hidden="true"></div>}
      </div>
      <ExampleDots activeKey={activeKey} onJump={jumpTo} />
    </div>
  );
}

export default LiveHero;
