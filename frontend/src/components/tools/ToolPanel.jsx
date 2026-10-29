import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { fetchToolDetail } from '../../services/api';
import { lookupDossier } from '../../constants/toolDossiers';
import './toolPanel.css';

// What to check before using any AI tool with student data. General advice,
// not claims about a particular vendor.
const STUDENT_DATA_CHECKS = [
  'Check whether your university has an approved or licensed version.',
  "Read the vendor's current data and training terms. They change often.",
  "Don't paste names, IDs, or grades unless your university's agreement allows it.",
];

/**
 * Side panel for one tool: its name, who makes it, its type, and a short
 * checklist. Vendor data-practice notes (retention, training, plans) stay in
 * toolDossiers.js but are not shown, since they change often.
 * @param {{ tool: { id: number, name: string }, onClose: () => void }} props
 */
function ToolPanel({ tool, onClose }) {
  const [record, setRecord] = useState(null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef(null);
  const dossier = lookupDossier(tool.name);

  useEffect(() => {
    let cancelled = false;
    fetchToolDetail(tool.id)
      .then((data) => { if (!cancelled) setRecord(data.tool || data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [tool.id]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const vendor = record?.vendor || dossier?.vendor;
  const type = record?.categoryDisplay || dossier?.category;
  const loading = !record && !failed;

  return (
    <div className="tp-overlay" onClick={onClose}>
      <aside
        className="tp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tp-head">
          <div>
            <p className="tp-kicker">AI tool</p>
            <h2 id="tp-title" className="tp-title">{tool.name}</h2>
          </div>
          <button type="button" className="tp-close" onClick={onClose} ref={closeRef} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {loading && <p className="tp-muted">Loading...</p>}

        {!loading && (vendor || type) && (
          <dl className="tp-facts">
            {vendor && (<><dt>Made by</dt><dd>{vendor}</dd></>)}
            {type && (<><dt>Type</dt><dd>{type}</dd></>)}
          </dl>
        )}

        <section className="tp-checks" aria-labelledby="tp-checks-title">
          <h3 id="tp-checks-title" className="tp-checks-title">Before you use {tool.name} with student data</h3>
          <ul>
            {STUDENT_DATA_CHECKS.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default ToolPanel;
