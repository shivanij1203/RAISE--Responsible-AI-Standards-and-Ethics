import landingData from '../../constants/landingExamples.json';
import { generateDisclosure } from '../../utils/disclosure';
import { RECORD_DISCLAIMER, RECORD_TITLE } from '../../constants/recordCopy';

// The Teaching example after a dataset scan and one confirmed suggested
// answer. Generated from the real rules (see export_landing_examples).
const project = landingData.teachingProject;

// Three record rows: two addressed (with their recorded decision), one open.
const RECORD_ROW_IDS = ['data_deidentified', 'ai_disclosure', 'grading_fairness'];
const RECORD_ROWS = RECORD_ROW_IDS.map((id) => {
  const item = project.checkpoints.find((c) => c.id === id);
  const decision = project.decisions.find((d) => d.checkpoint === id);
  return { id, label: item.label, addressed: item.completed, decision: decision?.description || '' };
});

function shorten(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max))}…`;
}

function sentenceCase(text) {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Splits the disclosure text into a title and blocks of lines and bullets. */
function disclosureBlocks(text) {
  const [title, ...rest] = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const blocks = rest.map((block) => {
    const lines = block.split('\n');
    return {
      lines: lines.filter((l) => !l.startsWith('- ')),
      bullets: lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)),
    };
  });
  return { title: sentenceCase(title), blocks };
}

// Real disclosure text, produced by the same function the app uses.
const DOC = disclosureBlocks(generateDisclosure(project));

/** The disclosure statement as a page. Lines carry --l for a staggered fill-in. */
export function DisclosureDoc() {
  let line = 0;
  return (
    <div className="od-doc od-disclosure">
      <p className="od-title">{DOC.title}</p>
      <div className="od-body">
        {DOC.blocks.map((block, i) => (
          <div key={i} className="od-block">
            {block.lines.map((l) => <p key={l} className="od-line" style={{ '--l': line++ }}>{l}</p>)}
            {block.bullets.length > 0 && (
              <ul>
                {block.bullets.map((b) => <li key={b} className="od-line" style={{ '--l': line++ }}>{shorten(b, 110)}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A compact AI Use Record: title, disclaimer, and three rows. */
export function RecordDoc() {
  return (
    <div className="od-doc od-record">
      <p className="od-title">{RECORD_TITLE}</p>
      <p className="od-disclaimer od-line" style={{ '--l': 0 }}>{RECORD_DISCLAIMER}</p>
      <table className="od-table">
        <thead>
          <tr>
            <th scope="col">Checklist item</th>
            <th scope="col">Status</th>
            <th scope="col">Recorded decision</th>
          </tr>
        </thead>
        <tbody>
          {RECORD_ROWS.map((row, i) => (
            <tr key={row.id} className="od-line" style={{ '--l': i + 1 }}>
              <td>{row.label}</td>
              <td className={row.addressed ? 'od-addressed' : 'od-open'}>{row.addressed ? 'Addressed' : 'Open'}</td>
              <td>{row.decision ? shorten(row.decision, 64) : 'None yet'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
