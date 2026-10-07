import BrandMark from './BrandMark';

function Landing({ onGetStarted }) {
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
          <button className="lp-btn-hero lp-btn-hero-secondary" onClick={() => onGetStarted({ prefill: true })}>Try Demo (with auto-fill credentials)</button>
        </div>
        <p className="lp-hero-note">Requires a USF email address (@usf.edu) to register.</p>
        </div>
      </section>

      {/* What this tool does */}
      <section className="lp-section lp-section-light">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">What is RAISE?</h2>
          <p className="lp-section-text">
            RAISE (Responsible AI Standards and Ethics) helps researchers, instructors, and administrators navigate compliance requirements when using technology tools in their work. The platform provides structured checklists, documentation support, and a reference library of commonly used tools.
          </p>
          <div className="lp-features">
            <div className="lp-feature">
              <h3>Compliance Checklists</h3>
              <p>Personalized checklists covering IRB review, data classification, FERPA compliance, disclosure planning, and more based on your specific use case.</p>
            </div>
            <div className="lp-feature">
              <h3>Documentation & Reporting</h3>
              <p>Log your compliance steps as you go. Generate a formatted report with audit trail, risk assessment, and framework coverage for your records.</p>
            </div>
            <div className="lp-feature">
              <h3>Tool Library</h3>
              <p>Browse a reference library of tools with data handling details, compliance guidance by use case, and records of how others at the institution have used them.</p>
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
                <li>Understand compliance implications for your research protocol</li>
                <li>Review compliance status across your team</li>
                <li>Generate documentation for IRB submissions</li>
                <li>Access compliance guidance for specific tools and use cases</li>
              </ul>
            </div>
            <div className="lp-audience-card">
              <h3>Graduate Students and Researchers</h3>
              <ul>
                <li>Know exactly what data handling steps are required</li>
                <li>Understand FERPA compliance when working with student data</li>
                <li>Document your work for reproducibility and transparency</li>
                <li>Complete compliance checkpoints assigned to your role</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Supported use cases */}
      <section className="lp-section lp-section-light">
        <div className="lp-section-inner">
          <h2 className="lp-section-title">Supported Use Cases</h2>
          <p className="lp-section-text">
            RAISE generates tailored compliance checklists for each of the following scenarios.
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
