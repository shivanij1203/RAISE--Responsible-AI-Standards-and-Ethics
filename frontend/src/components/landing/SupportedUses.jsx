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

/** One compact strip of the kinds of AI use RAISE has rules for. Not clickable. */
function SupportedUses() {
  return (
    <section className="lp-uses-strip" aria-labelledby="lp-uses-title">
      <div className="lp-band-inner">
        <p className="lp-uses-caption reveal" id="lp-uses-title">
          <strong>Supported AI uses.</strong> RAISE has checklist rules for each of these.
        </p>
        <ul className="lp-use-chips reveal">
          {landingData.supportedUses.map(({ label, areas }) => {
            const Icon = ICONS[label];
            return (
              <li key={label} title={`Usually flags: ${areas.join(', ')}`}>
                {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default SupportedUses;
