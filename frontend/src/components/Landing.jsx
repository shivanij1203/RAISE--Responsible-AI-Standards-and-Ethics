import { useState } from 'react';
import BrandMark from './BrandMark';
import AboutLink from './AboutLink';
import ExampleCards from './landing/ExampleCards';
import ExampleOutputs from './landing/ExampleOutputs';
import { startDemo } from '../services/api';
import { ACADEMIC_ADVISOR, BUILDER_CREDENTIAL, BUILDER_NAME, LAB_NAME } from '../constants/attribution';
import { HOW_IT_DECIDES, WHAT_RAISE_IS_NOT } from '../constants/aboutCopy';
import { DEMO_EXAMPLES } from '../constants/demoExamples';

const SUPPORTED_USES = [
  'Qualitative Data Analysis',
  'Literature Review',
  'Writing and Editing',
  'Statistical Analysis',
  'Grant Proposal Writing',
  'Teaching Materials',
  'Grading and Assessment',
  'Administrative Tasks',
];

const STEPS = [
  { title: 'Describe', text: 'Write one sentence about how you use AI.' },
  { title: 'See what applies', text: 'RAISE lists the privacy, IRB, disclosure, and fairness items for that use.' },
  { title: 'Work through it', text: 'Scan a sample file, edit a suggested answer, or answer in your own words.' },
  { title: 'Keep the record', text: 'Copy a disclosure statement or export a record of what you decided.' },
];

// Static preview of the Teaching example. Labels are the real checklist
// labels RAISE generates for this use (checkpoint_generator.py).
const PREVIEW_SENTENCE = DEMO_EXAMPLES.find((ex) => ex.key === 'teaching')?.sentence || '';
const PREVIEW_ITEMS = [
  { label: 'Check whether FERPA applies to this data', tag: 'FERPA' },
  { label: 'Check AI grades for fairness', tag: 'Fairness' },
  { label: 'Share grading criteria with students', tag: 'Transparency' },
];

function ProductPreview() {
  return (
    <div className="lp-preview" aria-label="Example of what RAISE shows for one AI use">
      <div className="lp-preview-card lp-preview-sentence">
        <span className="lp-preview-kicker">Your AI use</span>
        <p>&ldquo;{PREVIEW_SENTENCE}&rdquo;</p>
      </div>
      <div className="lp-preview-card lp-preview-items">
        <span className="lp-preview-kicker">RAISE suggests checking</span>
        <ul>
          {PREVIEW_ITEMS.map((item) => (
            <li key={item.label}>
              <span className="lp-preview-box" aria-hidden="true"></span>
              <span className="lp-preview-label">{item.label}</span>
              <span className="lp-preview-tag">{item.tag}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="lp-preview-record">
        <span className="lp-preview-record-dot" aria-hidden="true"></span>
        Your record: what you reviewed and decided
      </div>
    </div>
  );
}

/**
 * @param {{
 *   onGetStarted: () => void,
 *   onDemoStarted: (user: object) => void,
 *   onExampleStarted: (user: object, example: object) => void,
 * }} props
 */
function Landing({ onGetStarted, onDemoStarted, onExampleStarted }) {
  // Which button started the demo: 'main', an example key, or null.
  const [busy, setBusy] = useState(null);
  const [demoError, setDemoError] = useState('');

  async function startSession(example) {
    setDemoError('');
    setBusy(example ? example.key : 'main');
    try {
      const data = await startDemo();
      if (example) onExampleStarted(data.user, example);
      else onDemoStarted(data.user);
    } catch (err) {
      const status = err.response?.status;
      setDemoError(
        status === 429
          ? 'Too many demo sessions were started from this network. Please try again in an hour.'
          : 'We could not start a demo session. Please try again.'
      );
      setBusy(null);
    }
  }

  const tryButton = (
    <button
      className="lp-btn-hero"
      onClick={() => startSession(null)}
      disabled={busy !== null}
      aria-busy={busy === 'main'}
    >
      {busy === 'main' ? 'Starting…' : 'Try an example'}
    </button>
  );

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-header-inner">
          <BrandMark variant="lp" />
          <AboutLink className="about-link-topbar" />
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div className="lp-hero-content">
            <h1 className="lp-hero-title">RAISE: a guided checklist for using AI in teaching and research</h1>
            <p className="lp-hero-subtitle">
              Describe how you use AI. RAISE shows what to check, like student privacy, IRB coverage,
              and disclosure. It helps you work through each item and gives you a written record.
            </p>
            <p className="lp-hero-meta">Research prototype · {LAB_NAME} · Sample data only</p>
            <div className="lp-hero-actions">{tryButton}</div>
            {demoError && <p className="lp-hero-error" role="alert">{demoError}</p>}
            <p className="lp-hero-signin">
              Already have an account?{' '}
              <button type="button" className="lp-text-link" onClick={() => onGetStarted()}>Sign in</button>
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-try-title">
        <div className="lp-band-inner">
          <h2 className="lp-band-title" id="lp-try-title">Try one of these</h2>
          <p className="lp-band-text">Each example opens a private demo with made-up data.</p>
          <ExampleCards onTry={(ex) => startSession(ex)} busyKey={busy} />
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-how-title">
        <div className="lp-band-inner">
          <h2 className="lp-band-title" id="lp-how-title">How it works</h2>
          <ol className="lp-steps">
            {STEPS.map((step, i) => (
              <li className="lp-step" key={step.title}>
                <span className="lp-step-num" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-outputs-title">
        <div className="lp-band-inner">
          <h2 className="lp-band-title" id="lp-outputs-title">What you walk away with</h2>
          <p className="lp-band-text">
            From the Teaching example, after one dataset scan and one confirmed suggested answer.
          </p>
          <ExampleOutputs />
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-why-title">
        <div className="lp-band-inner lp-narrow">
          <h2 className="lp-band-title" id="lp-why-title">Why RAISE exists</h2>
          <p className="lp-why">
            Faculty already use AI to grade, give feedback, and analyze research data. The rules
            that apply, like FERPA, IRB protocols, and disclosure expectations, are spread across
            separate policies and offices. RAISE turns them into one checklist for each use and
            keeps a record of what you decided.
          </p>
        </div>
      </section>

      <section className="lp-band lp-band-quiet" aria-label="What RAISE is and is not">
        <div className="lp-band-inner">
          <div className="lp-trust">
            <div className="lp-trust-block">
              <h2>What RAISE is not</h2>
              <p>{WHAT_RAISE_IS_NOT}</p>
            </div>
            <div className="lp-trust-block">
              <h2>How it decides</h2>
              <p>{HOW_IT_DECIDES}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-uses-title">
        <div className="lp-band-inner">
          <h2 className="lp-band-title" id="lp-uses-title">Supported AI uses</h2>
          <p className="lp-band-text">RAISE suggests a checklist for each of these kinds of AI use.</p>
          <ul className="lp-uses">
            {SUPPORTED_USES.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-who-title">
        <div className="lp-band-inner lp-narrow">
          <h2 className="lp-band-title" id="lp-who-title">Who&rsquo;s behind it</h2>
          <p className="lp-who">
            Built by {BUILDER_NAME}, {BUILDER_CREDENTIAL}. Developed with guidance from
            the {LAB_NAME}. Academic advisor: {ACADEMIC_ADVISOR}.
          </p>
        </div>
      </section>

      <section className="lp-cta" aria-label="Try RAISE">
        <div className="lp-band-inner lp-cta-inner">
          <p className="lp-cta-line">See what RAISE flags for your own AI use in two minutes.</p>
          {tryButton}
        </div>
      </section>
    </div>
  );
}

export default Landing;
