import { describeHighPriority } from '../../utils/risk';

function ProgressOverview({ completed, total, completion, highPriority }) {
  return (
    <div className="progress-overview">
      <div className="progress-bar-section">
        <div className="progress-bar-header">
          <span className="progress-bar-label">
            {completed} of {total} items addressed
          </span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill-linear" style={{ width: `${completion}%` }}></div>
        </div>
      </div>
      <div className="priority-count">
        {describeHighPriority(highPriority)}
      </div>
    </div>
  );
}

export default ProgressOverview;
