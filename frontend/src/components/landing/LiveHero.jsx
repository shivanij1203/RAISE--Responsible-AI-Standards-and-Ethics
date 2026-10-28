import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, FileCheck2, ListChecks } from 'lucide-react';
import { previewChecklist } from '../../services/api';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const TEACHING_SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
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
const MAX_ITEMS = 5;
const MAX_TAGS = 2;

/** High-priority items first; otherwise the checklist's own order. */
function orderItems(items) {
  return [...items.filter((i) => i.highPriority), ...items.filter((i) => !i.highPriority)];
}

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 429) return 'You have tried a lot of sentences. Try again in an hour, or pick an example below.';
  if (status === 400) return err.response?.data?.error || 'Write one sentence about how you use AI.';
  return 'We could not reach RAISE just now. Please try again.';
}

function PreviewResult({ result, onWorkThrough, busy }) {
  const { data } = result;
  const items = orderItems(data.items);
  const shown = items.slice(0, MAX_ITEMS);
  const chips = [`Use: ${data.useCaseLabel}`, ...data.tools.map((t) => `Tool: ${t}`)];
  const recordIndex = chips.length + shown.length + 1;

  return (
    <div className="lh-result" aria-live="polite">
      <ul className="lh-chips" aria-label="What RAISE detected">
        {chips.map((chip, i) => (
          <li key={chip} className="lh-chip lh-anim" style={{ '--i': i }}>{chip}</li>
        ))}
      </ul>
      <p className="lh-kicker lh-anim" style={{ '--i': chips.length }}>
        RAISE suggests checking {data.items.length} items
      </p>
      <ul className="lh-items">
        {shown.map((item, i) => (
          <li key={item.id} className="lh-item lh-anim" style={{ '--i': chips.length + 1 + i }}>
            <span className="lh-box" aria-hidden="true"></span>
            <span className="lh-item-label">
              {item.label}
              {item.highPriority && <span className="lh-priority">High priority</span>}
            </span>
            <span className="lh-tags">
              {item.tags.slice(0, MAX_TAGS).map((tag) => <span key={tag} className="lh-tag">{tag}</span>)}
            </span>
          </li>
        ))}
      </ul>
      {items.length > shown.length && (
        <p className="lh-more lh-anim" style={{ '--i': recordIndex - 1 }}>
          +{items.length - shown.length} more in the full checklist
        </p>
      )}
      <div className="lh-footer lh-anim" style={{ '--i': recordIndex }}>
        <span className="lh-record"><FileCheck2 size={16} aria-hidden="true" /> Your record: what you reviewed and decided</span>
        <button className="lh-cta" onClick={() => onWorkThrough(result.sentence)} disabled={busy} aria-busy={busy}>
          {busy ? 'Starting…' : 'Work through this checklist'} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
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

  // First load: type the Teaching sentence in once, then show its checklist.
  useEffect(() => {
    if (prefersReducedMotion()) {
      autoplaying.current = false;
      setText(TEACHING_SENTENCE);
      runPreview(TEACHING_SENTENCE);
      return undefined;
    }
    let typed = 0;
    let timer;
    const tick = () => {
      if (!autoplaying.current) return;
      typed += 1;
      setText(TEACHING_SENTENCE.slice(0, typed));
      if (typed < TEACHING_SENTENCE.length) {
        timer = setTimeout(tick, TYPE_MS);
      } else {
        autoplaying.current = false;
        runPreview(TEACHING_SENTENCE);
      }
    };
    timer = setTimeout(tick, TYPE_START_MS);
    return () => clearTimeout(timer);
  }, [runPreview]);

  // Rotate example placeholders while the box is empty.
  const isEmpty = text === '';
  useEffect(() => {
    if (!isEmpty || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => setPlaceholder((i) => (i + 1) % PLACEHOLDERS.length), PLACEHOLDER_MS);
    return () => clearInterval(timer);
  }, [isEmpty]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function stopAutoplay() {
    if (!autoplaying.current) return;
    autoplaying.current = false;
    setText(TEACHING_SENTENCE);
    runPreview(TEACHING_SENTENCE);
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
            onFocus={stopAutoplay}
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
        ? <PreviewResult key={result.run} result={result} onWorkThrough={onWorkThrough} busy={busy} />
        : <div className="lh-result lh-result-empty" aria-hidden="true"></div>}
    </div>
  );
}

export default LiveHero;
