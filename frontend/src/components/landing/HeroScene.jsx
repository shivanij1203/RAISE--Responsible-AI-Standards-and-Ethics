import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import SceneCard from './SceneCard';
import HeroSceneStatic from './HeroSceneStatic';
import { SceneScan, SceneStack, StageIndicator } from './SceneParts';
import { CYCLE_MS, SCENE_EXAMPLES } from './sceneTimeline';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';
import './heroScene.css';

const PUSH_MS = 40;
const STACK_SIZE = 3;

/**
 * Elapsed scene time in ms. Advances on animation frames only while
 * `running`, so pausing freezes the whole scene where it is.
 */
function useSceneClock(running) {
  const [now, setNow] = useState(0);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!running) return undefined;
    let frame;
    let last = null;
    let pushed = elapsed.current;
    const tick = (ts) => {
      if (last !== null) elapsed.current += Math.max(0, ts - last);
      last = ts;
      if (elapsed.current - pushed >= PUSH_MS) {
        pushed = elapsed.current;
        setNow(elapsed.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  return now;
}

/**
 * The hero scene: one "AI use" card goes from a sentence, to a checklist,
 * under a scanner, to a saved record, then the next example begins. A card
 * is always on screen. Pauses off-screen or in a hidden tab, not on hover.
 */
function HeroScene() {
  const [reduced] = useState(prefersReducedMotion);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const rootRef = useRef(null);
  const running = !reduced && onScreen && tabVisible;
  const now = useSceneClock(running);

  useEffect(() => {
    const root = rootRef.current;
    const onVisibility = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    let observer;
    if (root && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
      observer.observe(root);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, []);

  if (reduced) return <HeroSceneStatic />;

  const cycle = Math.floor(now / CYCLE_MS);
  const t = now % CYCLE_MS;
  const example = SCENE_EXAMPLES[cycle % SCENE_EXAMPLES.length];
  const saved = [];
  for (let k = Math.max(0, cycle - STACK_SIZE); k < cycle; k += 1) {
    saved.push({ id: k, title: SCENE_EXAMPLES[k % SCENE_EXAMPLES.length].title });
  }

  return (
    <div
      ref={rootRef}
      className="hsc"
      data-running={running ? 'true' : 'false'}
      role="img"
      aria-label="How RAISE works: describe an AI use in one sentence, see what to check, scan your data, and keep a record. Shown with the Teaching, Research, and Administration examples."
    >
      <div className="hsc-scene">
        <SceneStack saved={saved} />
        <div className="hsc-stage-area">
          <AnimatePresence mode="popLayout" initial={false}>
            <SceneCard key={cycle} example={example} t={t} />
          </AnimatePresence>
          <SceneScan example={example} t={t} />
        </div>
      </div>
      <StageIndicator t={t} still={false} />
    </div>
  );
}

export default HeroScene;
