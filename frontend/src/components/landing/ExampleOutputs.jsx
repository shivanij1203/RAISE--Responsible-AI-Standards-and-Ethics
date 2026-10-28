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

function ExampleOutputs() {
  return (
    <div className="lp-outputs">
      <figure className="lp-output">
        <figcaption className="lp-output-label">Example output · Disclosure statement</figcaption>
        <pre className="lp-output-disclosure">{DISCLOSURE}</pre>
      </figure>

      <figure className="lp-output">
        <figcaption className="lp-output-label">Example output · AI use record</figcaption>
        <div className="lp-output-record">
          <p className="lp-record-title">{RECORD_TITLE}</p>
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
      </figure>
    </div>
  );
}

export default ExampleOutputs;
