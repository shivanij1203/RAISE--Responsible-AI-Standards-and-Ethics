import { AnimatePresence } from 'motion/react';
import SceneCard from './SceneCard';
import { SceneScan, SceneStack, StageIndicator } from './SceneParts';
import { CYCLE_MS, SCENE_EXAMPLES } from './sceneTimeline';
import './scene.css';

const STACK_SIZE = 3;

/**
 * The card scene at scene time `now`: one "AI use" card goes from a
 * sentence, to a checklist, under a scanner, to a saved record, then the
 * next example begins. A card is always on screen.
 * @param {{ now: number }} props
 */
function SceneView({ now }) {
  const cycle = Math.floor(now / CYCLE_MS);
  const t = now % CYCLE_MS;
  const example = SCENE_EXAMPLES[cycle % SCENE_EXAMPLES.length];
  const saved = [];
  for (let k = Math.max(0, cycle - STACK_SIZE); k < cycle; k += 1) {
    saved.push({ id: k, title: SCENE_EXAMPLES[k % SCENE_EXAMPLES.length].title });
  }

  return (
    <div
      className="hsc"
      role="img"
      aria-label="RAISE at work: describe an AI use in one sentence, see what to check, scan your data, and keep a record. Shown with the Teaching, Research, and Administration examples."
    >
      <div className="hsc-scene">
        <div className="hsc-stage-area">
          <AnimatePresence mode="popLayout" initial={false}>
            <SceneCard key={cycle} example={example} t={t} />
          </AnimatePresence>
          <SceneScan example={example} t={t} />
        </div>
      </div>
      <SceneStack saved={saved} />
      <StageIndicator t={t} still={false} />
    </div>
  );
}

export default SceneView;
