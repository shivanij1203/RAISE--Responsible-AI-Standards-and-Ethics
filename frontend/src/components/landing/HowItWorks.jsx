import { FileText, ListChecks, PenLine, ScanSearch } from 'lucide-react';

const STEPS = [
  { title: 'Describe', text: 'Write one sentence about how you use AI.', Icon: PenLine },
  { title: 'See what applies', text: 'RAISE lists the privacy, IRB, disclosure, and fairness items for that use.', Icon: ListChecks },
  { title: 'Work through it', text: 'Scan a sample file, edit a suggested answer, or answer in your own words.', Icon: ScanSearch },
  { title: 'Keep the record', text: 'Copy a disclosure statement or export a record of what you decided.', Icon: FileText },
];

function HowItWorks() {
  return (
    <section className="lp-how" aria-labelledby="lp-how-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title lp-on-dark reveal" id="lp-how-title">How it works</h2>
        <ol className="lp-flow">
          {STEPS.map((step, i) => {
            const StepIcon = step.Icon;
            return (
              <li className="lp-flow-step reveal" key={step.title} style={{ '--reveal-delay': `${i * 110}ms` }}>
                <span className="lp-flow-node" aria-hidden="true"><StepIcon size={22} strokeWidth={1.75} /></span>
                <span className="lp-flow-num">Step {i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
