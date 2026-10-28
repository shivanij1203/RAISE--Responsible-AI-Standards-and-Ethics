import { useState } from 'react';
import BrandMark from './BrandMark';
import AboutLink from './AboutLink';
import { startDemo } from '../services/api';
import { LAB_NAME } from '../constants/attribution';
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

function Landing({ onGetStarted, onDemoStarted }) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  async function handleTryExample() {
    setDemoError('');
    setDemoLoading(true);
    try {
      const data = await startDemo();
      onDemoStarted(data.user);
    } catch (err) {
      const status = err.response?.status;
      setDemoError(
        status === 429
          ? 'Too many demo sessions were started from this network. Please try again in an hour.'
          : 'We could not start a demo session. Please try again.'
      );
      setDemoLoading(false);
    }
  }

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
            <div className="lp-hero-actions">
              <button
                className="lp-btn-hero"
                onClick={handleTryExample}
                disabled={demoLoading}
                aria-busy={demoLoading}
              >
                {demoLoading ? 'Starting…' : 'Try an example'}
              </button>
            </div>
            {demoError && <p className="lp-hero-error" role="alert">{demoError}</p>}
            <p className="lp-hero-signin">
              Already have an account?{' '}
              <button type="button" className="lp-text-link" onClick={() => onGetStarted()}>Sign in</button>
            </p>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-band-inner">
          <h2 className="lp-band-title">How it works</h2>
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

      <section className="lp-band lp-band-quiet">
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

      <section className="lp-band">
        <div className="lp-band-inner">
          <h2 className="lp-band-title">Supported AI uses</h2>
          <p className="lp-band-text">RAISE suggests a checklist for each of these kinds of AI use.</p>
          <ul className="lp-uses">
            {SUPPORTED_USES.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Landing;
