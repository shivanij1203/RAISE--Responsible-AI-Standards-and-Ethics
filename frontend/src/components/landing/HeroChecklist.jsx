import { useState } from 'react';
import { ArrowRight, ChevronDown, ExternalLink, FileCheck2 } from 'lucide-react';

const MAX_ITEMS = 5;
const MAX_TAGS = 2;

/** High-priority items first; otherwise the checklist's own order. */
function orderItems(items) {
  return [...items.filter((i) => i.highPriority), ...items.filter((i) => !i.highPriority)];
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
        <input
          type="checkbox"
          className="hc-check"
          checked={done}
          onChange={onToggleDone}
          aria-label={`Mark "${item.label}" as addressed`}
        />
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
 * @param {{ result: { sentence: string, data: object }, onWorkThrough: (s: string) => void, busy: boolean }} props
 */
function HeroChecklist({ result, onWorkThrough, busy }) {
  const { data } = result;
  const items = orderItems(data.items);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [checked, setChecked] = useState(() => new Set());

  const shown = showAll ? items : items.slice(0, MAX_ITEMS);
  const highPriority = items.filter((i) => i.highPriority);
  const highPriorityDone = highPriority.length > 0 && highPriority.every((i) => checked.has(i.id));
  const chips = [`Use: ${data.useCaseLabel}`, ...data.tools.map((t) => `Tool: ${t}`)];
  const base = chips.length + 1;

  function toggleDone(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="lh-result">
      <ul className="lh-chips" aria-label="What RAISE detected">
        {chips.map((chip, i) => <li key={chip} className="lh-chip lh-anim" style={{ '--i': i }}>{chip}</li>)}
      </ul>
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
            onToggleOpen={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
            onToggleDone={() => toggleDone(item.id)}
          />
        ))}
      </ul>
      {items.length > MAX_ITEMS && (
        <button type="button" className="hc-more lh-anim" style={{ '--i': base + shown.length }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${items.length} items`}
        </button>
      )}
      <div className="lh-footer lh-anim" style={{ '--i': base + shown.length + 1 }}>
        <p className={`lh-record ${highPriorityDone ? 'is-complete' : ''}`} aria-live="polite">
          <FileCheck2 size={16} aria-hidden="true" />
          {highPriorityDone ? 'High-priority items addressed' : `Your record: ${checked.size} of ${items.length} addressed`}
        </p>
        <button className="lh-cta" onClick={() => onWorkThrough(result.sentence)} disabled={busy} aria-busy={busy}>
          {busy ? 'Starting…' : 'Work through this checklist'} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default HeroChecklist;
