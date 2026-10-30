import { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../services/api';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import BrandMark from './BrandMark';
import AppNav from './AppNav';
import AboutLink from './AboutLink';
import { describeHighPriority } from '../utils/risk';

const USE_CASE_LABELS = {
  'data_analysis': 'Data Analysis',
  'qualitative': 'Qualitative Analysis',
  'ml_model': 'ML / AI Model',
  'literature': 'Literature Review',
  'writing': 'Writing Assistance',
  'grading': 'Grading & Assessment',
  'teaching': 'Teaching Materials',
  'admin': 'Admin Decisions',
  'grant_proposal': 'Grant Proposal',
  'peer_review': 'Peer Review',
  'journal_manuscript': 'Journal Manuscript',
  'other': 'Other',
};

function InstitutionalDashboard({ user, role, onLogout, onBack, onViewToolRegistry, onViewUseCases }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('mine');

  useEffect(() => {
    loadStats(scope);
  }, [scope]);

  async function loadStats(s) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardStats(s);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  const isFaculty = stats?.userRole === 'faculty';
  const userName = stats?.userName || '';

  const dashboardTitle = 'Department view';
  const dashboardSubtitle = scope === 'all'
    ? 'Checklist items addressed across AI uses in the department'
    : `Checklist items addressed across your AI uses, ${userName}`;

  function renderTopBar() {
    return (
      <>
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
        <AppNav active="department" role={role} onMyUses={onBack} onExamples={onViewUseCases} onTools={onViewToolRegistry} />
      </>
    );
  }

  if (loading && !stats) {
    return (
      <div className="inst-dashboard">
        {renderTopBar()}
        <div className="inst-dashboard-content">
          <div className="summary-cards">
            {[1, 2, 3].map(i => (
              <div key={i} className="summary-card skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-bar"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inst-dashboard">
        {renderTopBar()}
        <div className="inst-dashboard-content">
          <div className="error-banner">
            {error}
            <button className="error-retry" onClick={() => loadStats(scope)}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { totalActivities, recentFeed, activities } = stats;
  const highPriorityOpen = activities.reduce((sum, a) => sum + (a.highPriorityOpen || 0), 0);
  const usesWithOpenHighPriority = activities.filter(a => a.highPriorityOpen > 0).length;
  const itemsAddressed = activities.reduce((sum, a) => sum + (a.checkpointsDone || 0), 0);
  const itemsTotal = activities.reduce((sum, a) => sum + (a.checkpointsTotal || 0), 0);
  const fullyAddressed = activities.filter(a => a.checkpointsTotal > 0 && a.checkpointsDone === a.checkpointsTotal).length;

  return (
    <div className="inst-dashboard">
      {renderTopBar()}
      <div className="inst-dashboard-content">
        <div className="inst-dashboard-title-row">
          <div>
            <h1 className="inst-dashboard-heading">{dashboardTitle}</h1>
            <p className="inst-subtitle">{dashboardSubtitle}</p>
          </div>
          {isFaculty && (
            <div className="scope-toggle">
              <button
                className={`scope-btn ${scope === 'mine' ? 'active' : ''}`}
                onClick={() => setScope('mine')}
              >
                My AI uses
              </button>
              <button
                className={`scope-btn ${scope === 'all' ? 'active' : ''}`}
                onClick={() => setScope('all')}
              >
                All AI uses
              </button>
            </div>
          )}
        </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="sc-label">{scope === 'all' ? 'AI uses' : 'My AI uses'}</div>
          <div className="sc-value">{totalActivities}</div>
          <div className="sc-hint">{totalActivities === 0 ? 'No AI uses yet' : `${fullyAddressed} with every item addressed`}</div>
        </div>
        <div className="summary-card">
          <div className="sc-label">Items addressed</div>
          <div className="sc-value">{itemsAddressed} of {itemsTotal}</div>
          <div className="sc-hint">{totalActivities === 0 ? 'No data yet' : 'Across all checklist items'}</div>
        </div>
        <div className="summary-card">
          <div className="sc-label">High-priority items open</div>
          <div className="sc-value">{highPriorityOpen}</div>
          <div className="sc-hint">
            {totalActivities === 0
              ? 'No data yet'
              : highPriorityOpen === 0
                ? 'All high-priority items addressed'
                : `In ${usesWithOpenHighPriority} AI use${usesWithOpenHighPriority === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      <div className="inst-grid">
        {/* Recent Activity Feed */}
        <div className="inst-section feed-section">
          <h2>Recent Activity</h2>
          {recentFeed.length === 0 ? (
            <p className="inst-empty">No decisions recorded yet. Record decisions on checklist items to see them here.</p>
          ) : (
            <div className="feed-list">
              {recentFeed.map((item, i) => (
                <div key={i} className="feed-item">
                  <div className="feed-dot"></div>
                  <div className="feed-body">
                    <div className="feed-main">
                      {scope === 'all' && <strong>{item.owner} </strong>}
                      recorded a decision on <span className="feed-checkpoint">{item.checkpoint}</span>
                    </div>
                    <div className="feed-meta">
                      {item.activityName} &middot; {new Date(item.loggedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activities Table */}
        <div className="inst-section table-section">
          <h2>{scope === 'all' ? 'All AI uses' : 'My AI uses'}</h2>
          {activities.length === 0 ? (
            <p className="inst-empty">No AI uses yet. Add your first AI use to get started.</p>
          ) : (
            <table className="activities-table">
              <thead>
                <tr>
                  <th>AI use</th>
                  {scope === 'all' && <th>Owner</th>}
                  <th>Kind of use</th>
                  <th>Items addressed</th>
                  <th>High-priority items</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id}>
                    <td className="at-name">{a.name}</td>
                    {scope === 'all' && <td className="at-owner">{a.owner}</td>}
                    <td className="at-usecase">{USE_CASE_LABELS[a.aiUseCase] || a.aiUseCase}</td>
                    <td>
                      <div className="compliance-cell">
                        <div className="compliance-bar-mini">
                          <div className="compliance-bar-fill" style={{ width: `${a.compliancePct}%` }}></div>
                        </div>
                        <span className="compliance-pct">{a.checkpointsDone} of {a.checkpointsTotal}</span>
                      </div>
                    </td>
                    <td className="at-priority">
                      {describeHighPriority({ open: a.highPriorityOpen || 0, total: a.highPriorityTotal || 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default InstitutionalDashboard;
