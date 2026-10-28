import {
  ACADEMIC_ADVISOR, BUILDER_CREDENTIAL, BUILDER_NAME, BUILDER_QUOTE, LAB_NAME,
} from '../../constants/attribution';
import {
  DATA_HANDLING, DATA_HANDLING_ADVICE, HOW_IT_DECIDES, PROTOTYPE_STATUS, WHAT_RAISE_DOES_NOT,
} from '../../constants/aboutCopy';
import { guidanceReviewedLabel } from '../../utils/guidanceDate';

const [PROGRAM, UNIVERSITY] = BUILDER_CREDENTIAL.split(', ');

/** Who built RAISE, in their words, and the plain facts about the prototype. */
function AboutSection() {
  return (
    <section className="lp-band lp-about" id="about" aria-labelledby="about-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title reveal" id="about-title">About RAISE</h2>
        <div className="ab-grid">
          <figure className="ab-person reveal">
            <blockquote className="ab-quote">
              <p>&ldquo;{BUILDER_QUOTE}&rdquo;</p>
            </blockquote>
            <figcaption>
              <span className="ab-name">{BUILDER_NAME}</span>
              <span>{PROGRAM}{UNIVERSITY ? `, ${UNIVERSITY}` : ''}</span>
              <span>Developed with guidance from the {LAB_NAME}</span>
              <span>Academic advisor: {ACADEMIC_ADVISOR}</span>
            </figcaption>
          </figure>
          <div className="ab-facts reveal">
            <dl>
            <div>
              <dt>Status</dt>
              <dd>
                <p>{PROTOTYPE_STATUS}</p>
                <p>{WHAT_RAISE_DOES_NOT}</p>
              </dd>
            </div>
            <div>
              <dt>How it decides</dt>
              <dd><p>{HOW_IT_DECIDES}</p></dd>
            </div>
            <div>
              <dt>Data handling</dt>
              <dd>
                <p>{DATA_HANDLING}</p>
                <p className="ab-emphasis">{DATA_HANDLING_ADVICE}</p>
              </dd>
            </div>
            </dl>
            <p className="ab-reviewed">{guidanceReviewedLabel()}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
