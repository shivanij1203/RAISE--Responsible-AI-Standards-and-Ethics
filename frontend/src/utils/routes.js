// URL paths for each screen. "/" is always the landing page; the signed-in
// app lives under /app. App.jsx reads the path on load and on back/forward.

export const APP_HOME = '/app';

/**
 * @typedef {{
 *   view: 'landing' | 'login' | 'projects' | 'project-detail' | 'use-cases' | 'tool-registry'
 *     | 'dashboard' | 'course-statement' | 'example-picker',
 *   projectId?: string,
 *   statementId?: number | null,
 *   fromProjectId?: string | null,
 * }} Route
 */

// Paths from before the app moved to /app. Each opens the screen it used to.
const LEGACY_PATHS = {
  '/projects': APP_HOME,
  '/my-ai-uses': APP_HOME,
  '/home': APP_HOME,
  '/dashboard': `${APP_HOME}/department`,
  '/examples': `${APP_HOME}/examples`,
  '/use-cases': `${APP_HOME}/examples`,
  '/tools': `${APP_HOME}/tools`,
};

const SIMPLE_PATHS = {
  '/': 'landing',
  '/login': 'login',
  [APP_HOME]: 'projects',
  [`${APP_HOME}/examples`]: 'use-cases',
  [`${APP_HOME}/tools`]: 'tool-registry',
  [`${APP_HOME}/department`]: 'dashboard',
  [`${APP_HOME}/start`]: 'example-picker',
};

/** The path a legacy URL now lives at, or null if it is not a legacy URL. */
export function legacyRedirect(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return LEGACY_PATHS[path] || null;
}

/**
 * @param {string} pathname
 * @param {string} [search]
 * @returns {Route}
 */
export function routeFromPath(pathname, search = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (SIMPLE_PATHS[path]) return { view: SIMPLE_PATHS[path] };
  const use = path.match(/^\/app\/uses\/(\d+)$/);
  if (use) return { view: 'project-detail', projectId: use[1] };
  if (path === `${APP_HOME}/course-statements/new`) {
    return { view: 'course-statement', statementId: null, fromProjectId: new URLSearchParams(search).get('from') };
  }
  const statement = path.match(/^\/app\/course-statements\/(\d+)$/);
  if (statement) return { view: 'course-statement', statementId: Number(statement[1]), fromProjectId: null };
  // Anything else under /app opens My AI uses; anything else at all, the landing page.
  return { view: path.startsWith(`${APP_HOME}/`) ? 'projects' : 'landing' };
}

/** @param {Route} route @returns {string} */
export function pathForRoute(route) {
  switch (route.view) {
    case 'landing': return '/';
    case 'login': return '/login';
    case 'project-detail': return `${APP_HOME}/uses/${route.projectId}`;
    case 'use-cases': return `${APP_HOME}/examples`;
    case 'tool-registry': return `${APP_HOME}/tools`;
    case 'dashboard': return `${APP_HOME}/department`;
    case 'example-picker': return `${APP_HOME}/start`;
    case 'course-statement':
      if (route.statementId) return `${APP_HOME}/course-statements/${route.statementId}`;
      return `${APP_HOME}/course-statements/new${route.fromProjectId ? `?from=${route.fromProjectId}` : ''}`;
    default: return APP_HOME;
  }
}

/** True for screens that need a signed-in user. */
export function needsSignIn(route) {
  return !['landing', 'login'].includes(route.view);
}

/**
 * Go to a path inside the app without reloading. App.jsx listens for
 * popstate and shows the matching screen.
 * @param {string} path
 * @param {{ replace?: boolean }} [options]
 */
export function navigate(path, { replace = false } = {}) {
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Click handler for links that stay inside the app. Lets modified clicks
 * (new tab, new window) through to the browser.
 * @param {string} path
 */
export function linkTo(path) {
  return (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    // A section link on the page you are already on (/#about on the landing
    // page) is a plain anchor; the browser scrolls to it.
    const target = new URL(path, window.location.href);
    if (target.pathname === window.location.pathname && target.hash) return;
    event.preventDefault();
    navigate(path);
  };
}
