import { ArrowRight } from 'lucide-react';
import { getCategoryLabel, getCategoryTone } from '../../constants/activityCategories';
import { countHighPriority } from '../../utils/risk';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * One AI use on My AI uses. The whole card opens the checklist; the footer
 * button does the same for keyboard users. Footers line up across a row.
 * @param {{
 *   project: object,
 *   onOpen: () => void,
 *   inviteLabel: string | null,
 *   onInvite: () => void,
 * }} props
 */
function AiUseCard({ project, onOpen, inviteLabel, onInvite }) {
  const checkpoints = project.checkpoints || [];
  const addressed = checkpoints.filter((c) => c.completed).length;
  const percent = checkpoints.length ? Math.round((addressed / checkpoints.length) * 100) : 0;
  const { open } = countHighPriority(checkpoints);
  const decisions = project.decisions?.length || 0;
  const category = getCategoryLabel(project.category);
  const tone = getCategoryTone(project.category);

  return (
    <article className="mu-card" onClick={onOpen}>
      <div className="mu-card-top">
        {category
          ? <span className={`project-category-badge project-category-badge-${tone}`}>{category}</span>
          : <span />}
        <span className="mu-date">Created {formatDate(project.createdAt)}</span>
      </div>

      <h3 className="mu-title">{project.name}</h3>
      <p className="mu-desc">{project.description || 'No description'}</p>

      <div className="mu-progress">
        <div className="progress-bar-container" aria-hidden="true">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="mu-progress-text">{addressed} of {checkpoints.length} items addressed</span>
      </div>

      <div className="mu-status">
        {open > 0 && <span className="mu-badge mu-badge-open">{open} high-priority open</span>}
        {open === 0 && <span className="mu-badge mu-badge-done">High-priority items addressed</span>}
        <span className="mu-decisions">{decisions} {decisions === 1 ? 'decision' : 'decisions'} recorded</span>
      </div>

      {(project.facultyAdvisor || project.studentCollaborator) && (
        <p className="mu-people">
          {project.facultyAdvisor && <span>Faculty: {project.facultyAdvisor.name}</span>}
          {project.studentCollaborator && <span>Student: {project.studentCollaborator.name}</span>}
        </p>
      )}

      <div className="mu-footer">
        <button
          type="button"
          className="mu-open"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
        >
          Open checklist <ArrowRight size={16} aria-hidden="true" />
        </button>
        {inviteLabel && (
          <button type="button" className="btn-link mu-invite" onClick={(e) => { e.stopPropagation(); onInvite(); }}>
            {inviteLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default AiUseCard;
