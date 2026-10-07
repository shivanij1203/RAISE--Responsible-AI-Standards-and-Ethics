export const CRITICAL_CHECKPOINT_IDS = [
  'irb',
  'data_deidentified',
  'participant_consent',
  'ferpa_compliance',
  'grading_fairness',
  'decision_impact',
];

export const MEDIUM_CHECKPOINT_IDS = [
  'bias_audit',
  'human_review',
  'ai_disclosure',
  'human_override',
  'admin_bias_audit',
  'content_accuracy',
];

export function getCompletionPercentage(checkpoints) {
  if (!checkpoints || checkpoints.length === 0) return 0;
  const completed = checkpoints.filter(c => c.completed).length;
  return Math.round((completed / checkpoints.length) * 100);
}

/**
 * Open high-priority items, as a neutral count instead of a risk verdict.
 * @param {Array<{id: string, completed: boolean}>} checkpoints
 * @returns {{open: number, total: number}}
 */
export function countHighPriority(checkpoints) {
  const highPriority = (checkpoints || []).filter(c => CRITICAL_CHECKPOINT_IDS.includes(c.id));
  return {
    open: highPriority.filter(c => !c.completed).length,
    total: highPriority.length,
  };
}

/**
 * @param {{open: number, total: number}} counts
 * @returns {string} e.g. "3 high-priority items open"
 */
export function describeHighPriority({ open, total }) {
  if (total === 0) return 'No high-priority items on this checklist';
  if (open === 0) return 'All high-priority items addressed';
  return `${open} high-priority item${open === 1 ? '' : 's'} open`;
}

export function getRiskAssessment({ allCheckpoints, myCheckpoints, role, completion }) {
  const checkpointsToCheck = role === 'compliance' ? allCheckpoints : myCheckpoints;
  const incompleteCheckpoints = checkpointsToCheck.filter(c => !c.completed);
  const incompleteCritical = incompleteCheckpoints.filter(c => CRITICAL_CHECKPOINT_IDS.includes(c.id));
  const incompleteMedium = incompleteCheckpoints.filter(c => MEDIUM_CHECKPOINT_IDS.includes(c.id));

  const risks = [];
  if (incompleteCritical.length > 0) {
    risks.push({
      level: 'high',
      message: `${incompleteCritical.length} high-priority item(s) open`,
      items: incompleteCritical.map(c => c.label),
    });
  }
  if (incompleteMedium.length > 0) {
    risks.push({
      level: 'medium',
      message: `${incompleteMedium.length} transparency or quality item(s) open`,
      items: incompleteMedium.map(c => c.label),
    });
  }

  let overallRisk = 'low';
  if (risks.some(r => r.level === 'high')) {
    overallRisk = 'high';
  } else if (risks.some(r => r.level === 'medium') || completion < 50) {
    overallRisk = 'medium';
  }

  return { overallRisk, risks, completion };
}
