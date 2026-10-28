import { useState, useEffect } from 'react';
import { toggleCheckpoint, logDecision, fetchTools, fetchProject, deleteProject, updateProject } from '../services/api';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import LogDecisionModal from './modals/LogDecisionModal';
import DatasetVerificationModal from './modals/DatasetVerificationModal';
import SmartDefaultsModal from './modals/SmartDefaultsModal';
import DisclosureModal from './modals/DisclosureModal';
import EditActivityModal from './modals/EditActivityModal';
import InviteCollaboratorModal from './modals/InviteCollaboratorModal';
import DocumentAnonymizerModal from './modals/DocumentAnonymizerModal';
import DashboardHeader from './dashboard/DashboardHeader';
import ProgressOverview from './dashboard/ProgressOverview';
import RecordCard from './dashboard/RecordCard';
import { guidanceReviewedLabel } from '../utils/guidanceDate';
import CheckpointItem from './dashboard/CheckpointItem';
import WhatToDoNext from './dashboard/WhatToDoNext';
import GuideCard from './dashboard/GuideCard';
import { useDemoGuide } from './dashboard/useDemoGuide';
import ActivityTimeline from './ActivityTimeline';
import { CRITICAL_CHECKPOINT_IDS, countHighPriority, getCompletionPercentage } from '../utils/risk';
import { generateDisclosure } from '../utils/disclosure';
import { generateComplianceReport } from '../utils/complianceReport';
import BrandMark from './BrandMark';
import AppNav from './AppNav';
import AboutLink from './AboutLink';

