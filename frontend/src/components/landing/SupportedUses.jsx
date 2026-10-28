import {
  BarChart3, BookOpen, Building2, ClipboardCheck, Landmark, MessagesSquare, PenLine, Presentation,
} from 'lucide-react';
import landingData from '../../constants/landingExamples.json';

const ICONS = {
  'Qualitative Data Analysis': MessagesSquare,
  'Literature Review': BookOpen,
  'Writing and Editing': PenLine,
  'Statistical Analysis': BarChart3,
  'Grant Proposal Writing': Landmark,
  'Teaching Materials': Presentation,
  'Grading and Assessment': ClipboardCheck,
  'Administrative Tasks': Building2,
};

/** The kinds of AI use RAISE has rules for. Areas come from the real checklist. */
function SupportedUses() {
  return (
    <section className="lp-band" aria-labelledby="lp-uses-title">
      <div className="lp-band-inner">
        <h2 className="lp-band-title reveal" id="lp-uses-title">Supported AI uses</h2>
        <p className="lp-band-text reveal">RAISE suggests a checklist for each of these kinds of AI use.</p>
        <ul className="lp-uses">
          {landingData.supportedUses.map(({ label, areas }, i) => {
            const Icon = ICONS[label];
            return (
              <li key={label} className="lp-use reveal" style={{ '--reveal-delay': `${(i % 4) * 70}ms` }}>
                <span className="lp-use-icon" aria-hidden="true">{Icon && <Icon size={20} strokeWidth={1.75} />}</span>
                <span className="lp-use-label">{label}</span>
                <span className="lp-use-areas">
                  <span className="lp-use-areas-label">Usually flags</span>
                  {areas.join(' · ')}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default SupportedUses;
