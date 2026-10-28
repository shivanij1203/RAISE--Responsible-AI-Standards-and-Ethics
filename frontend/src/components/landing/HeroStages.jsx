import landingData from '../../constants/landingExamples.json';
import { DEMO_EXAMPLES } from '../../constants/demoExamples';
import { generateDisclosure } from '../../utils/disclosure';
import { RECORD_TITLE } from '../../constants/recordCopy';

// Everything here is real output for the Teaching example, generated from
// the RAISE rules by export_landing_examples.
const SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
const PREVIEW = landingData.examplePreviews.teaching;
const SCAN = landingData.scanTour;

// Four items, high priority first, each shown with one of its own source tags.
const ITEM_TAGS = [
  ['grading_fairness', 'Fairness'],
  ['ferpa_compliance', 'FERPA'],
  ['data_deidentified', 'NIST AI RMF'],
  ['ai_disclosure', 'Journal Policy'],
];
const ITEMS = ITEM_TAGS
  .map(([id, tag]) => ({ ...PREVIEW.items.find((i) => i.id === id), tag }))
  .filter((item) => item.label && item.tags.includes(item.tag));

// Where each source chip drifts in from (it settles into its item's row).
const FROM = [['-240px', '-80px'], ['220px', '-110px'], ['-230px', '90px'], ['210px', '120px']];

const SCAN_COLUMNS = ['student_id', 'first_name', 'email', 'course'];
const SCAN_ROWS = SCAN.rows.slice(0, 4).map((row) => SCAN_COLUMNS.map((c) => row[SCAN.columns.indexOf(c)]));
const FLAGGED = new Set(SCAN.flaggedColumns);
// The real finding, shortened to one line: the part before the column list.
const FINDING = `${SCAN.findings[0].text.split(':')[0]}.`;

const DISCLOSURE_LINES = generateDisclosure(landingData.teachingProject)
  .split('\n')
  .filter((l) => l.startsWith('Activity:') || l.startsWith('Technology tools used:'));

// The sample file uses made-up addresses; show only the part before @.
function displayCell(value) {
  return value.includes('@') ? `${value.split('@')[0]}@…` : value;
}

function Check() {
  return (
    <span className="hs-check" aria-hidden="true">
      <svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5" /></svg>
    </span>
  );
}

function DescribeStage() {
  return (
    <div className="hs-describe">
      <p className="hs-kicker">Describe how you use AI</p>
      <p className="hs-input">
        {[...SENTENCE].map((ch, i) => <span key={i} className="hs-char" style={{ '--c': i }}>{ch}</span>)}
      </p>
      <ul className="hs-chips">
        <li className="hs-pop" style={{ '--d': '2150ms' }}>{PREVIEW.useCaseLabel}</li>
        {PREVIEW.tools.map((t) => <li key={t} className="hs-pop" style={{ '--d': '2350ms' }}>{t}</li>)}
      </ul>
    </div>
  );
}

function CheckStage() {
  return (
    <div className="hs-check-stage">
      <p className="hs-kicker">RAISE suggests checking {PREVIEW.items.length} items</p>
      <ul className="hs-items">
        {ITEMS.map((item, r) => (
          <li key={item.id} className="hs-item" style={{ '--r': r, '--fx': FROM[r][0], '--fy': FROM[r][1] }}>
            <span className="hs-box" aria-hidden="true" />
            <span className="hs-item-label">
              {item.label}
              {item.highPriority && <span className="hs-priority">High priority</span>}
            </span>
            <span className="hs-tag">{item.tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScanStage() {
  return (
    <div className="hs-scan">
      <p className="hs-kicker">Scanning grading_sample.csv</p>
      <div className="hs-table">
        <table>
          <thead>
            <tr>{SCAN_COLUMNS.map((c) => <th key={c} className={FLAGGED.has(c) ? 'is-flagged' : ''}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {SCAN_ROWS.map((row, r) => (
              <tr key={row[0]} style={{ '--r': r }}>
                {row.map((cell, c) => (
                  <td key={SCAN_COLUMNS[c]} className={FLAGGED.has(SCAN_COLUMNS[c]) ? 'is-flagged' : ''}>{displayCell(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <span className="hs-sweep" aria-hidden="true" />
      </div>
      <p className="hs-finding">{FINDING}</p>
    </div>
  );
}

function RecordStage() {
  return (
    <div className="hs-record">
      <p className="hs-kicker">Work through each item</p>
      <ul className="hs-items hs-items-ticking">
        {ITEMS.map((item, r) => (
          <li key={item.id} className="hs-item" style={{ '--r': r }}>
            <Check />
            <span className="hs-item-label">{item.label}</span>
            <span className="hs-status">
              <span className="hs-status-open">Open</span>
              <span className="hs-status-done">Addressed</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="hs-docs">
        <div className="hs-doc hs-doc-back">
          <p className="hs-doc-title">Disclosure statement</p>
          {DISCLOSURE_LINES.map((l) => <p key={l} className="hs-doc-line">{l}</p>)}
        </div>
        <div className="hs-doc hs-doc-front">
          <p className="hs-doc-title">{RECORD_TITLE}</p>
          {ITEMS.slice(0, 3).map((item) => (
            <p key={item.id} className="hs-doc-row"><span>{item.label}</span><span>Addressed</span></p>
          ))}
        </div>
      </div>
      <p className="hs-saved">Record saved</p>
    </div>
  );
}

const STAGE_VIEWS = [DescribeStage, CheckStage, ScanStage, RecordStage];

/**
 * One stage of the hero animation. `still` shows its end state with no motion.
 * @param {{ stage: number, still: boolean }} props
 */
function HeroStage({ stage, still }) {
  const View = STAGE_VIEWS[stage];
  return (
    <div className={`hs ${still ? 'is-still' : 'is-playing'}`}>
      <View />
    </div>
  );
}

export default HeroStage;
