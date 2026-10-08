import { useState } from 'react';
import BrandMark from './BrandMark';
import AboutLink from './AboutLink';
import { startDemo } from '../services/api';
import { LAB_NAME } from '../constants/attribution';
import { HOW_IT_DECIDES, HOW_IT_WORKS, WHAT_RAISE_IS_NOT } from '../constants/aboutCopy';

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

const EXPLAINERS = [
  { title: 'How it works', text: HOW_IT_WORKS },
  { title: 'What RAISE is not', text: WHAT_RAISE_IS_NOT },
  { title: 'How it decides', text: HOW_IT_DECIDES },
];

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

      <div className="lp-accent-bar"></div>

      <section className="lp-hero">
        <div className="lp-hero-overlay"></div>
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
      </section>

      <section className="lp-section lp-section-light">
        <div className="lp-section-inner">
          <div className="lp-explainers">
            {EXPLAINERS.map((block) => (
              <div className="lp-explainer" key={block.title}>
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Supported AI uses</h2>
          <p className="lp-section-text">
            RAISE suggests a checklist for each of these kinds of AI use.
          </p>
          <div className="lp-usecases">
            {SUPPORTED_USES.map((uc) => (
              <span className="lp-usecase-tag" key={uc}>{uc}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
