import { SCENE_EXAMPLES, STAGES, displayCell } from './sceneTimeline';

const EXAMPLE = SCENE_EXAMPLES[0];
const FLAGGED = new Set(EXAMPLE.scan.flaggedColumns);

/** Reduced motion: the four stages side by side, still, with real Teaching output. */
function SceneStatic() {
  return (
    <div className="hsc hsc-static" role="img" aria-label="How RAISE works: describe, check, scan, and record, shown with the Teaching example.">
      <ol className="hss-grid">
        <li className="hss-panel">
          <span className="hss-step">1 · {STAGES[0].label}</span>
          <p className="hss-sentence">&ldquo;{EXAMPLE.sentence}&rdquo;</p>
          <ul className="hsc-chips">
            <li>{EXAMPLE.useLabel}</li>
            {EXAMPLE.tools.map((tool) => <li key={tool}>{tool}</li>)}
          </ul>
        </li>
        <li className="hss-panel">
          <span className="hss-step">2 · {STAGES[1].label}</span>
          <p className="hsc-answer">{EXAMPLE.headline}</p>
          <ul className="hss-list">
            {EXAMPLE.items.slice(0, 3).map((item) => (
              <li key={item.id}><span>{item.label}</span><span className="hsc-tag">{item.tags[0]}</span></li>
            ))}
          </ul>
        </li>
        <li className="hss-panel">
          <span className="hss-step">3 · {STAGES[2].label}</span>
          <div className="hsc-table">
            <table>
              <tbody>
                {EXAMPLE.scan.rows.slice(0, 3).map((row) => (
                  <tr key={row[0]}>
                    {row.slice(0, 3).map((cell, c) => (
                      <td key={EXAMPLE.scan.columns[c]} className={FLAGGED.has(EXAMPLE.scan.columns[c]) ? 'is-lit' : ''}>{displayCell(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hss-finding">{EXAMPLE.scan.finding}</p>
        </li>
        <li className="hss-panel">
          <span className="hss-step">4 · {STAGES[3].label}</span>
          <div className="hss-doc">
            <p className="hss-doc-title">AI Use Record</p>
            {EXAMPLE.items.slice(0, 3).map((item) => (
              <p key={item.id} className="hss-doc-row"><span>{item.label}</span><span>Addressed</span></p>
            ))}
            <span className="hsc-stamp hss-stamp">Record saved</span>
          </div>
        </li>
      </ol>
    </div>
  );
}

export default SceneStatic;
