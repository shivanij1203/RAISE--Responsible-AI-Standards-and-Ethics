import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, ExternalLink, FileCheck2 } from 'lucide-react';

const MAX_ITEMS = 5;
const MAX_TAGS = 2;
const STAGGER_MS = 120;
const COUNT_STEP_MS = 110;

/** High-priority items first; otherwise the checklist's own order. */
function orderItems(items) {
  return [...items.filter((i) => i.highPriority), ...items.filter((i) => !i.highPriority)];
}

/** Counts from 0 to `target` after `delayMs` while `animate`; shows `target` once it stops. */
function useCountUp(target, animate, delayMs) {
  const [count, setCount] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) return undefined;
    let current = 0;
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        current += 1;
        setCount(current);
        if (current >= target) clearInterval(interval);
      }, COUNT_STEP_MS);
    }, delayMs);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [target, animate, delayMs]);
  return animate ? count : target;
}

function Sources({ sources }) {
  return (
    <ul className="hc-sources">
      {sources.map((s) => (
        <li key={s.name}>
          {s.url
            ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} <ExternalLink size={12} aria-hidden="true" /></a>
            : <span>{s.name}</span>}
        </li>
      ))}
    </ul>
  );
}

function ChecklistItem({ item, index, open, done, onToggleOpen, onToggleDone }) {
  const panelId = `hc-panel-${item.id}`;
  return (
    <li className={`hc-item lh-anim ${open ? 'is-open' : ''} ${done ? 'is-done' : ''}`} style={{ '--i': index }}>
      <div className="hc-row">
        <label className="hc-checkwrap">
          <input
            type="checkbox"
            className="hc-check-input"
            checked={done}
            onChange={onToggleDone}
            aria-label={`Mark "${item.label}" as addressed`}
          />
          <span className="hc-checkbox" aria-hidden="true">
            <svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5" /></svg>
          </span>
        </label>
        <button type="button" className="hc-toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggleOpen}>
          <span className="hc-label">
            {item.label}
            {item.highPriority && <span className="lh-priority">High priority</span>}
          </span>
          <ChevronDown className="hc-chevron" size={16} aria-hidden="true" />
        </button>
        <span className="lh-tags">
          {item.tags.slice(0, MAX_TAGS).map((tag) => <span key={tag} className="lh-tag">{tag}</span>)}
        </span>
      </div>
      <div className="hc-panel" id={panelId} inert={!open}>
        <div className="hc-panel-inner">
          <dl className="hc-details">
            <dt>What</dt><dd>{item.what}</dd>
            <dt>Why</dt><dd>{item.why}</dd>
            <dt>How</dt><dd>{item.how}</dd>
            {item.sources.length > 0 && (<><dt>Sources</dt><dd><Sources sources={item.sources} /></dd></>)}
          </dl>
        </div>
      </div>
    </li>
  );
}

/**
 * The checklist for one sentence. Items expand to show what, why, and how;
 * ticking one marks it addressed in this browser only (nothing is saved).
 * @param {{
 *   result: { sentence: string, data: object },
 *   onWorkThrough: (s: string) => void,
 *   onInteract: () => void,
 *   busy: boolean,
 *   stale?: boolean,
 *   autoplay: boolean,
 * }} props
 */
function HeroChecklist({ result, onWorkThrough, onInteract, busy, autoplay, stale = false }) {
  const { data } = result;
  const items = orderItems(data.items);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  // Bumps on every tick or untick, so the record chip pulses once per change.
  const [changes, setChanges] = useState(0);

  const shown = showAll ? items : items.slice(0, MAX_ITEMS);
  const chips = [`Use: ${data.useCaseLabel}`, ...data.tools.map((t) => `Tool: ${t}`)];
  const base = chips.length + 1;
  const footerIndex = base + shown.length + 1;
  const total = useCountUp(items.length, autoplay, footerIndex * STAGGER_MS);
  const highPriority = items.filter((i) => i.highPriority);
  const highPriorityDone = highPriority.length > 0 && highPriority.every((i) => checked.has(i.id));

  function toggleDone(id) {
    onInteract();
    setChanges((n) => n + 1);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleOpen(id) {
    onInteract();
    setOpenId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="lh-result">
      <ul className="lh-chips" aria-label="What RAISE detected">
        {chips.map((chip, i) => <li key={chip} className="lh-chip lh-anim" style={{ '--i': i }}>{chip}</li>)}
      </ul>
      {data.shortAnswer && (
        <p className="lh-answer lh-anim" style={{ '--i': chips.length }}>
          <span className="lh-answer-label">The short answer:</span>{' '}
          <strong>{data.shortAnswer.headline}</strong>
        </p>
      )}
      <p className="lh-kicker lh-anim" style={{ '--i': chips.length }}>
        RAISE suggests checking {items.length} items. Open one to see why.
      </p>
      <ul className="lh-items hc-items">
        {shown.map((item, i) => (
          <ChecklistItem
            key={item.id}
            item={item}
            index={base + i}
            open={openId === item.id}
            done={checked.has(item.id)}
            onToggleOpen={() => toggleOpen(item.id)}
            onToggleDone={() => toggleDone(item.id)}
          />
        ))}
      </ul>
      {items.length > MAX_ITEMS && (
        <button
          type="button"
          className="hc-more lh-anim"
          style={{ '--i': base + shown.length }}
          onClick={() => { onInteract(); setShowAll((v) => !v); }}
        >
          {showAll ? 'Show fewer' : `Show all ${items.length} items`}
        </button>
      )}
      <div className="lh-footer lh-anim" style={{ '--i': footerIndex }}>
        {/* The live region stays mounted; the chip inside remounts to pulse. */}
        <div aria-live="polite">
          <p
            key={changes}
            className={`lh-record ${highPriorityDone ? 'is-complete' : ''} ${changes > 0 ? 'is-pulsing' : ''}`}
          >
            <FileCheck2 size={16} aria-hidden="true" />
            {highPriorityDone ? 'High-priority items addressed' : `Your record: ${checked.size} of ${total} addressed`}
          </p>
        </div>
        <button className="lh-cta" onClick={() => onWorkThrough(result.sentence)} disabled={busy || stale} aria-busy={busy}>
          {busy ? 'Starting…' : 'Work through this checklist'} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default HeroChecklist;
