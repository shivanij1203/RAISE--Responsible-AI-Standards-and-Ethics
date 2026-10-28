import { ArrowRight } from 'lucide-react';

// Where the rules live today, and the real checklist item RAISE turns each
// one into (labels from checkpoint_generator.py).
const SOURCES = [
  { source: 'FERPA guidance', item: 'Check whether FERPA applies to this data' },
  { source: 'IRB office', item: 'Confirm your IRB protocol covers AI use' },
  { source: 'Journal disclosure policy', item: 'Plan how you will disclose AI use' },
  { source: 'University AI policy', item: 'Classify the data you will use' },
  { source: 'Course syllabus rules', item: 'Share grading criteria with students' },
];

function WhyRaise() {
  return (
    <section className="lp-band lp-why-band" aria-labelledby="lp-why-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title reveal" id="lp-why-title">Why RAISE exists</h2>
        <div className="lp-why-visual">
          <div className="lp-why-today reveal">
            <p className="lp-why-kicker">Today</p>
            <ul className="lp-scatter" aria-label="Where the rules live today">
              {SOURCES.map(({ source }) => <li key={source}>{source}</li>)}
            </ul>
          </div>
          <span className="lp-why-arrow" aria-hidden="true"><ArrowRight size={28} strokeWidth={1.5} /></span>
          <div className="lp-why-with reveal" style={{ '--reveal-delay': '160ms' }}>
            <p className="lp-why-kicker">With RAISE</p>
            <ul className="lp-collected" aria-label="One checklist">
              {SOURCES.map(({ source, item }) => (
                <li key={source}>
                  <span className="lp-collected-box" aria-hidden="true"></span>
                  <span className="lp-collected-item">{item}</span>
                  <span className="lp-collected-source">{source}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="lp-why-caption reveal">
          Faculty already use AI to grade, give feedback, and analyze research data. The rules
          that apply, like FERPA, IRB protocols, and disclosure expectations, are spread across
          separate policies and offices. RAISE turns them into one checklist for each use and
          keeps a record of what you decided.
        </p>
      </div>
    </section>
  );
}

export default WhyRaise;