function ProjectDashboard({ project: initialProject, user, role, onBack, onLogout, onProjectUpdated, onViewToolRegistry, onViewDashboard, onViewUseCases }) {
  const [project, setProject] = useState(initialProject);
  const guide = useDemoGuide(project, user);
  const [expandedCheckpoint, setExpandedCheckpoint] = useState(null);
  const [expandedMode, setExpandedMode] = useState('info');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [logCheckpointId, setLogCheckpointId] = useState(null);
  const [showDatasetVerify, setShowDatasetVerify] = useState(false);
  const [showSmartDefaults, setShowSmartDefaults] = useState(false);
  // Set when the demo guide opened the modal (sample file ready, or the
  // first open high-priority item first).
  const [guideScan, setGuideScan] = useState(false);
  const [guideFocusIds, setGuideFocusIds] = useState([]);
  const [highlightExport, setHighlightExport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');
  const [showDocAnonymizer, setShowDocAnonymizer] = useState(false);

  const isOwner = !!user?.email && project.ownerEmail === user.email;
  const isGrading = (project.aiUseCase || '').toLowerCase() === 'grading';

  async function handleDeleteActivity() {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete activity', err);
      setDeleting(false);
    }
  }
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);

  async function handleToggleShareAsExample(nextShared) {
    try {
      const updated = await updateProject(project.id, { share_as_example: nextShared });
      setProject(updated);
      if (onProjectUpdated) onProjectUpdated(updated);
      showToast(nextShared ? 'Shared in Examples' : 'Made private');
    } catch (err) {
      console.error('Failed to update share flag', err);
      showToast('Could not update sharing');
    }
  }

  useEffect(() => {
    fetchTools().then(setAvailableTools).catch(() => {});
  }, []);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleCheckpointToggle(checkpointId) {
    setSaving(true);
    try {
      const result = await toggleCheckpoint(project.id, checkpointId);
      const updatedCheckpoints = project.checkpoints.map(cp =>
        cp.id === checkpointId
          ? { ...cp, completed: result.completed, completedAt: result.completedAt }
          : cp
      );
      const updatedProject = { ...project, checkpoints: updatedCheckpoints };
      setProject(updatedProject);
      if (onProjectUpdated) onProjectUpdated(updatedProject);
      showToast(result.completed ? 'Checklist item marked addressed' : 'Checklist item reopened');
    } catch (err) {
      console.error('Failed to toggle checkpoint', err);
    } finally {
      setSaving(false);
    }
  }

  // Reload the activity after a scan result or suggested answer is saved, so
  // the checklist, decisions, disclosure, and exported record all match the
  // server. (Patching local state missed the new decision, and back-to-back
  // saves could overwrite each other.)
  async function refreshProject(message) {
    try {
      const fresh = await fetchProject(project.id);
      setProject(fresh);
      if (onProjectUpdated) onProjectUpdated(fresh);
      if (message) showToast(message);
    } catch (err) {
      console.error('Failed to reload activity', err);
      showToast('Saved. Reload the page to see the latest.');
    }
  }

  async function handleLogDecision(data) {
    if (!data.checkpoint || !data.description) return;
    setSaving(true);
    try {
      const result = await logDecision(project.id, data);
      guide.mark('answer');
      const newDecisionObj = {
        id: result.id,
        checkpoint: result.checkpoint,
        description: result.description,
        notes: result.notes,
        proofType: result.proofType,
        proofValue: result.proofValue,
        toolUsed: result.toolUsed,
        loggedAt: result.loggedAt,
      };
      const updatedCheckpoints = project.checkpoints.map(cp =>
        cp.id === data.checkpoint
          ? { ...cp, completed: result.checkpointCompleted, completedAt: result.checkpointCompletedAt }
          : cp
      );
      const updatedProject = {
        ...project,
        checkpoints: updatedCheckpoints,
        decisions: [newDecisionObj, ...(project.decisions || [])],
      };
      setProject(updatedProject);
      if (onProjectUpdated) onProjectUpdated(updatedProject);
      setLogCheckpointId(null);
    } catch (err) {
      console.error('Failed to log decision', err);
      alert('Error saving decision. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const allCheckpoints = project.checkpoints || [];
  const myCheckpoints = role === 'compliance'
    ? allCheckpoints
    : allCheckpoints.filter(c => c.assignedTo === role);
  const categories = [...new Set(myCheckpoints.map(c => c.category))];
  const completion = role === 'compliance'
    ? getCompletionPercentage(allCheckpoints)
    : getCompletionPercentage(myCheckpoints);

  const highPriority = countHighPriority(role === 'compliance' ? allCheckpoints : myCheckpoints);

  function handleExportReport(scope) {
    generateComplianceReport({ project, role, scope });
    guide.mark('record');
  }

  function guideScanStep() {
    setGuideScan(true);
    setShowDatasetVerify(true);
  }

  function guideAnswerStep() {
    const openHighPriority = (project.checkpoints || [])
      .filter((c) => !c.completed && CRITICAL_CHECKPOINT_IDS.includes(c.id))
      .map((c) => c.id);
    setGuideFocusIds(openHighPriority);
    setShowSmartDefaults(true);
  }

  function guideRecordStep() {
    setActiveTab('tracker');
    // After the checklist tab renders, bring the record card into view.
    requestAnimationFrame(() => {
      document.querySelector('.record-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setHighlightExport(true);
    setTimeout(() => setHighlightExport(false), 3500);
  }

  function toggleExpanded(checkpointId, mode = 'info') {
    if (expandedCheckpoint === checkpointId && expandedMode === mode) {
      setExpandedCheckpoint(null);
    } else {
      setExpandedCheckpoint(checkpointId);
      setExpandedMode(mode);
    }
  }

  return (
    <div className="project-dashboard">
      {toast && <div className="toast-notification">{toast}</div>}

      <div className="pl-topbar">
        <div className="app-container pl-topbar-inner">
          <BrandMark variant="pl" />
          <div className="pl-topbar-right">
            <AboutLink className="about-link-topbar" />
            <NotificationBell />
            <UserMenu user={user} role={role} onLogout={onLogout} />
          </div>
        </div>
      </div>

      <AppNav active="my" role={role} onMyUses={onBack} onExamples={onViewUseCases} onTools={onViewToolRegistry} onDepartment={onViewDashboard} />

      <div className="pd-content">
        <DashboardHeader
          project={project}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onDisclosure={() => setShowDisclosure(true)}
          onExport={handleExportReport}
          onInvite={() => setShowInviteModal(true)}
          onToggleShareAsExample={handleToggleShareAsExample}
          isOwner={isOwner}
          isDemo={!!user?.is_demo}
        />

        {guide.visible && (
          <GuideCard
            done={guide.done}
            onScan={guideScanStep}
            onAnswer={guideAnswerStep}
            onRecord={guideRecordStep}
            onHide={guide.hide}
          />
        )}

        {/* Order: next step, then progress, then the checklist. */}
        <WhatToDoNext
          project={project}
          onVerifyDataset={() => setShowDatasetVerify(true)}
          onDraftCheckpoints={() => setShowSmartDefaults(true)}
          onScrollToManual={() => {
            const el = document.getElementById('checkpoints-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ProgressOverview
          completed={myCheckpoints.filter(c => c.completed).length}
          total={myCheckpoints.length}
          completion={completion}
          highPriority={highPriority}
          onlyMine={role !== 'compliance'}
        />

        <div className="dashboard-tabs dashboard-tabs-row">
          <div className="pd-tab-group">
            <button
              className={`tab ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              Review checklist
            </button>
            <button
              className={`tab ${activeTab === 'log' ? 'active' : ''}`}
              onClick={() => setActiveTab('log')}
            >
              History
            </button>
          </div>
          {activeTab === 'tracker' && (
            <div className="pd-tab-actions">
              <button className="pd-tab-action pd-tab-action-secondary tooltip-host" onClick={() => setShowSmartDefaults(true)} data-tip="Get a starting point you can edit for the remaining items">Suggest an answer</button>
              {isGrading && (
                <button className="pd-tab-action pd-tab-action-secondary tooltip-host" onClick={() => setShowDocAnonymizer(true)} data-tip="Remove student names and PII from a batch of documents or a ZIP">Anonymize Documents</button>
              )}
              <button className="pd-tab-action tooltip-host" onClick={() => setShowDatasetVerify(true)} data-tip="Scan a dataset for identifiers, student record fields, and bias">Scan dataset</button>
            </div>
          )}
        </div>

        {activeTab === 'tracker' ? (
          <div className="checkpoints-section" id="checkpoints-section">
            {categories.map(category => (
              <div key={category} className="checkpoint-category">
                <h3 className="category-title">{category}</h3>
                <div className="checkpoint-list">
                  {myCheckpoints
                    .filter(c => c.category === category)
                    .map(checkpoint => (
                      <CheckpointItem
                        key={checkpoint.id}
                        checkpoint={checkpoint}
                        role={role}
                        saving={saving}
                        expanded={expandedCheckpoint === checkpoint.id}
                        expandedMode={expandedMode}
                        decisions={(project.decisions || []).filter(d => d.checkpoint === checkpoint.id)}
                        projectId={project.id}
                        onToggleExpanded={(mode) => toggleExpanded(checkpoint.id, mode || 'info')}
                        onLog={() => setLogCheckpointId(checkpoint.id)}
                        onReopen={() => handleCheckpointToggle(checkpoint.id)}
                        onVerifyDataset={() => setShowDatasetVerify(true)}
                        onDraftCheckpoints={() => setShowSmartDefaults(true)}
                      />
                    ))}
                </div>
              </div>
            ))}
            <RecordCard
              highPriority={highPriority}
              onDisclosure={() => setShowDisclosure(true)}
              onExport={() => handleExportReport('full')}
              highlightExport={highlightExport}
            />
          </div>
        ) : (
          <ActivityTimeline projectId={project.id} />
        )}

        <p className="pd-guidance-reviewed">{guidanceReviewedLabel()}</p>

        {logCheckpointId && (
          <LogDecisionModal
            checkpointId={logCheckpointId}
            checkpointLabel={project.checkpoints?.find(c => c.id === logCheckpointId)?.label}
            availableTools={availableTools}
            saving={saving}
            onClose={() => setLogCheckpointId(null)}
            onSave={handleLogDecision}
          />
        )}

        {showDatasetVerify && (
          <DatasetVerificationModal
            project={project}
            onClose={() => {
              setShowDatasetVerify(false);
              setGuideScan(false);
            }}
            onCheckpointApplied={() => refreshProject('Scan result recorded')}
            startWithSample={guideScan}
            onScanned={() => guide.mark('scan')}
          />
        )}

        {showDocAnonymizer && (
          <DocumentAnonymizerModal onClose={() => setShowDocAnonymizer(false)} />
        )}

        {showSmartDefaults && (
          <SmartDefaultsModal
            project={project}
            onClose={() => {
              setShowSmartDefaults(false);
              setGuideFocusIds([]);
            }}
            onCheckpointApplied={() => {
              guide.mark('answer');
              refreshProject();
            }}
            focusIds={guideFocusIds}
          />
        )}

        {showDisclosure && (
          <DisclosureModal
            initialText={generateDisclosure(project)}
            filename={`${project.name.replace(/\s+/g, '_')}_Disclosure.txt`}
            onClose={() => setShowDisclosure(false)}
            onCopied={() => showToast('Copied to clipboard')}
          />
        )}

        {showEditModal && (
          <EditActivityModal
            project={project}
            role={role}
            isDemo={!!user?.is_demo}
            onClose={() => setShowEditModal(false)}
            onSaved={(updated) => {
              setProject(updated);
              if (onProjectUpdated) onProjectUpdated(updated);
              setShowEditModal(false);
              showToast('Activity updated');
            }}
          />
        )}

        {showInviteModal && (
          <InviteCollaboratorModal
            project={project}
            onClose={() => setShowInviteModal(false)}
            onInvited={() => showToast('Invitation sent')}
          />
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
            <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
              <h2>Delete this activity?</h2>
              <p className="confirm-text">
                This will permanently delete <strong>{project.name}</strong>, including all its
                checklist items, decisions, and evidence. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleDeleteActivity} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete activity'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDashboard;
