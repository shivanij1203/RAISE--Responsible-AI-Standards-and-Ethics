import { useEffect, useRef, useState } from 'react';
import RaiseMark from '../RaiseMark';
import HeroStage from './HeroStages';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';
import './heroAnimation.css';

const STAGES = ['Describe', 'Check', 'Scan', 'Record'];
// Milliseconds per stage; one loop is 14 seconds.
const DURATIONS = [3600, 3600, 3200, 3600];
const LAST = STAGES.length - 1;

/**
 * A looping product window that shows what RAISE does, built from the real
 * Teaching example. Pauses on hover or focus, when scrolled out of view, and
 * when the tab is hidden. With reduced motion it shows the last stage, still.
 */
function HeroAnimation() {
  const [reduced] = useState(prefersReducedMotion);
  const [stage, setStage] = useState(reduced ? LAST : 0);
  // Bumps on every stage change, so the stage remounts and its animation replays.
  const [run, setRun] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const remaining = useRef(DURATIONS[0]);
  const jumped = useRef(false);
  const rootRef = useRef(null);
  const paused = hovered || focused || offscreen || hidden;

  // One timer for the current stage. Pausing keeps the time left, so the
  // stage resumes where it stopped (its CSS animations pause with it).
  useEffect(() => {
    if (reduced || paused) return undefined;
    let fired = false;
    const start = performance.now();
    const timer = setTimeout(() => {
      fired = true;
      const next = (stage + 1) % STAGES.length;
      remaining.current = DURATIONS[next];
      setStage(next);
      setRun((r) => r + 1);
    }, remaining.current);
    return () => {
      clearTimeout(timer);
      if (!fired && !jumped.current) {
        remaining.current = Math.max(0, remaining.current - (performance.now() - start));
      }
      jumped.current = false;
    };
  }, [stage, run, paused, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting), { threshold: 0.15 });
    observer.observe(root);
    const onVisibility = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  function jumpTo(i) {
    jumped.current = true;
    remaining.current = DURATIONS[i];
    setStage(i);
    setRun((r) => r + 1);
  }

  return (
    <div
      ref={rootRef}
      className={`ha ${paused ? 'is-paused' : ''} ${reduced ? 'is-static' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
      data-stage={stage}
    >
      <div
        className="ha-window"
        role="img"
        aria-label="Example of RAISE at work: describe an AI use, see what to check, scan a data file, and keep a record."
      >
        <div className="ha-bar" aria-hidden="true">
          <RaiseMark tone="light" size={16} />
          <span className="ha-bar-title">First-pass essay grading with ChatGPT</span>
          <span className="ha-bar-note">{paused && !reduced && !offscreen ? 'Paused' : 'Sample data'}</span>
        </div>
        <div className="ha-body" aria-hidden="true">
          <HeroStage key={run} stage={stage} still={reduced} />
        </div>
      </div>
      <ol className="ha-rail">
        {STAGES.map((name, i) => {
          const state = reduced || i < stage ? 'is-done' : i === stage ? 'is-active' : '';
          return (
            <li key={name}>
              <button
                type="button"
                className={`ha-rail-step ${state}`}
                aria-current={i === stage ? 'step' : undefined}
                onClick={() => jumpTo(i)}
              >
                <span className="ha-rail-num">{i + 1}</span>
                {name}
                {i === stage && !reduced && (
                  <span key={run} className="ha-rail-fill" style={{ '--dur': `${DURATIONS[i]}ms` }} aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default HeroAnimation;
