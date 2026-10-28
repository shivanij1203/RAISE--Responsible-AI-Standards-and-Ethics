import { AnimatePresence, motion as Motion } from 'motion/react';
import {
  FOLD_AT, STAMP_AT, chipsAt, dropAt, stageIndexAt, tickAt, typedCount,
} from './sceneTimeline';

const SPRING = { type: 'spring', stiffness: 140, damping: 22 };
const FADE = { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };
// Card position per stage: it slides along as it moves from stage to stage.
const POSITIONS = [{ x: -16, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -4 }, { x: 16, y: 0, rotate: -1.5 }];

function CheckBox({ ticked }) {
  return (
    <span className={`hsc-box ${ticked ? 'is-ticked' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5" /></svg>
    </span>
  );
}

/**
 * The "AI use" card, `t` ms into its cycle: a sentence that types in, a
 * checklist that unfolds, a scan summary, then a record with a stamp.
 * @param {{ example: object, t: number }} props
 */
function SceneCard({ example, t }) {
  const stage = stageIndexAt(t);
  const typed = example.sentence.slice(0, typedCount(t, example.sentence.length));
  const typing = typed.length < example.sentence.length;
  const isDoc = t >= FOLD_AT;
  const showItems = stage === 1 || stage === 3;
  const kicker = ['Your AI use', 'RAISE suggests checking', `Scanning ${example.scan.file}`, 'Working through it'][stage];

  return (
    <Motion.div
      layout
      className={`hsc-card ${isDoc ? 'is-doc' : ''} ${stage === 2 ? 'is-scan' : ''}`}
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, ...POSITIONS[stage] }}
      exit={{ opacity: 0, scale: 0.14, x: '46%', y: '-48%', rotate: 6, transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }}
      transition={SPRING}
    >
      <Motion.div layout="position" className="hsc-head">
        <span className="hsc-kicker">{isDoc ? 'AI Use Record' : kicker}</span>
        <span className="hsc-example">{example.title}</span>
      </Motion.div>

      <Motion.p layout="position" className={`hsc-sentence ${stage > 0 ? 'is-small' : ''}`}>
        &ldquo;{typed}{typing && <span className="hsc-caret" aria-hidden="true" />}{!typing && '”'}
      </Motion.p>

      <AnimatePresence initial={false}>
        {t >= chipsAt(example.sentence.length) && stage < 2 && (
          <Motion.ul key="chips" layout className="hsc-chips" {...FADE}>
            <li>{example.useLabel}</li>
            {example.tools.map((tool) => <li key={tool}>{tool}</li>)}
          </Motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout">
        {showItems && (
          <Motion.ul key="items" layout className="hsc-items" {...FADE}>
            {example.items.map((item, i) => (
              (stage === 3 || t >= dropAt(i)) && (
                <Motion.li
                  key={item.id}
                  layout
                  className="hsc-item"
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING}
                >
                  <CheckBox ticked={stage === 3 && t >= tickAt(i)} />
                  <span className="hsc-item-label">{item.label}</span>
                  {stage === 3
                    ? <span className={`hsc-status ${t >= tickAt(i) ? 'is-done' : ''}`}>{t >= tickAt(i) ? 'Addressed' : 'Open'}</span>
                    : <span className="hsc-tag">{item.tags[0]}</span>}
                </Motion.li>
              )
            ))}
          </Motion.ul>
        )}
        {stage === 2 && (
          <Motion.p key="summary" layout className="hsc-summary" {...FADE}>
            {example.itemCount} items to check · {example.highPriorityCount} high priority
          </Motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {t >= STAMP_AT && (
          <Motion.span
            key="stamp"
            className="hsc-stamp"
            initial={{ opacity: 0, scale: 1.8, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          >
            Record saved
          </Motion.span>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}

export default SceneCard;
