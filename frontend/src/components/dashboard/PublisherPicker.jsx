import { useId, useState } from 'react';
import { PUBLISHERS } from '../../constants/publishers';
import { updateProject } from '../../services/api';
import './ruleDetails.css';

/**
 * Lets the owner of a journal manuscript pick the publisher whose AI rules
 * the checklist and the disclosure statement follow.
 * @param {{
 *   project: { id: string, publisher: string | null },
 *   canEdit: boolean,
 *   onUpdated: (project: object) => void,
 * }} props
 */
function PublisherPicker({ project, canEdit, onUpdated }) {
  const selectId = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const current = project.publisher || 'other';

  async function handleChange(event) {
    const publisher = event.target.value;
    setSaving(true);
    setError('');
    try {
      onUpdated(await updateProject(project.id, { publisher }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change the publisher. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="publisher-picker">
      <label htmlFor={selectId}>Publisher</label>
      <select id={selectId} value={current} onChange={handleChange} disabled={!canEdit || saving}>
        {PUBLISHERS.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>
      <p className="publisher-picker-hint" role={error ? 'alert' : undefined}>
        {error || 'The checklist and the disclosure statement follow this publisher\'s AI rules.'}
      </p>
    </div>
  );
}

export default PublisherPicker;
