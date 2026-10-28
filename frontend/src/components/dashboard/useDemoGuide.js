import { useCallback, useState } from 'react';
import { doneSteps, hideGuide, isGuideHidden, isGuided, markStepDone } from '../../utils/demoGuide';

/**
 * State for the demo guide card on one activity page. Shown only to demo
 * users, only on an AI use created from a demo button, until hidden.
 * @param {object} project
 * @param {object | null} user
 */
export function useDemoGuide(project, user) {
  const projectId = project?.id;
  const [done, setDone] = useState(() => (projectId ? doneSteps(projectId) : []));
  const [hidden, setHidden] = useState(() => (projectId ? isGuideHidden(projectId) : true));
  const visible = !!user?.is_demo && !!projectId && isGuided(projectId) && !hidden;

  const mark = useCallback((step) => {
    if (!projectId || !isGuided(projectId)) return;
    setDone(markStepDone(projectId, step));
  }, [projectId]);

  const hide = useCallback(() => {
    hideGuide(projectId);
    setHidden(true);
  }, [projectId]);

  return { visible, done, mark, hide };
}
