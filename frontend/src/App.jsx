import { useState, useEffect, useRef } from 'react';
import { fetchProject, getMe, logoutUser, startDemo } from './services/api';
import Landing from './components/Landing';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import ProjectDashboard from './components/ProjectDashboard';
import InstitutionalDashboard from './components/InstitutionalDashboard';
import AIToolRegistry from './components/AIToolRegistry';
import UseCases from './components/UseCases';
import ExamplePicker from './components/ExamplePicker';
import BuildingScreen from './components/BuildingScreen';
import CourseStatementFlow from './components/courseStatement/CourseStatementFlow';
import { markExamplePickerSeen } from './constants/demoExamples';
import { buildFromSentence } from './utils/demoBuild';
import { markGuided } from './utils/demoGuide';
import { APP_HOME, legacyRedirect, navigate, needsSignIn, pathForRoute, routeFromPath } from './utils/routes';
import { ATTRIBUTION } from './constants/attribution';
import AboutLink from './components/AboutLink';
import { FEEDBACK_URL } from './constants/feedback';
import { canSeeDepartmentView } from './utils/roles';
import './App.css';
import './components/landing/landing.css';
import './layout.css';

// Map auth roles to dashboard roles
function mapRole(authRole) {
  const roleMap = { faculty: 'pi', student: 'student' };
  return roleMap[authRole] || authRole;
}

function currentRoute() {
  return routeFromPath(window.location.pathname, window.location.search);
}

function clearStoredSession() {
  localStorage.removeItem('raise_user');
  localStorage.removeItem('raise_token');
}

