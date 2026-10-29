import { bucketCounts } from '../../constants/checkpointCategories';

function WhatToDoNext({ project, onVerifyDataset, onDraftCheckpoints, onScrollToManual }) {
  const checkpoints = project.checkpoints || [];
  const total = checkpoints.length;
  const completed = checkpoints.filter((c) => c.completed).length;
  if (total === 0) return null;
  if (completed === total) return null;

  const counts = bucketCounts(checkpoints);
  const steps = [];
  if (counts.scannable > 0) {
    steps.push({
      key: 'verify',
      title: `Scan a dataset for ${counts.scannable} data item${counts.scannable === 1 ? '' : 's'}`,
      hint: 'Personal identifiers, student record fields, classification, and bias, from one CSV upload. You review what each scan found and choose what to record.',
      cta: 'Scan dataset',
      action: onVerifyDataset,
    });
  }
  if (counts.draftable > 0) {
    steps.push({
      key: 'draft',
      title: `Get a suggested starting point for ${counts.draftable} policy item${counts.draftable === 1 ? '' : 's'}`,
      hint: 'RAISE suggests a starting answer from your activity details. You edit or confirm each one before it is saved.',
      cta: 'Get a suggested answer',
      action: onDraftCheckpoints,
    });
  }
  if (counts.manual > 0) {
    steps.push({
      key: 'manual',
      title: `Answer ${counts.manual} checklist item${counts.manual === 1 ? '' : 's'} in your own words`,
      hint: 'These items are specific to this AI use, so only you can answer them.',
      cta: 'Show me',
      action: onScrollToManual,
    });
  }

  if (steps.length === 0) return null;

  const next = steps[0];
  const remaining = steps.slice(1);

  return (
    <div className="wtdn-card">
      <div className="wtdn-header">
        <span className="wtdn-eyebrow">What to do next</span>
        <span className="wtdn-progress">{completed} of {total} items addressed</span>
      </div>
      <div className="wtdn-step wtdn-step-primary">
        <div className="wtdn-step-num">1</div>
        <div className="wtdn-step-body">
          <div className="wtdn-step-title">{next.title}</div>
          <div className="wtdn-step-hint">{next.hint}</div>
        </div>
        <button className="btn-primary wtdn-cta" onClick={next.action}>{next.cta}</button>
      </div>
      {remaining.length > 0 && (
        <div className="wtdn-rest">
          <div className="wtdn-rest-label">Then:</div>
          <ol className="wtdn-rest-list">
            {remaining.map((s, i) => (
              <li key={s.key}>
                <span className="wtdn-rest-num">{i + 2}.</span>
                <span className="wtdn-rest-title">{s.title}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default WhatToDoNext;
