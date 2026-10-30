import { formatCheckedDate } from '../../utils/ruleSources';
import './ruleDetails.css';

/**
 * @typedef {{ name: string, url: string | null, version?: string, lastChecked?: string | null }} Source
 * @typedef {Source & { quote: string }} Quote
 * @typedef {{ key: string, text: string, sources: Quote[] }} UsfNote
 */

/** One source page: its name as a link, then the date it shows and when RAISE checked it. */
function SourceLine({ source }) {
  const checked = formatCheckedDate(source.lastChecked);
  return (
    <>
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
      ) : (
        source.name
      )}
      {source.version && <span className="rule-source-meta"> ({source.version}{checked && `; checked ${checked}`})</span>}
    </>
  );
}

/** "Sources: FERPA · NIST AI RMF", or the rule pages behind a verified item. */
export function CheckpointSources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <p className="checkpoint-sources">
      Sources:{' '}
      {sources.map((source, i) => (
        <span key={source.url || source.name}>
          {i > 0 && ' · '}
          <SourceLine source={source} />
        </span>
      ))}
    </p>
  );
}

/** The exact words of each rule, collapsed by default. */
export function SourceQuotes({ quotes }) {
  if (!quotes || quotes.length === 0) return null;
  return (
    <details className="rule-quotes">
      <summary>What the source says</summary>
      <ul>
        {quotes.map((q) => (
          <li key={q.quote}>
            <blockquote>{q.quote}</blockquote>
            <cite>{q.name}</cite>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** USF guidance that applies to this item. */
export function UsfNotes({ notes }) {
  if (!notes || notes.length === 0) return null;
  return (
    <div className="usf-notes">
      <strong className="usf-notes-title">At USF</strong>
      <ul>
        {notes.map((note) => {
          const pages = [...new Map(note.sources.map((s) => [s.url, s])).values()];
          return (
            <li key={note.key}>
              <p>{note.text}</p>
              <p className="usf-note-sources">
                {pages.map((source, i) => (
                  <span key={source.url}>
                    {i > 0 && ' · '}
                    <SourceLine source={source} />
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
