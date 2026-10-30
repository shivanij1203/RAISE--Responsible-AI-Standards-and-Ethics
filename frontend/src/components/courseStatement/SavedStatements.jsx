import { useEffect, useState } from 'react';
import { fetchCourseStatements } from '../../services/api';
import './courseStatement.css';

/**
 * The course AI statements a professor has saved, on My AI uses.
 * @param {{ onOpen: (id: number) => void }} props
 */
function SavedStatements({ onOpen }) {
  const [statements, setStatements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchCourseStatements()
      .then((data) => { if (!cancelled) setStatements(data); })
      .catch(() => { if (!cancelled) setError('Could not load your course AI statements.'); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p className="app-container cs-error">{error}</p>;
  if (statements.length === 0) return null;

  return (
    <section className="app-container cs-saved" aria-labelledby="cs-saved-title">
      <h2 id="cs-saved-title">Course AI statements</h2>
      <ul>
        {statements.map((s) => (
          <li key={s.id}>
            <div>
              <strong>{s.courseName}</strong> <span className="cs-saved-meta">· {s.term}</span>
              <div className="cs-saved-meta">
                Updated {new Date(s.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => onOpen(s.id)}
              aria-label={`Open the AI statement for ${s.courseName}`}>
              Open
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SavedStatements;
