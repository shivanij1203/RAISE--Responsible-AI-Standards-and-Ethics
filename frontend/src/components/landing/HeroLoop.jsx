import { useEffect, useRef, useState } from 'react';
import { FileCheck, ListChecks, PenLine, ScanSearch } from 'lucide-react';
import RaiseMark from '../RaiseMark';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';
import './heroLoop.css';

const STEPS = [
  { title: 'Describe', text: 'One sentence about your AI use', Icon: PenLine },
  { title: 'Check', text: 'FERPA, IRB, disclosure, fairness', Icon: ListChecks },
  { title: 'Scan', text: 'Flags names, emails, and IDs', Icon: ScanSearch },
  { title: 'Record', text: 'Disclosure statement and AI use record', Icon: FileCheck },
];

// Node centers in the diagram's 440 x 400 viewBox, clockwise from top left.
const NODES = [[90, 70], [350, 70], [350, 280], [90, 280]];
const STEP_MS = 2000;
// Part of each step the dot rests on its node before travelling on.
const REST = 0.3;

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Where the dot is, and which node is lit, `elapsed` ms into the loop. */
function positionAt(elapsed) {
  const step = Math.floor(elapsed / STEP_MS) % STEPS.length;
  const t = (elapsed % STEP_MS) / STEP_MS;
  const [x1, y1] = NODES[step];
  const [x2, y2] = NODES[(step + 1) % NODES.length];
  if (t < REST) return { step, x: x1, y: y1 };
  const k = ease((t - REST) / (1 - REST));
  // The dot is on its way to the next node; light that one once it lands.
  return { step, x: x1 + (x2 - x1) * k, y: y1 + (y2 - y1) * k };
}

function StepContent({ step }) {
  const StepIcon = step.Icon;
  return (
    <>
      <span className="hl-icon"><StepIcon size={22} strokeWidth={1.75} aria-hidden="true" /></span>
      <span className="hl-title">{step.title}</span>
      <span className="hl-text">{step.text}</span>
    </>
  );
}

/**
 * How RAISE works, as a loop: Describe, Check, Scan, Record, and back.
 * Every node is always visible; the moving dot and highlight only add
 * emphasis. Runs while on screen and the tab is visible; stops with reduced
 * motion. Phones get a vertical list with the same highlight.
 */
function HeroLoop() {
  const [reduced] = useState(prefersReducedMotion);
  const [active, setActive] = useState(reduced ? -1 : 0);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const elapsed = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const onVisibility = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    let observer;
    if (root && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
      observer.observe(root);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, []);

  // One animation-frame loop moves the dot and picks the lit node. It only
  // runs while the diagram is on screen and the tab is visible.
  useEffect(() => {
    if (reduced || !visible || !tabVisible) return undefined;
    let frame;
    let last = null;
    const tick = (now) => {
      // Frame timestamps can start slightly before this effect ran, so time
      // starts at the first frame and never runs backwards.
      if (last !== null) elapsed.current += Math.max(0, now - last);
      last = now;
      const { step, x, y } = positionAt(elapsed.current);
      dotRef.current?.setAttribute('transform', `translate(${x} ${y})`);
      setActive((cur) => (cur === step ? cur : step));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, visible, tabVisible]);

  return (
    <div
      ref={rootRef}
      className={`hl ${reduced ? 'is-static' : ''}`}
      data-running={!reduced && visible && tabVisible ? 'true' : 'false'}
    >
      <p className="hl-kicker">How RAISE works</p>

      {/* Wide screens: four nodes in a loop around the mark. */}
      <div className="hl-diagram">
        <svg className="hl-svg" viewBox="0 0 440 400" aria-hidden="true">
          <defs>
            <marker id="hl-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M1 1 L9 5 L1 9 z" />
            </marker>
            <radialGradient id="hl-glow">
              <stop offset="0" stopColor="#E3A23C" stopOpacity="0.55" />
              <stop offset="1" stopColor="#E3A23C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path className="hl-track" d="M90 70 H350 V280 H90 Z" />
          {/* Arrows at the middle of each side, in loop order. */}
          <path className="hl-arrow" d="M210 70 H230" markerEnd="url(#hl-arrow)" />
          <path className="hl-arrow" d="M350 168 V188" markerEnd="url(#hl-arrow)" />
          <path className="hl-arrow" d="M230 280 H210" markerEnd="url(#hl-arrow)" />
          <path className="hl-arrow" d="M90 188 V168" markerEnd="url(#hl-arrow)" />
          {!reduced && (
            <g ref={dotRef} className="hl-dot" transform={`translate(${NODES[0][0]} ${NODES[0][1]})`}>
              <circle r="16" fill="url(#hl-glow)" />
              <circle r="5.5" />
            </g>
          )}
        </svg>
        <div className="hl-center">
          <RaiseMark tone="light" size={40} />
          <span>RAISE</span>
        </div>
        <ol className="hl-nodes">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={`hl-node hl-node-${i} ${active === i ? 'is-active' : ''}`}
              aria-current={active === i ? 'step' : undefined}
            >
              <StepContent step={step} />
            </li>
          ))}
        </ol>
      </div>

      {/* Phones: the same steps as a vertical list with a return arrow. */}
      <ol className="hl-list" aria-hidden="true">
        {STEPS.map((step, i) => (
          <li key={step.title} className={`hl-row ${active === i ? 'is-active' : ''}`}>
            <StepContent step={step} />
          </li>
        ))}
      </ol>
      <p className="hl-return">Back to Describe for your next AI use</p>
    </div>
  );
}

export default HeroLoop;
