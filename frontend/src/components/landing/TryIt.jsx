import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, FlaskConical, GraduationCap, ListChecks } from 'lucide-react';
import HeroChecklist from './HeroChecklist';
import { previewChecklist } from '../../services/api';
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const ICONS = { teaching: GraduationCap, research: FlaskConical, administration: Building2 };
// The three examples with checklists generated from the real rules
// (export_landing_examples), so showing one needs no request.
const EXAMPLES = DEMO_EXAMPLES.map((ex) => ({ ...ex, preview: landingData.examplePreviews[ex.key] }));
const MAX_LENGTH = 300;
const COUNTER_FROM = 240;
const DEBOUNCE_MS = 600;
const TYPE_MS = 24;
const TYPE_START_MS = 400;
// Time for the chips, items, and record count-up to finish, then the hold.
const BUILD_MS = 2600;
const HOLD_MS = 5000;
const CLEAR_MS = 400;

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 429) return 'You have tried a lot of sentences. Try again in an hour, or pick an example.';
  if (status === 400) return err.response?.data?.error || 'Write one sentence about how you use AI.';
  return 'We could not reach RAISE just now. Please try again.';
}

/**
 * "Check your own AI use": example chips, the sentence box, and the live
 * checklist. Until the visitor interacts it cycles through the examples;
 * focusing the box, choosing an example, opening an item, or ticking a box
 * stops it for good.
 * @param {{
 *   onWorkThrough: (sentence: string) => void,
 *   onStartExample: (example: object) => void,
 *   busyKey: string | null,
 *   inputId: string,
 * }} props
 */
function TryIt({ onWorkThrough, onStartExample, busyKey, inputId }) {
  const [reduced] = useState(prefersReducedMotion);
  const runCount = useRef(1);
  const [cycling, setCycling] = useState(!reduced);
  const [onScreen, setOnScreen] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState(reduced ? 'showing' : 'typing');
  const [clearing, setClearing] = useState(false);
  const [text, setText] = useState(reduced ? EXAMPLES[0].sentence : '');
  const [result, setResult] = useState(reduced
    ? { sentence: EXAMPLES[0].sentence, data: EXAMPLES[0].preview, run: 1, exampleKey: EXAMPLES[0].key }
    : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const debounceTimer = useRef(null);
  const rootRef = useRef(null);
  // Mirrors `cycling` synchronously, so a typing tick that fires between
  // stopping and the next render cannot write into the box.
  const cyclingRef = useRef(!reduced);
  // The focus that stops the cycle selects the example; a click's mouseup
  // would otherwise collapse that selection into a caret.
  const keepSelection = useRef(false);
  // The example put in the box when the cycle stopped. For a moment, an edit
  // that arrives as that example plus new text replaces it instead (a fast
  // paste or keystroke can land before the select-all does).
  const replacedExample = useRef(null);

  const showExample = useCallback((i) => {
    runCount.current += 1;
    const ex = EXAMPLES[i];
    setResult({ sentence: ex.sentence, data: ex.preview, run: runCount.current, exampleKey: ex.key });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // The auto-cycle: type, show, hold, clear, next. It only runs on screen,
  // and every state change happens inside a timer.
  useEffect(() => {
    if (!cycling || !onScreen) return undefined;
    const ex = EXAMPLES[index];
    if (phase === 'typing') {
      let typed = 0;
      let interval;
      const start = setTimeout(() => {
        interval = setInterval(() => {
          if (!cyclingRef.current) return;
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
      }, BUILD_MS + HOLD_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setClearing(false);
      setText('');
      // Clear the old checklist too; the next example's placeholder holds the space.
      setResult(null);
      setIndex((i) => (i + 1) % EXAMPLES.length);
      setPhase('typing');
    }, CLEAR_MS);
    return () => clearTimeout(timer);
  }, [cycling, onScreen, index, phase, showExample]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  /** Stops the auto-cycle for good, leaving the current example fully shown. */
  function stopCycling() {
    if (!cycling) return;
    cyclingRef.current = false;
    setCycling(false);
    setClearing(false);
    if (phase !== 'showing' || !result) {
      setText(EXAMPLES[index].sentence);
      showExample(index);
    }
  }

  function chooseExample(i) {
    cyclingRef.current = false;
    setCycling(false);
    setClearing(false);
    requestId.current += 1;
    clearTimeout(debounceTimer.current);
    setError('');
    setLoading(false);
    setIndex(i);
    setText(EXAMPLES[i].sentence);
    showExample(i);
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
    let value = event.target.value;
    const example = replacedExample.current;
    replacedExample.current = null;
    if (example && value.length > example.length && value.startsWith(example)) {
      value = value.slice(example.length);
    }
    value = value.slice(0, MAX_LENGTH);
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

  /**
   * Focusing the box mid-cycle stops it and selects the example text, so
   * typing replaces it. The checklist stays until the visitor types. Later
   * clicks place the cursor normally.
   */
  function handleFocus(event) {
    if (!cycling) return;
    const input = event.currentTarget;
    stopCycling();
    keepSelection.current = true;
    replacedExample.current = EXAMPLES[index].sentence;
    // Only the mouseup of this same click; a keyboard focus has none.
    setTimeout(() => {
      keepSelection.current = false;
      replacedExample.current = null;
    }, 500);
    // After React writes the full example into the box.
    requestAnimationFrame(() => input.select());
  }

  function handleMouseUp(event) {
    if (!keepSelection.current) return;
    keepSelection.current = false;
    event.preventDefault();
    event.currentTarget.select();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) handleSubmit(event);
  }

  const activeKey = result ? result.exampleKey : (cycling ? EXAMPLES[index].key : null);
  const activeExample = EXAMPLES.find((ex) => ex.key === activeKey);

  return (
    <div className="ti" ref={rootRef}>
      <div className="ti-chips" role="group" aria-label="Examples">
        <span className="ti-chips-label">Start from an example</span>
        {EXAMPLES.map((ex, i) => {
          const Icon = ICONS[ex.key];
          return (
            <button
              key={ex.key}
              type="button"
              className={`ti-chip ${activeKey === ex.key ? 'is-active' : ''}`}
              aria-pressed={activeKey === ex.key}
              onClick={() => chooseExample(i)}
            >
              {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
              {ex.title}
            </button>
          );
        })}
      </div>

      <div className={`lh-card ${clearing ? 'is-clearing' : ''}`}>
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
              onFocus={handleFocus}
              onMouseUp={handleMouseUp}
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
              busy={busyKey === 'custom'}
              // While a new sentence's checklist loads, the one on screen is
              // out of date: don't let it start a session.
              stale={loading}
              autoplay={cycling}
            />
          )
          : (
            // While an example types in, hold the space its checklist will
            // take (chips, items, record chip, buttons) so the card never jumps.
            <div className="lh-ghost" aria-hidden="true" inert>
              <HeroChecklist
                result={{ sentence: EXAMPLES[index].sentence, data: EXAMPLES[index].preview, run: 0 }}
                onWorkThrough={() => {}}
                onInteract={() => {}}
                busy={false}
                autoplay={false}
              />
            </div>
          )}
        {activeExample && (
          <button
            type="button"
            className="ti-demo"
            onClick={() => onStartExample(activeExample)}
            disabled={busyKey !== null}
            aria-busy={busyKey === activeExample.key}
          >
            {busyKey === activeExample.key ? 'Starting…' : `Start the full ${activeExample.title} demo`}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default TryIt;
