import { useEffect, useRef, useState } from 'react';
import {
  createCourseStatement,
  downloadCourseStatementDocx,
  draftCourseStatement,
  fetchCourseStatement,
  fetchCourseStatementOptions,
  trackUsage,
  updateCourseStatement,
} from '../../services/api';
import {
  STEPS,
  choicesKey,
  docxFilename,
  emptyForm,
  formFromStatement,
  presetFor,
  toPayload,
  toggleStudentUse,
} from '../../utils/courseStatement';
import BrandMark from '../BrandMark';
import AppNav from '../AppNav';
import AboutLink from '../AboutLink';
import UserMenu from '../UserMenu';
import StepCourse from './StepCourse';
import StepUses from './StepUses';
import StepStudentUse from './StepStudentUse';
import StepPreview from './StepPreview';
import { saveBlob } from '../../utils/download';
import './courseStatement.css';

const PREVIEW = STEPS.length - 1;

/**
 * Builds a syllabus AI statement in four steps: course, the professor's AI
 * uses, student AI use, then preview, copy, and download. Opening a saved
 * statement starts at the preview with its saved text.
 * @param {{
 *   user: object, role: string,
 *   statementId?: number | null,
 *   fromProjectId?: string | number | null,
 *   onBack: () => void, onReturn?: () => void, onLogout: () => void,
 *   onViewUseCases: () => void, onViewToolRegistry: () => void, onViewDashboard: () => void,
 * }} props
 */
