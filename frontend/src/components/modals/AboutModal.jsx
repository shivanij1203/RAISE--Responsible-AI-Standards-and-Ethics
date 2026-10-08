import { ATTRIBUTION, GUIDANCE_LAST_REVIEWED } from '../../constants/attribution';
import {
  DATA_HANDLING,
  DATA_HANDLING_ADVICE,
  HOW_IT_DECIDES,
  PROTOTYPE_STATUS,
  WHAT_RAISE_IS_NOT,
} from '../../constants/aboutCopy';

function formatReviewDate(isoDate) {
  // Parse as a calendar date (no time zone shift).
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function AboutModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="about-modal-title">About this prototype</h2>

        <section className="about-section">
          <h3>Who built it</h3>
          <p>{ATTRIBUTION}</p>
        </section>

        <section className="about-section">
          <h3>Status</h3>
          <p>{PROTOTYPE_STATUS}</p>
        </section>

        <section className="about-section">
          <h3>How it decides</h3>
          <p>{HOW_IT_DECIDES}</p>
        </section>

        <section className="about-section">
          <h3>What it is not</h3>
          <p>{WHAT_RAISE_IS_NOT}</p>
        </section>

        <section className="about-section">
          <h3>Data handling</h3>
          <p>{DATA_HANDLING}</p>
          <p className="about-emphasis">{DATA_HANDLING_ADVICE}</p>
        </section>

        <p className="about-reviewed">Guidance last reviewed: {formatReviewDate(GUIDANCE_LAST_REVIEWED)}</p>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose} autoFocus>Close</button>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
