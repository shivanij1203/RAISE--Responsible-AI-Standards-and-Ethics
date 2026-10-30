/**
 * Step 4: edit the statement and the student version, then copy or download.
 * @param {{
 *   statementText: string,
 *   studentText: string,
 *   bogNote: { status: string, text: string, sources: { url: string, name: string }[] } | null,
 *   busy: boolean,
 *   dirty: boolean,
 *   onChange: (field: 'statementText' | 'studentText', value: string) => void,
 *   onSave: () => void,
 *   onCopy: (field: 'statementText' | 'studentText') => void,
 *   onDownload: () => void,
 *   onRebuild: () => void,
 * }} props
 */
function StepPreview({ statementText, studentText, bogNote, busy, dirty, onChange, onSave, onCopy, onDownload, onRebuild }) {
  return (
    <div className="cs-fields">
      <div className="cs-field">
        <label htmlFor="cs-statement">Syllabus statement</label>
        <p id="cs-statement-hint" className="cs-hint">
          Edit freely. In the Word file, the first line becomes the title and the two section lines become headings.
        </p>
        <textarea id="cs-statement" rows={16} value={statementText} aria-describedby="cs-statement-hint"
          onChange={(e) => onChange('statementText', e.target.value)} />
        <div className="cs-actions">
          <button type="button" className="btn-primary" onClick={() => onCopy('statementText')} disabled={busy}>
            Copy statement
          </button>
          <button type="button" className="btn-secondary" onClick={onDownload} disabled={busy}>
            Download as Word
          </button>
          <button type="button" className="btn-secondary" onClick={onSave} disabled={busy || !dirty}>
            {dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="cs-field">
        <label htmlFor="cs-student">Student version for a Canvas announcement</label>
        <textarea id="cs-student" rows={8} value={studentText}
          onChange={(e) => onChange('studentText', e.target.value)} />
        <div className="cs-actions">
          <button type="button" className="btn-secondary" onClick={() => onCopy('studentText')} disabled={busy}>
            Copy student version
          </button>
        </div>
      </div>

      <p className="cs-hint">
        Changed your choices?{' '}
        <button type="button" className="cs-link-btn" onClick={onRebuild} disabled={busy}>
          Rebuild the text from your choices
        </button>
        {' '}(replaces your edits).
      </p>

      <div className="cs-notes">
        <p>
          RAISE drafts this statement from what you recorded. It does not check whether your syllabus meets any
          legal or university requirement.
        </p>
        {bogNote && (
          <p>
            {bogNote.text}{' '}
            {bogNote.sources[0] && (
              <a href={bogNote.sources[0].url} target="_blank" rel="noopener noreferrer">Read the notice</a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default StepPreview;