function CourseStatementFlow({ user, role, statementId = null, fromProjectId = null, onBack, onReturn, onLogout, onViewUseCases, onViewToolRegistry, onViewDashboard }) {
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(null); // { id, statementText, studentText }
  const [texts, setTexts] = useState({ statementText: '', studentText: '' });
  const [builtKey, setBuiltKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const headingRef = useRef(null);
  const leave = onReturn || onBack;
  const moved = useRef(false);

  // Load the options, and the saved statement when reopening one.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const opts = await fetchCourseStatementOptions();
        if (cancelled) return;
        setOptions(opts);
        if (statementId) {
          const statement = await fetchCourseStatement(statementId);
          if (cancelled) return;
          const loaded = formFromStatement(statement);
          setForm(loaded);
          setSaved({ id: statement.id, statementText: statement.statementText, studentText: statement.studentText });
          setTexts({ statementText: statement.statementText, studentText: statement.studentText });
          setBuiltKey(choicesKey(loaded));
          setStep(PREVIEW);
        } else {
          const suggested = opts.aiUses.filter((u) => u.suggested || String(u.id) === String(fromProjectId));
          setForm((f) => ({ ...f, projectIds: suggested.map((u) => u.id) }));
        }
      } catch {
        if (!cancelled) setLoadError('Could not load your AI uses. Please refresh the page.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statementId, fromProjectId]);

  // Announce each step and move focus to its heading (not on first render).
  useEffect(() => {
    setAnnouncement(`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`);
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const dirty = !!saved && (texts.statementText !== saved.statementText || texts.studentText !== saved.studentText);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateCourse() {
    const next = {};
    if (!form.courseName.trim()) next.courseName = 'Enter the course name.';
    if (!form.term.trim()) next.term = 'Enter the term.';
    setErrors(next);
    if (next.courseName) document.getElementById('cs-course')?.focus();
    else if (next.term) document.getElementById('cs-term')?.focus();
    return !next.courseName && !next.term;
  }

  /** Build the text from the choices and save it (creating the statement the first time). */
  async function buildAndSave() {
    const payload = toPayload(form);
    const draft = await draftCourseStatement(payload);
    const body = { ...payload, statement_text: draft.statementText, student_text: draft.studentText };
    // Started from an AI use's "Tell your students" card: that use records the statement.
    const statement = saved
      ? await updateCourseStatement(saved.id, body)
      : await createCourseStatement(fromProjectId ? { ...body, from_project_id: fromProjectId } : body);
    setSaved({ id: statement.id, statementText: statement.statementText, studentText: statement.studentText });
    setTexts({ statementText: statement.statementText, studentText: statement.studentText });
    setBuiltKey(choicesKey(form));
  }

  async function goTo(next) {
    if (next > step && step === 0 && !validateCourse()) return;
    setMessage('');
    if (next === PREVIEW && (!saved || builtKey !== choicesKey(form))) {
      setBusy(true);
      try {
        await buildAndSave();
      } catch (err) {
        setMessage(err.response?.data?.error || 'Could not build the statement. Please try again.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    moved.current = true;
    setStep(next);
  }

  async function saveTexts() {
    if (!dirty) return true;
    try {
      const statement = await updateCourseStatement(saved.id, {
        statement_text: texts.statementText, student_text: texts.studentText,
      });
      setSaved({ id: statement.id, statementText: statement.statementText, studentText: statement.studentText });
      return true;
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not save your changes. Please try again.');
      return false;
    }
  }

  async function run(action) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const handleSave = () => run(async () => {
    if (await saveTexts()) setMessage('Changes saved.');
  });

  const handleCopy = (field) => run(async () => {
    try {
      await navigator.clipboard.writeText(texts[field]);
    } catch {
      setMessage('Could not copy. Select the text and copy it yourself.');
      return;
    }
    trackUsage('statement_copied');
    const saveOk = await saveTexts();
    setMessage(`${field === 'statementText' ? 'Statement' : 'Student version'} copied to the clipboard.${saveOk ? '' : ' Your edits are not saved yet.'}`);
  });

  const handleDownload = () => run(async () => {
    if (!(await saveTexts())) return;
    try {
      saveBlob(await downloadCourseStatementDocx(saved.id), docxFilename(form.courseName));
      setMessage('Word file downloaded.');
    } catch {
      setMessage('Could not download the Word file. Please try again.');
    }
  });

  const handleRebuild = () => run(async () => {
    try {
      await buildAndSave();
      setMessage('Statement rebuilt from your choices.');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not rebuild the statement. Please try again.');
    }
  });

  let body = null;
  if (loadError) {
    body = <p className="cs-error" role="alert">{loadError}</p>;
  } else if (!options) {
    body = <p className="cs-hint">Loading…</p>;
  } else if (step === 0) {
    body = <StepCourse form={form} errors={errors} onChange={update} />;
  } else if (step === 1) {
    body = (
      <StepUses aiUses={options.aiUses} selected={form.projectIds}
        onToggle={(id, on) => update('projectIds', on ? [...form.projectIds, id] : form.projectIds.filter((x) => x !== id))} />
    );
  } else if (step === 2) {
    body = (
      <StepStudentUse
        form={form} policies={options.policies} studentUses={options.studentUses}
        rebuildNote={!!saved && builtKey !== choicesKey(form)}
        onPolicy={(policy) => setForm((f) => ({ ...f, policy, ...presetFor(policy, options.studentUses) }))}
        onToggleUse={(list, key, on) => setForm((f) => toggleStudentUse(f, list, key, on))}
        onCiteLine={(value) => update('citeLine', value)}
      />
    );
  } else {
    body = (
      <StepPreview
        statementText={texts.statementText} studentText={texts.studentText} bogNote={options.bogNote}
        busy={busy} dirty={dirty}
        onChange={(field, value) => setTexts((t) => ({ ...t, [field]: value }))}
        onSave={handleSave} onCopy={handleCopy} onDownload={handleDownload} onRebuild={handleRebuild}
      />
    );
  }

  return (
    <div className="project-list">
      <div className="pl-topbar">
        <div className="app-container pl-topbar-inner">
          <BrandMark variant="pl" />
          <div className="pl-topbar-right">
            <AboutLink className="about-link-topbar" />
            <UserMenu user={user} role={role} onLogout={onLogout} />
          </div>
        </div>
      </div>
      <AppNav active="my" role={role} onMyUses={onBack} onExamples={onViewUseCases} onTools={onViewToolRegistry} onDepartment={onViewDashboard} />

      <main className="app-container cs-page">
        {/* Started from an AI use: go back to it, where the card now shows as done. */}
        <button type="button" className="cs-back" onClick={leave}>{onReturn ? '← Back to the AI use' : '← My AI uses'}</button>
        <h1 className="cs-title">Course AI statement</h1>
        <p className="cs-intro">
          A ready-to-paste syllabus statement on how you use AI in a course and what students may use it for,
          built from what you recorded in RAISE.
        </p>

        <ol className="cs-steps" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}
              aria-current={i === step ? 'step' : undefined}>
              <span className="cs-step-num" aria-hidden="true">{i + 1}</span>
              <span>{s.title}</span>
            </li>
          ))}
        </ol>
        <p className="cs-visually-hidden" role="status" aria-live="polite">{announcement}</p>

        <section className="cs-card" aria-labelledby="cs-step-heading">
          <h2 id="cs-step-heading" className="cs-step-heading" tabIndex={-1} ref={headingRef}>
            <span className="cs-visually-hidden">Step {step + 1} of {STEPS.length}: </span>{STEPS[step].title}
          </h2>
          {body}
          {message && <p className="cs-message" role="status">{message}</p>}
          {options && !loadError && (
            <div className="cs-nav">
              {step > 0 && (
                <button type="button" className="btn-secondary" onClick={() => goTo(step - 1)} disabled={busy}>Back</button>
              )}
              {step < PREVIEW && (
                <button type="button" className="btn-primary" onClick={() => goTo(step + 1)} disabled={busy}>
                  {busy ? 'Building…' : step === PREVIEW - 1 ? 'Build statement' : 'Next'}
                </button>
              )}
              {step === PREVIEW && (
                <button type="button" className="btn-secondary" disabled={busy}
                  onClick={() => run(async () => { if (await saveTexts()) leave(); })}>Done</button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CourseStatementFlow;
