import { useState } from 'react';
import BrandMark from './BrandMark';
import { startDemo } from '../services/api';

function Landing({ onGetStarted, onDemoStarted }) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');

  async function handleTryDemo() {
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

      {/* Green header bar */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <BrandMark variant="lp" />
          <button className="lp-signin-btn" onClick={onGetStarted}>Sign In</button>
        </div>
      </header>

      {/* Gold accent bar */}
      <div className="lp-accent-bar"></div>

      {/* Hero — campus photo with green overlay */}
      <section className="lp-hero">
        <div className="lp-hero-overlay"></div>
        <div className="lp-hero-content">
        <h1 className="lp-hero-title">RAISE Ethics Toolkit</h1>
        <p className="lp-hero-subtitle">
          Using AI in academic work is unavoidable now, and the rules around it are easy to miss. If you're ever unsure you're using it the right way, RAISE has your back.
        </p>
        <div className="lp-hero-actions">
          <button className="lp-btn-hero" onClick={() => onGetStarted()}>Sign In to Get Started</button>
          <button
            className="lp-btn-hero lp-btn-hero-secondary"
            onClick={handleTryDemo}
            disabled={demoLoading}
            aria-busy={demoLoading}
          >
            {demoLoading ? 'Starting demo…' : 'Try Demo'}
          </button>
        </div>
        {demoError && <p className="lp-hero-error" role="alert">{demoError}</p>}
        <p className="lp-hero-note">Requires a USF email address (@usf.edu) to register.</p>
        </div>
      </section>

      {/* What this tool does */}
      <section className="lp-section lp-section-light">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">What is RAISE?</h2>
          <p className="lp-section-text">
            RAISE (Responsible AI Standards and Ethics) helps researchers, instructors, and administrators work through privacy, IRB, disclosure, and fairness questions when they use AI tools in their work. It provides guided checklists, a place to record what you decided, and a reference library of commonly used tools.
          </p>
          <div className="lp-features">
            <div className="lp-feature">
              <h3>Guided checklists</h3>
              <p>Checklists for your use covering IRB review, data classification, FERPA questions, disclosure planning, and more.</p>
            </div>
            <div className="lp-feature">
              <h3>Documentation & Reporting</h3>
              <p>Record what you checked and decided as you go. Export an AI use record with the history of your decisions for your files.</p>
            </div>
            <div className="lp-feature">
              <h3>Tool Library</h3>
              <p>Browse a reference library of tools with data handling details, guidance by use case, and records of how others at the institution have used them.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Who is this for?</h2>
          <div className="lp-audience-grid">
            <div className="lp-audience-card">
              <h3>Faculty and Principal Investigators</h3>
              <ul>
                <li>See which privacy, IRB, and disclosure questions apply to your research</li>
                <li>See what your team has reviewed and decided</li>
                <li>Generate documentation for IRB submissions</li>
                <li>Find guidance for specific tools and uses</li>
              </ul>
            </div>
            <div className="lp-audience-card">
              <h3>Graduate Students and Researchers</h3>
              <ul>
                <li>See which data handling steps to think about</li>
                <li>Understand when FERPA may apply to student data</li>
                <li>Document your work for reproducibility and transparency</li>
                <li>Work through the checklist items assigned to your role</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Supported use cases */}
      <section className="lp-section lp-section-light">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Supported AI uses</h2>
          <p className="lp-section-text">
            RAISE suggests a checklist for each of these kinds of AI use.
          </p>
          <div className="lp-usecases">
            {[
              'Qualitative Data Analysis',
              'Literature Review',
              'Writing and Editing',
              'Statistical Analysis',
              'Grant Proposal Writing',
              'Teaching Materials',
              'Grading and Assessment',
              'Administrative Tasks',
            ].map((uc) => (
              <span className="lp-usecase-tag" key={uc}>{uc}</span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Landing;
