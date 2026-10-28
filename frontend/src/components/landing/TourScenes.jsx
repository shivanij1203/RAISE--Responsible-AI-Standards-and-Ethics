import { useEffect, useState } from 'react';
import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { DisclosureDoc, RecordDoc } from './OutputDocs';

const SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
const PREVIEW = landingData.teachingPreview;
const SCAN = landingData.scanTour;
const ITEMS = [...PREVIEW.items.filter((i) => i.highPriority), ...PREVIEW.items.filter((i) => !i.highPriority)];
const TYPE_MS = 24;
const MAX_TAGS = 2;

// The sample file uses made-up addresses; the tour shows only the part before @.
function displayCell(value) {
  return value.includes('@') ? `${value.split('@')[0]}@…` : value;
}

/** Types the sentence once when `play` turns on; shows it in full when `final`. */
function useTyped(text, play, final) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (final || !play) return undefined;
    let typed = 0;
    const timer = setInterval(() => {
      typed += 1;
      setCount(typed);
      if (typed >= text.length) clearInterval(timer);
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text, play, final]);
  return final ? text : text.slice(0, count);
}

function DescribeScene({ play, final }) {
  const typed = useTyped(SENTENCE, play, final);
  const done = typed.length === SENTENCE.length;
  return (
    <div className="ts-describe">
      <p className="ts-label">Describe how you use AI in one sentence.</p>
      <div className="ts-input">
        {typed}
        {!done && <span className="ts-caret" aria-hidden="true"></span>}
      </div>
      <ul className={`ts-chips ${done ? 'is-done' : ''}`}>
        <li>Use: {PREVIEW.useCaseLabel}</li>
        {PREVIEW.tools.map((t) => <li key={t}>Tool: {t}</li>)}
      </ul>
    </div>
  );
}

function ItemsScene() {
  return (
    <ul className="ts-items">
      {ITEMS.map((item, i) => (
        <li key={item.id} className="ts-item" style={{ '--n': i }}>
          <span className="ts-box" aria-hidden="true"></span>
          <span className="ts-item-label">{item.label}</span>
          {item.highPriority && <span className="ts-priority">High priority</span>}
          <span className="ts-tags">{item.tags.slice(0, MAX_TAGS).map((t) => <span key={t}>{t}</span>)}</span>
        </li>
      ))}
    </ul>
  );
}

function ScanScene() {
  const flagged = new Set(SCAN.flaggedColumns);
  return (
    <div className="ts-scan" style={{ '--rows': SCAN.rows.length }}>
      <p className="ts-file">grading_sample.csv · first {SCAN.rows.length} rows</p>
      <div className="ts-table-wrap">
        <table className="ts-table">
          <thead>
            <tr>{SCAN.columns.map((c) => <th key={c} scope="col" className={flagged.has(c) ? 'is-flagged-col' : ''}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {SCAN.rows.map((row, r) => (
              <tr key={row[0]} className="ts-row" style={{ '--r': r }}>
                {row.map((cell, c) => (
                  <td key={SCAN.columns[c]} className={flagged.has(SCAN.columns[c]) ? 'ts-cell is-flagged' : 'ts-cell'}>
                    {displayCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="ts-findings">
        {SCAN.findings.map((f) => (
          <li key={f.title}><strong>{f.title}:</strong> {f.text}</li>
        ))}
      </ul>
    </div>
  );
}

function RecordScene() {
  return (
    <div className="ts-docs">
      <DisclosureDoc />
      <RecordDoc />
    </div>
  );
}

const SCENES = [DescribeScene, ItemsScene, ScanScene, RecordScene];

/**
 * One step's visual. `play` starts its animation; `final` shows the end state
 * with no animation (phones and reduced motion).
 * @param {{ step: number, play?: boolean, final?: boolean }} props
 */
function TourScene({ step, play = false, final = false }) {
  const Scene = SCENES[step];
  return (
    <div className={`ts-scene ${final ? 'is-final' : ''} ${play ? 'is-playing' : ''}`}>
      <Scene play={play} final={final} />
    </div>
  );
}

export default TourScene;