function App() {
  // Old app URLs open the screen they used to, at its new address.
  const [route, setRoute] = useState(() => {
    const moved = legacyRedirect(window.location.pathname);
    if (moved) window.history.replaceState(null, '', moved + window.location.search + window.location.hash);
    return currentRoute();
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [templateSeed, setTemplateSeed] = useState(null);
  // A demo AI use being created: { example, status, message, attempt }.
  const [building, setBuilding] = useState(null);
  // Where to go after signing in, when a signed-out visitor opened an app URL.
  const afterLogin = useRef(null);

  // Back, forward, and navigate() all land here.
  useEffect(() => {
    const onPop = () => setRoute(currentRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const savedUser = localStorage.getItem('raise_user');
      const savedToken = localStorage.getItem('raise_token');

      if (!savedUser || !savedToken) {
        if (!cancelled) setAuthChecked(true);
        return;
      }

      // Validate the stored session with the backend. Stored credentials
      // alone are not proof of a live session, so confirm before showing
      // the authenticated app — otherwise the user lands in a broken UI.
      try {
        const me = await getMe();
        if (cancelled) return;
        const user = {
          id: me.id,
          email: me.email,
          full_name: me.full_name,
          role: me.role,
          is_demo: !!me.is_demo,
        };
        localStorage.setItem('raise_user', JSON.stringify(user));
        setCurrentUser(user);
        setUserRole(mapRole(user.role));
      } catch {
        if (cancelled) return;
        clearStoredSession();
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // App screens need a signed-in user; a signed-in user never needs the sign-in page.
  useEffect(() => {
    if (!authChecked) return;
    if (needsSignIn(route) && !currentUser) {
      afterLogin.current = window.location.pathname + window.location.search;
      navigate('/login', { replace: true });
    } else if (route.view === 'login' && currentUser) {
      navigate(APP_HOME, { replace: true });
    }
  }, [authChecked, route, currentUser]);

  // An AI use opened by its URL (a reload, a bookmark, or back/forward).
  useEffect(() => {
    if (route.view !== 'project-detail' || !currentUser) return undefined;
    if (selectedProject && String(selectedProject.id) === route.projectId) return undefined;
    let cancelled = false;
    fetchProject(route.projectId)
      .then((project) => { if (!cancelled) setSelectedProject(project); })
      .catch(() => { if (!cancelled) navigate(APP_HOME, { replace: true }); });
    return () => { cancelled = true; };
  }, [route, currentUser, selectedProject]);

  function go(view, params = {}) {
    navigate(pathForRoute({ view, ...params }));
    window.scrollTo(0, 0);
  }

  function signIn(user) {
    localStorage.setItem('raise_user', JSON.stringify(user));
    setCurrentUser(user);
    setUserRole(mapRole(user.role));
  }

  function handleLogin(user) {
    signIn(user);
    navigate(afterLogin.current || APP_HOME);
    afterLogin.current = null;
  }

  /**
   * Demo entry points: create the AI use from the sentence (as Quick Add
   * would) and open its activity page, with no form in between. Starts a
   * demo session first unless this visitor already has one.
   */
  async function buildDemo(example) {
    setBuilding((prev) => ({ example, status: 'working', attempt: (prev?.attempt || 0) + 1 }));
    // The button may sit far down the landing page; start each screen at the top.
    window.scrollTo(0, 0);
    try {
      if (!currentUser?.is_demo) {
        const data = await startDemo();
        signIn(data.user);
      }
      const project = await buildFromSentence(example);
      markGuided(project.id);
      markExamplePickerSeen();
      setSelectedProject(project);
      setBuilding(null);
      go('project-detail', { projectId: String(project.id) });
    } catch (err) {
      const message = err.response?.status === 429
        ? 'Too many demo sessions were started from this network. Please try again in an hour.'
        : 'We could not reach RAISE to build your checklist. Please try again.';
      setBuilding((prev) => ({ ...prev, example, status: 'error', message }));
    }
  }

  function handleChooseExample(example) {
    // Same path as "Use as template": ProjectList opens Quick Add with this seed.
    setTemplateSeed({
      description: example.sentence, name: example.name, category: example.category, autoParse: true,
    });
    go('projects');
  }

  async function handleLogout() {
    const wasDemo = !!currentUser?.is_demo;
    if (wasDemo) {
      // End demo: revoke the demo token with the existing logout endpoint,
      // then return to a signed-out landing page.
      try {
        await logoutUser();
      } catch {
        // The local session is cleared either way; the token expires with the demo.
      }
    }
    clearStoredSession();
    setCurrentUser(null);
    setUserRole(null);
    setSelectedProject(null);
    go(wasDemo ? 'landing' : 'login');
  }

  function handleSelectProject(project) {
    setSelectedProject(project);
    go('project-detail', { projectId: String(project.id) });
  }

  function openCourseStatement({ statementId = null, fromProjectId = null } = {}) {
    go('course-statement', { statementId, fromProjectId });
  }

  const appNav = {
    onViewDashboard: () => go('dashboard'),
    onViewToolRegistry: () => go('tool-registry'),
    onViewUseCases: () => go('use-cases'),
  };

  let view;
  const waitingForUser = needsSignIn(route) && !currentUser;
  if (!authChecked || waitingForUser || (route.view === 'login' && currentUser)) {
    view = <div className="loading">Loading...</div>;
  } else if (building) {
    view = (
      <BuildingScreen
        key={building.attempt}
        sentence={building.example.sentence}
        status={building.status}
        message={building.message}
        onRetry={() => buildDemo(building.example)}
        onHome={() => {
          setBuilding(null);
          go(currentUser ? 'projects' : 'landing');
        }}
      />
    );
  } else if (route.view === 'landing') {
    view = (
      <Landing
        signedIn={!!currentUser}
        isDemo={!!currentUser?.is_demo}
        onOpenApp={() => go('projects')}
        onUseInAccount={handleChooseExample}
        onGetStarted={() => go('login')}
        onBuildDemo={buildDemo}
      />
    );
  } else if (route.view === 'example-picker') {
    view = <ExamplePicker onChoose={buildDemo} onSkip={() => go('projects')} />;
  } else if (route.view === 'login') {
    view = <Login onLogin={handleLogin} onBack={() => go('landing')} />;
  } else if (route.view === 'dashboard' && canSeeDepartmentView(userRole)) {
    // Department view is only for admin and compliance roles; anyone else
    // who lands here falls through to My AI uses.
    view = <InstitutionalDashboard user={currentUser} role={userRole} onLogout={handleLogout} onBack={() => go('projects')} onViewToolRegistry={appNav.onViewToolRegistry} onViewUseCases={appNav.onViewUseCases} />;
  } else if (route.view === 'tool-registry' && canSeeDepartmentView(userRole)) {
    // The AI tools page is for admin and compliance roles only; anyone else
    // who lands here falls through to My AI uses.
    view = <AIToolRegistry user={currentUser} role={userRole} onLogout={handleLogout} onBack={() => go('projects')} onViewDashboard={appNav.onViewDashboard} onViewUseCases={appNav.onViewUseCases} />;
  } else if (route.view === 'use-cases') {
    view = (
      <UseCases
        user={currentUser}
        role={userRole}
        onLogout={handleLogout}
        onBack={() => go('projects')}
        onViewToolRegistry={appNav.onViewToolRegistry}
        onViewDashboard={appNav.onViewDashboard}
        onUseAsTemplate={(seed) => { setTemplateSeed(seed); go('projects'); }}
      />
    );
  } else if (route.view === 'course-statement') {
    view = (
      <CourseStatementFlow
        key={pathForRoute(route)}
        user={currentUser}
        role={userRole}
        statementId={route.statementId}
        fromProjectId={route.fromProjectId}
        onBack={() => go('projects')}
        onLogout={handleLogout}
        {...appNav}
      />
    );
  } else if (route.view === 'project-detail') {
    view = selectedProject && String(selectedProject.id) === route.projectId ? (
      <ProjectDashboard
        project={selectedProject}
        user={currentUser}
        role={userRole}
        onBack={() => { setSelectedProject(null); go('projects'); }}
        onLogout={handleLogout}
        onProjectUpdated={(updated) => setSelectedProject(updated)}
        {...appNav}
        onCreateCourseStatement={(projectId) => openCourseStatement({ fromProjectId: projectId })}
      />
    ) : <div className="loading">Loading...</div>;
  } else {
    view = (
      <ProjectList
        user={currentUser}
        role={userRole}
        onSelectProject={handleSelectProject}
        onLogout={handleLogout}
        {...appNav}
        templateSeed={templateSeed}
        onTemplateConsumed={() => setTemplateSeed(null)}
        onCreateCourseStatement={() => openCourseStatement()}
        onOpenCourseStatement={(statementId) => openCourseStatement({ statementId })}
      />
    );
  }

  return (
    <>
      <div className="prototype-banner" role="status" aria-label="Prototype notice">
        <div className="app-container prototype-banner-inner">
          <span className="prototype-banner-dot" aria-hidden="true"></span>
          {/* One inline span so the links wrap with the text. */}
          <span>
            Prototype · Demo data only · Not connected to live student records
            {currentUser?.is_demo && (
              <>
                {' · Demo session · resets within 24 hours · '}
                <button type="button" className="prototype-banner-link prototype-banner-button" onClick={handleLogout}>
                  End demo
                </button>
              </>
            )}
            {FEEDBACK_URL && (
              <>
                {' · '}
                <a className="prototype-banner-link" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
                  Give feedback
                </a>
              </>
            )}
          </span>
        </div>
      </div>
      <div className="prototype-banner-spacer" aria-hidden="true"></div>
      {view}
      <footer className="global-footer">
        <div className="global-footer-inner">
          <span>{ATTRIBUTION}</span>
          <span className="global-footer-sep" aria-hidden="true">·</span>
          <AboutLink className="about-link-footer" />
        </div>
      </footer>
    </>
  );
}

export default App;
