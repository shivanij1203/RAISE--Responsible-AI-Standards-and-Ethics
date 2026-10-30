import { useEffect, useRef, useState } from 'react';
import { USE_CASE_LABELS_SHORT } from '../../constants/useCases';
import ToolPanel from '../tools/ToolPanel';

/**
 * Secondary actions for the owner: Edit, Delete, and (outside demo sessions)
 * Invite and Share as example. Closes on outside click or Escape.
 */
function MoreMenu({ project, isDemo, onEdit, onDelete, onInvite, onToggleShareAsExample }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function run(action) {
    setOpen(false);
    action();
  }

  const shared = !!project.shareAsExample;

  return (
    <div className="more-menu-wrap" ref={wrapRef}>
      <button
        className="pd-disclosure-btn"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        More ▾
      </button>
      {open && (
        <div className="more-menu" role="menu">
          <button role="menuitem" onClick={() => run(onEdit)}>Edit</button>
          {!isDemo && onInvite && (
            <button role="menuitem" onClick={() => run(onInvite)}>Invite collaborator</button>
          )}
          {!isDemo && onToggleShareAsExample && (
            <button
              role="menuitemcheckbox"
              aria-checked={shared}
              onClick={() => run(() => onToggleShareAsExample(!shared))}
            >
              {shared ? 'Stop sharing as an example' : 'Share as an example'}
              <span className="more-menu-hint">
                {shared ? 'Visible (anonymized) in Examples' : 'Private to you and your collaborators'}
              </span>
            </button>
          )}
          <button role="menuitem" className="more-menu-danger" onClick={() => run(onDelete)}>Delete</button>
        </div>
      )}
    </div>
  );
}

function DashboardHeader({
  project,
  onEdit,
  onDelete,
  onDisclosure,
  onExport,
  onInvite,
  onToggleShareAsExample,
  isOwner,
  isDemo = false,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  // The tool whose data-handling notes are open in the side panel.
  const [openTool, setOpenTool] = useState(null);
  const roles = [...new Set(project.checkpoints?.map(c => c.assignedTo) || [])];
  const hasMultipleRoles = roles.length > 1;

  const startedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const collaboratorChips = [];
  if (project.facultyAdvisor) {
    collaboratorChips.push({ key: 'advisor', label: `Faculty advisor: ${project.facultyAdvisor.name || project.facultyAdvisor.email}` });
  }
  if (project.studentCollaborator) {
    collaboratorChips.push({ key: 'student', label: `Student: ${project.studentCollaborator.name || project.studentCollaborator.email}` });
  }

  return (
    <header className="pd-header">
      {openTool && <ToolPanel tool={openTool} onClose={() => setOpenTool(null)} />}
      <div className="pd-header-left">
        <h1 className="pd-title">{project.name}</h1>
        <div className="pd-meta">
          <span>{USE_CASE_LABELS_SHORT[project.aiUseCase] || project.aiUseCase}</span>
          <span className="pd-meta-sep">&middot;</span>
          <span>Started {startedDate}</span>
        </div>
        {project.aiTools?.length > 0 && (
          <div className="pd-tools">
            <span className="pd-tools-label">Tools:</span>
            {project.aiTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="pd-tool-chip"
                onClick={() => setOpenTool(tool)}
                aria-haspopup="dialog"
                title={`How ${tool.name} handles data`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        )}
        {project.description && <p className="pd-description">{project.description}</p>}
        {collaboratorChips.length > 0 && (
          <div className="pd-collab-row">
            {collaboratorChips.map((chip) => (
              <span key={chip.key} className="pd-collab-chip">{chip.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="pd-header-actions">
        <button className="pd-disclosure-btn" onClick={onDisclosure} title="Generate AI use disclosure">Disclosure</button>
        {hasMultipleRoles ? (
          <div className="export-dropdown-wrap">
            <button className="pd-export-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Export AI use record">
              Export AI use record ▾
            </button>
            {showExportMenu && (
              <div className="export-dropdown">
                <button onClick={() => { onExport('mine'); setShowExportMenu(false); }}>My checklist items</button>
                <button onClick={() => { onExport('full'); setShowExportMenu(false); }}>Full AI use record</button>
                <button onClick={() => { onExport('full', 'docx'); setShowExportMenu(false); }}>Accessible version (Word)</button>
              </div>
            )}
          </div>
        ) : (
          <button className="pd-export-btn" onClick={() => onExport('full')} title="Export AI use record">Export AI use record</button>
        )}
        {isOwner && (
          <MoreMenu
            project={project}
            isDemo={isDemo}
            onEdit={onEdit}
            onDelete={onDelete}
            onInvite={onInvite}
            onToggleShareAsExample={onToggleShareAsExample}
          />
        )}
      </div>
    </header>
  );
}

export default DashboardHeader;
