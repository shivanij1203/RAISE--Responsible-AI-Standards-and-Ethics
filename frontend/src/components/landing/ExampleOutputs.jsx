import landingData from '../../constants/landingExamples.json';
import { generateDisclosure } from '../../utils/disclosure';
import { RECORD_DISCLAIMER, RECORD_TITLE } from '../../constants/recordCopy';

// The Teaching example after a dataset scan and one confirmed suggested
// answer. Generated from the real rules (see export_landing_examples).
const project = landingData.teachingProject;

// Real disclosure text, produced by the same function the app uses.
const DISCLOSURE = generateDisclosure(project);

// Three record rows: two addressed (with their recorded decision), one open.
const RECORD_ROW_IDS = ['data_deidentified', 'ai_disclosure', 'grading_fairness'];
const RECORD_ROWS = RECORD_ROW_IDS.map((id) => {
  const item = project.checkpoints.find((c) => c.id === id);
  const decision = project.decisions.find((d) => d.checkpoint === id);
  return { id, label: item.label, addressed: item.completed, decision: decision?.description || '' };
});

function shorten(text, max = 120) {
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

const DOC = disclosureBlocks(DISCLOSURE);

function DisclosureDoc() {
  return (
    <div className="lp-doc lp-doc-disclosure">
      <p className="lp-doc-title">{DOC.title}</p>
      <div className="lp-doc-body">
        {DOC.blocks.map((block, i) => (
          <div key={i} className="lp-doc-block">
            {block.lines.map((line) => <p key={line}>{line}</p>)}
            {block.bullets.length > 0 && (
              <ul>{block.bullets.map((b) => <li key={b}>{shorten(b, 140)}</li>)}</ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordDoc() {
  return (
    <div className="lp-doc lp-doc-record">
      <p className="lp-doc-title">{RECORD_TITLE}</p>
      <p className="lp-record-disclaimer">{RECORD_DISCLAIMER}</p>
      <table className="lp-record-table">
        <thead>
          <tr>
            <th scope="col">Checklist item</th>
            <th scope="col">Status</th>
            <th scope="col">Recorded decision</th>
          </tr>
        </thead>
        <tbody>
          {RECORD_ROWS.map((row) => (
            <tr key={row.id}>
              <td>{row.label}</td>
              <td className={row.addressed ? 'lp-status-addressed' : 'lp-status-open'}>
                {row.addressed ? 'Addressed' : 'Open'}
              </td>
              <td>{row.decision ? shorten(row.decision) : 'None yet'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExampleOutputs() {
  return (
    <div className="lp-desk">
      <figure className="lp-desk-item lp-desk-left reveal">
        <figcaption className="lp-output-label">Example output · Disclosure statement</figcaption>
        <DisclosureDoc />
      </figure>
      <figure className="lp-desk-item lp-desk-right reveal" style={{ '--reveal-delay': '140ms' }}>
        <figcaption className="lp-output-label">Example output · AI use record</figcaption>
        <RecordDoc />
      </figure>
    </div>
  );
}

export default ExampleOutputs;
