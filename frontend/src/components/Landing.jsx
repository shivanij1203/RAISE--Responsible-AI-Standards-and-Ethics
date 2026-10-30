import { useEffect, useRef } from 'react';
import LandingNav from './landing/LandingNav';
import HeroHeadline from './landing/HeroHeadline';
import HeroVideo from './landing/HeroVideo';
import HowItWorks from './landing/HowItWorks';
import TryIt from './landing/TryIt';
import SupportedUses from './landing/SupportedUses';
import AboutSection from './landing/AboutSection';
import { LAB_NAME } from '../constants/attribution';
import { DEMO_EXAMPLES } from '../constants/demoExamples';
import { prefersReducedMotion, useRevealOnScroll } from '../hooks/useRevealOnScroll';

// The visitor's own sentence goes through the same path as an example.
const CUSTOM_KEY = 'custom';
const TRY_INPUT = 'try-input';
// "Try an example" in the nav and hero opens the Teaching example directly.
const HERO_EXAMPLE = { ...DEMO_EXAMPLES.find((ex) => ex.key === 'teaching'), key: 'hero-teaching' };

/**
 * @param {{
 *   signedIn: boolean,
 *   isDemo: boolean,
 *   onOpenApp: () => void,
 *   onUseInAccount: (example: object) => void,
 *   onGetStarted: () => void,
 *   onBuildDemo: (example: object) => void,
 * }} props
 */
function Landing({ signedIn, isDemo, onOpenApp, onUseInAccount, onGetStarted, onBuildDemo }) {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  // Arriving at /#about (or another section) from elsewhere: go to it.
  useEffect(() => {
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView();
  }, []);

  // Demo visitors (and anyone signed out) get the AI use built for them,
  // straight to its activity page. A signed-in, non-demo user is adding real
  // work, so Quick Add opens pre-filled in their own account instead.
  function startSession(example) {
    if (signedIn && !isDemo) onUseInAccount(example);
    else onBuildDemo(example);
  }

  function workThrough(sentence) {
    startSession({ key: CUSTOM_KEY, sentence, name: '', category: '' });
  }

  function goToTry() {
    document.getElementById('try')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    document.getElementById(TRY_INPUT)?.focus({ preventScroll: true });
  }

  const tryExampleButton = (className) => (
    <button type="button" className={className} onClick={() => startSession(HERO_EXAMPLE)}>
      Try an example
    </button>
  );

  return (
    <div className="lp" id="top" ref={rootRef}>
      <LandingNav
        action={signedIn
          ? <button type="button" className="lp-btn-light" onClick={onOpenApp}>Go to My AI uses</button>
          : tryExampleButton('lp-btn-light')}
      />

      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div className="lp-hero-content">
            <HeroHeadline />
            <p className="lp-hero-subtitle">
              Describe how you use AI. RAISE shows what to check, like student privacy, IRB coverage,
              and disclosure. It helps you work through each item and gives you a written record.
            </p>
            <p className="lp-hero-meta">Research prototype · {LAB_NAME} · Sample data only</p>
            <div className="lp-hero-actions">
              <button type="button" className="lp-btn-light" onClick={goToTry}>Check your own AI use</button>
              {tryExampleButton('lp-btn-outline-light')}
            </div>
            {!signedIn && (
              <p className="lp-hero-signin">
                Already have an account?{' '}
                <button type="button" className="lp-text-link" onClick={() => onGetStarted()}>Sign in</button>
              </p>
            )}
          </div>
          <HeroVideo />
        </div>
      </section>

      <HowItWorks />

      <section className="lp-band lp-own" id="try" aria-labelledby="try-title">
        <div className="lp-band-inner lp-own-grid">
          <div className="lp-own-intro">
            <h2 className="lp-band-title reveal" id="try-title">Check your own AI use</h2>
            <p className="lp-band-text reveal">
              Pick an example or write your own sentence. RAISE lists what to check, and you can open
              any item to see what it means, why it matters, and how to address it. Nothing you type
              is saved.
            </p>
          </div>
          <TryIt
            onWorkThrough={workThrough}
            onStartExample={(ex) => startSession(ex)}
            busyKey={null}
            inputId={TRY_INPUT}
          />
        </div>
      </section>

      <SupportedUses />

      <AboutSection />

      <section className="lp-cta" aria-label="Try RAISE">
        <div className="lp-band-inner lp-cta-inner">
          <p className="lp-cta-line">See what RAISE flags for your own AI use in two minutes.</p>
          <div className="lp-cta-actions">
            {tryExampleButton('lp-btn-light')}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
