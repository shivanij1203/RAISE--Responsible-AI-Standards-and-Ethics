import {
  ACADEMIC_ADVISOR, BUILDER_CREDENTIAL, BUILDER_NAME, BUILDER_QUOTE, LAB_NAME,
} from '../../constants/attribution';

const [PROGRAM, UNIVERSITY] = BUILDER_CREDENTIAL.split(', ');

function WhoBehind() {
  return (
    <section className="lp-band" aria-labelledby="lp-who-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title reveal" id="lp-who-title">Who&rsquo;s behind it</h2>
        <div className="lp-who-card reveal">
          <dl className="lp-who-facts">
            <dt className="lp-who-name">{BUILDER_NAME}</dt>
            <dd>{PROGRAM}{UNIVERSITY ? `, ${UNIVERSITY}` : ''}</dd>
            <dd>Developed with guidance from the {LAB_NAME}</dd>
            <dd>Academic advisor: {ACADEMIC_ADVISOR}</dd>
          </dl>
          <blockquote className="lp-who-quote">
            <p>&ldquo;{BUILDER_QUOTE}&rdquo;</p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export default WhoBehind;
