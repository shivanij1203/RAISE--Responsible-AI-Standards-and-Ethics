import { useEffect, useState } from 'react';
import RaiseMark from './RaiseMark';
import './buildingScreen.css';

const SLOW_MS = 8000;

/**
 * Full-screen state while a demo AI use is being created.
 * @param {{
 *   sentence: string,
 *   status: 'working' | 'error',
 *   message?: string,
 *   onRetry: () => void,
 *   onHome: () => void,
 * }} props
 */
function BuildingScreen({ sentence, status, message, onRetry, onHome }) {
  const [slow, setSlow] = useState(false);

  // Mounted fresh for each attempt (App keys it), so the timer starts over.
  useEffect(() => {
    if (status !== 'working') return undefined;
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <main className="bs" aria-live="polite" aria-busy={status === 'working'}>
      <div className="bs-card">
        <RaiseMark tone="light" size={48} />
        {status === 'working' ? (
          <>
            <h1 className="bs-title">Building your checklist...</h1>
            <p className="bs-sentence">&ldquo;{sentence}&rdquo;</p>
            <span className="bs-progress" aria-hidden="true" />
            {slow && (
              <p className="bs-slow">Waking up the server, this can take up to a minute on first visit.</p>
            )}
          </>
        ) : (
          <>
            <h1 className="bs-title">We could not build your checklist</h1>
            <p className="bs-error" role="alert">{message}</p>
            <div className="bs-actions">
              <button type="button" className="btn-primary" onClick={onRetry}>Try again</button>
              <button type="button" className="btn-secondary" onClick={onHome}>Back to the home page</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default BuildingScreen;
