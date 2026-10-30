import { USE_CASE_DESCRIPTIONS } from '../constants/useCases';

const OVERSIGHT_CHECKPOINTS = ['human_review', 'human_override', 'grading_validation', 'bias_audit', 'grading_fairness'];
const DATA_HANDLING_CHECKPOINTS = ['data_deidentified', 'data_storage', 'ferpa_compliance', 'data_classification'];

const NO_TOOLS = '[NAME OF TOOL / SERVICE]';

/**
 * The AI statement for a journal manuscript, following the chosen
 * publisher: where it goes, the draft wording, and the rule it comes from.
 * @param {object} project with disclosureGuide from the API
 * @returns {string}
 */
function journalDisclosure(project) {
  const guide = project.disclosureGuide;
  const toolNames = (project.aiTools || []).map(t => t.name);
  const tools = toolNames.length > 0 ? toolNames.join(', ') : NO_TOOLS;
  const statement = guide.draft.split(guide.toolsPlaceholder).join(tools);
  const wording = guide.publisherWording
    ? `This is the wording ${guide.publisherLabel} suggests. Replace the text in brackets.`
    : 'RAISE drafted this wording. Replace the text in brackets and edit it to match what you did.';
  const sources = [...new Map(guide.sources.map(src => [src.url, src])).values()]
    .map(src => `- ${src.name} (${src.version}): ${src.url}`);

  return [
    `AI DISCLOSURE FOR ${guide.publisherLabel.toUpperCase()}`,
    '',
    `Where it goes: ${guide.location}.`,
    '',
    statement,
    '',
    wording,
    ...(sources.length > 0 ? ['', 'Source:', ...sources] : []),
    '',
    'Prepared with RAISE, a research prototype.',
  ].join('\n');
}

export function generateDisclosure(project) {
  if (project.disclosureGuide) return journalDisclosure(project);
  const useCase = USE_CASE_DESCRIPTIONS[project.aiUseCase] || 'research activities';
  const toolNames = (project.aiTools || []).map(t => t.name);
  const completedCps = (project.checkpoints || []).filter(c => c.completed);
  const decisions = project.decisions || [];
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sections = [];

  sections.push(`DISCLOSURE OF TECHNOLOGY USE\n\nActivity: ${project.name}\nDate: ${date}\n`);

  if (toolNames.length > 0) {
    sections.push(`Technology tools used: ${toolNames.join(', ')}.\n`);
  }

  let purpose = `These tools were used for ${useCase}`;
  if (project.description) {
    purpose += `. Specifically: ${project.description.replace(/\.$/, '')}`;
  }
  purpose += `.\n`;
  sections.push(purpose);

  if (completedCps.length > 0) {
    const lines = completedCps.map(cp => {
      const suffix = cp.completedAt
        ? ` (${new Date(cp.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`
        : '';
      return `- ${cp.label}${suffix}`;
    });
    sections.push(`The following checklist items were addressed as part of this activity:\n${lines.join('\n')}\n`);
  }

  const oversightDecisions = decisions.filter(d => OVERSIGHT_CHECKPOINTS.includes(d.checkpoint));
  if (oversightDecisions.length > 0) {
    const lines = oversightDecisions.map(d => `- ${d.description}`);
    sections.push(`Human oversight measures:\n${lines.join('\n')}\n`);
  }

  const dataDecisions = decisions.filter(d => DATA_HANDLING_CHECKPOINTS.includes(d.checkpoint));
  if (dataDecisions.length > 0) {
    const lines = dataDecisions.map(d => `- ${d.description}`);
    sections.push(`Data handling:\n${lines.join('\n')}\n`);
  }

  const allFrameworks = [...new Set((project.checkpoints || []).flatMap(c => c.frameworks || []))];
  if (allFrameworks.length > 0) {
    sections.push(`This activity used the RAISE checklist, which draws on these frameworks: ${allFrameworks.join(', ')}.\n`);
  }

  sections.push('Prepared with RAISE, a research prototype.');

  return sections.join('\n');
}
