import { useEffect, useRef, useState } from 'react';
import { FileText, ListChecks, PenLine, ScanSearch } from 'lucide-react';
import RaiseMark from '../RaiseMark';
import TourScene from './TourScenes';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';
import './tour.css';

const STEPS = [
  { title: 'Describe', text: 'Write one sentence about how you use AI. RAISE picks out the kind of use and the tool.', Icon: PenLine },
  { title: 'See what applies', text: 'RAISE lists what to check, marks the high-priority items, and names the rule behind each one.', Icon: ListChecks },
  { title: 'Scan your data', text: 'Scan a data file. RAISE flags columns with names, email addresses, and student IDs, and says what it found.', Icon: ScanSearch },
  { title: 'Keep the record', text: 'Copy a disclosure statement and export a record of what you reviewed and decided.', Icon: FileText },
];

/**
 * "See it work": text steps on the left, a sticky product window on the
 * right that changes as each step reaches the middle of the screen. The page
 * scrolls normally. Phones show each step's final state inline instead.
 */
function ProductTour() {
  const [active, setActive] = useState(0);
  const [reached, setReached] = useState(() => new Set());
  const [reduced] = useState(prefersReducedMotion);
  const stepRefs = useRef([]);

  // The active step is the last one whose top has passed the middle of the
  // screen. Reading scroll position (not an observer band) means a fast
  // scroll or a jump still lands on the right step.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let index = 0;
      stepRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < middle) index = i;
      });
      const first = stepRefs.current[0];
      const started = first && first.getBoundingClientRect().top < window.innerHeight * 0.75;
      setActive(index);
      if (started) setReached((prev) => (prev.has(index) ? prev : new Set([...prev, index])));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const current = STEPS[active];

  return (
    <section className="tour" aria-labelledby="tour-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title reveal" id="tour-title">See it work</h2>
        <p className="tour-intro reveal">
          Faculty already use AI to grade and analyze research data. The rules that apply are
          spread across separate policies and offices. RAISE turns them into one checklist for
          each use and keeps a record of what you decided.
        </p>
        <div className="tour-grid">
          <ol className="tour-steps">
            {STEPS.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <li
                  key={step.title}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  data-step={i}
                  className={`tour-step ${active === i ? 'is-active' : ''}`}
                >
                  <div className="tour-step-text">
                    <span className="tour-step-num"><StepIcon size={18} strokeWidth={1.75} aria-hidden="true" /> Step {i + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                  <div className="tour-inline" aria-hidden="true">
                    <TourScene step={i} final />
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="tour-window-col" aria-hidden="true">
            <div className="tour-window">
              <div className="tour-window-bar">
                <RaiseMark tone="light" size={18} />
                <span className="tour-window-title">First-pass essay grading with ChatGPT</span>
                <span className="tour-window-step">Step {active + 1} of {STEPS.length} · {current.title}</span>
              </div>
              <div className="tour-window-body">
                {STEPS.map((step, i) => (
                  <div key={step.title} className={`tour-stage ${active === i ? 'is-active' : ''}`}>
                    <TourScene step={i} play={reached.has(i)} final={reduced} />
                  </div>
                ))}
              </div>
              <p className="tour-window-note">Sample data. Nothing here is real student information.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductTour;
