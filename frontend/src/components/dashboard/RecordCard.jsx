import { describeHighPriority } from '../../utils/risk';

/**
 * Finish line at the bottom of the review checklist: the disclosure and the
 * exported record. More prominent once every high-priority item is addressed.
 * @param {{
 *   highPriority: {open: number, total: number},
 *   onDisclosure: () => void,
 *   onExport: () => void,
 * }} props
 */
function RecordCard({ highPriority, onDisclosure, onExport }) {
  const ready = highPriority.open === 0;

  return (
    <section className={`record-card ${ready ? 'record-card-ready' : ''}`} aria-labelledby="record-card-title">
      <h3 id="record-card-title" className="record-card-title">Your record</h3>
      <p className="record-card-text">
        {ready
          ? 'The high-priority items are addressed. Share a disclosure statement or export the record of what you reviewed and decided.'
          : `${describeHighPriority(highPriority)}. You can share a disclosure statement or export the record of what you reviewed and decided at any time.`}
      </p>
      <div className="record-card-actions">
        <button className={ready ? 'btn-primary' : 'btn-secondary'} onClick={onDisclosure}>
          Copy disclosure statement
        </button>
        <button className={ready ? 'btn-primary' : 'btn-secondary'} onClick={onExport}>
          Export AI use record
        </button>
      </div>
    </section>
  );
}

export default RecordCard;
