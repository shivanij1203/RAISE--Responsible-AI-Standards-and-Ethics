import { useEffect, useRef, useState } from 'react';
import { FileCheck, ListChecks, PenLine, ScanSearch } from 'lucide-react';
import SceneView from './SceneView';
import SceneStatic from './SceneStatic';
import { useSceneClock } from './useSceneClock';
import { CYCLE_MS, STAGES, stageIndexAt } from './sceneTimeline';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const STEPS = [
  { text: 'Write one sentence about how you use AI.', Icon: PenLine },
  { text: 'See the privacy, IRB, disclosure, and fairness items that apply, with the rule behind each one.', Icon: ListChecks },
  { text: 'Scan a data file for names, emails, and student IDs before it goes anywhere.', Icon: ScanSearch },
  { text: 'Work through each item, then keep a disclosure statement and a record of what you decided.', Icon: FileCheck },
];

/**
 * How it works: the four steps on the left, the card scene on the right,
 * kept in sync. The scene starts when the section scrolls into view and
 * pauses off-screen or in a hidden tab. Clicking a step jumps to it.
 */
function HowItWorks() {
  const [reduced] = useState(prefersReducedMotion);
  // Without IntersectionObserver, run as if always on screen.
  const [onScreen, setOnScreen] = useState(() => typeof IntersectionObserver === 'undefined');
  const [tabVisible, setTabVisible] = useState(true);
  const rootRef = useRef(null);
  const running = !reduced && onScreen && tabVisible;
  const [now, seek] = useSceneClock(running);
  const t = now % CYCLE_MS;
  const active = reduced ? -1 : stageIndexAt(t);

  useEffect(() => {
    const root = rootRef.current;
    const onVisibility = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    let observer;
    if (root && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
      observer.observe(root);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, []);

  function jumpTo(i) {
    if (reduced) return;
    seek(now - t + STAGES[i].start);
  }

  return (
    <section className="lp-band hiw" id="how" aria-labelledby="how-title" ref={rootRef}>
      <div className="lp-band-inner hiw-grid">
        <div className="hiw-text">
          <h2 className="lp-band-title" id="how-title">How it works</h2>
          <ol className="hiw-steps">
            {STEPS.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <li key={STAGES[i].key}>
                  <button
                    type="button"
                    className={`hiw-step ${active === i ? 'is-active' : ''}`}
                    aria-current={active === i ? 'step' : undefined}
                    onClick={() => jumpTo(i)}
                  >
                    <span className="hiw-icon" aria-hidden="true"><StepIcon size={18} strokeWidth={1.75} /></span>
                    <span className="hiw-name">{i + 1}. {STAGES[i].label}</span>
                    <span className="hiw-desc">{step.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="hiw-scene">
          {reduced ? <SceneStatic /> : <SceneView now={now} />}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
