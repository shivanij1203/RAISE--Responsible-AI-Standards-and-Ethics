import { canSeeDepartmentView } from '../utils/roles';

/**
 * Main navigation for signed-in screens: My AI uses, Examples, AI tools.
 * Department view is added only for admin and compliance roles.
 * @param {{
 *   active: 'my' | 'examples' | 'tools' | 'department',
 *   role?: string,
 *   onMyUses?: () => void,
 *   onExamples?: () => void,
 *   onTools?: () => void,
 *   onDepartment?: () => void,
 * }} props
 */
function AppNav({ active, role, onMyUses, onExamples, onTools, onDepartment }) {
  const tabs = [
    { key: 'my', label: 'My AI uses', onClick: onMyUses },
    { key: 'examples', label: 'Examples', onClick: onExamples },
    { key: 'tools', label: 'AI tools', onClick: onTools },
  ];
  if (canSeeDepartmentView(role)) {
    tabs.push({ key: 'department', label: 'Department view', onClick: onDepartment });
  }

  return (
    <nav className="pl-nav" aria-label="Main">
      <div className="app-container pl-nav-inner">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pl-nav-tab ${active === tab.key ? 'active' : ''}`}
            onClick={tab.onClick}
            aria-current={active === tab.key ? 'page' : undefined}
            disabled={!tab.onClick && active !== tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default AppNav;
