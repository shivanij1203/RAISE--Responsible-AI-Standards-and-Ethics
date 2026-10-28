import { AnimatePresence, motion as Motion } from 'motion/react';
import { FileCheck } from 'lucide-react';
import {
  STAGES, displayCell, findingAt, rowAt, stageIndexAt, stageProgress,
} from './sceneTimeline';

/** The data table that slides out under the card, with the scanner beam. */
export function SceneScan({ example, t }) {
  const { scan } = example;
  const flagged = new Set(scan.flaggedColumns);
  const visible = stageIndexAt(t) === 2;
  const sweep = Math.max(0, Math.min(1, (t - rowAt(0) + 200) / (rowAt(scan.rows.length) - rowAt(0))));

  return (
    <AnimatePresence>
      {visible && (
        <Motion.div
          key={`${example.key}-scan`}
          className="hsc-scan"
          initial={{ opacity: 0, y: -28, scaleY: 0.6 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        >
          <div className="hsc-table">
            <table>
              <thead>
                <tr>{scan.columns.map((c) => <th key={c} className={flagged.has(c) ? 'is-flagged' : ''}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {scan.rows.map((row, r) => (
                  <tr key={row[0]}>
                    {row.map((cell, c) => (
                      <td
                        key={scan.columns[c]}
                        className={flagged.has(scan.columns[c]) && t >= rowAt(r) ? 'is-lit' : ''}
                      >
                        {displayCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sweep < 1 && <span className="hsc-beam" style={{ top: `${sweep * 100}%` }} aria-hidden="true" />}
          </div>
          <AnimatePresence>
            {t >= findingAt(scan.rows.length) && (
              <Motion.p key="finding" className="hsc-finding" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {scan.finding}
              </Motion.p>
            )}
          </AnimatePresence>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

/** Saved records pile up in the corner as each card finishes. */
export function SceneStack({ saved }) {
  return (
    <div className="hsc-stack" aria-hidden="true">
      <span className="hsc-stack-label">Saved records</span>
      <div className="hsc-stack-pile">
        {saved.length === 0 && <span className="hsc-stack-empty" />}
        <AnimatePresence initial={false}>
          {saved.map((item, i) => (
            <Motion.span
              key={item.id}
              className="hsc-stack-doc"
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: (i - 1) * 4 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: i }}
            >
              <FileCheck size={13} aria-hidden="true" />
              {item.title}
            </Motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Describe · Check · Scan · Record, in sync with the scene. */
export function StageIndicator({ t, still }) {
  const current = stageIndexAt(t);
  return (
    <ol className="hsc-stages" aria-hidden="true">
      {STAGES.map((stage, i) => (
        <li key={stage.key} className={still || i === current ? 'is-active' : i < current ? 'is-done' : ''}>
          <span className="hsc-stage-label">{stage.label}</span>
          <span className="hsc-stage-track">
            <span
              className="hsc-stage-fill"
              style={{ transform: `scaleX(${still || i < current ? 1 : i === current ? stageProgress(t) : 0})` }}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}
