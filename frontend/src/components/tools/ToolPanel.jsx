import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { fetchToolDetail } from '../../services/api';
import { lookupDossier } from '../../constants/toolDossiers';
import './toolPanel.css';

const VENDOR_NOTE = 'Based on vendor materials. Check whether your university has an approved version of this tool.';

/**
 * Side panel with one tool's data-handling notes, from the tool record and
 * toolDossiers.js. Shows only what is already in our data, with no invented
 * claims. (Our data has no vendor data-policy links yet, so none is shown.)
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

        {loading && <p className="tp-muted">Loading notes...</p>}

        {!loading && (
          <dl className="tp-facts">
            {vendor && (<><dt>Made by</dt><dd>{vendor}</dd></>)}
            {record && (
              <>
                <dt>Keeps your data</dt>
                <dd>
                  {String(record.retainsData) === 'True' || record.retainsData === true
                    ? 'The vendor says it keeps conversation data.'
                    : 'The vendor says it does not keep conversation data.'}
                  {record.dataRetentionDetails && <span className="tp-detail">{record.dataRetentionDetails}</span>}
                </dd>
              </>
            )}
            {!record && dossier?.dataRetention && (<><dt>Keeps your data</dt><dd>{dossier.dataRetention}</dd></>)}
            {dossier?.trainingOptOut && (<><dt>Training on your data</dt><dd>{dossier.trainingOptOut}</dd></>)}
            {dossier?.ferpaSafe && (<><dt>Student data</dt><dd>{dossier.ferpaSafe}</dd></>)}
            {record?.ferpaCompliant && (<><dt>FERPA</dt><dd>Vendor states FERPA support</dd></>)}
          </dl>
        )}

        {failed && !dossier && <p className="tp-muted">No notes are available for this tool yet.</p>}

        <p className="tp-note">{VENDOR_NOTE}</p>
      </aside>
    </div>
  );
}

export default ToolPanel;
