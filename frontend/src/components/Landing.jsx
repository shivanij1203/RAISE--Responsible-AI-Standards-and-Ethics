import { useRef, useState } from 'react';
import BrandMark from './BrandMark';
import AboutLink from './AboutLink';
import LiveHero from './landing/LiveHero';
import HeroHeadline from './landing/HeroHeadline';
import ExampleCards from './landing/ExampleCards';
import HeroLoop from './landing/HeroLoop';
import SupportedUses from './landing/SupportedUses';
import WhoBehind from './landing/WhoBehind';
import { startDemo } from '../services/api';
import { LAB_NAME } from '../constants/attribution';
import { HOW_IT_DECIDES, WHAT_RAISE_IS_NOT } from '../constants/aboutCopy';
import { DEMO_EXAMPLES } from '../constants/demoExamples';
import { prefersReducedMotion, useRevealOnScroll } from '../hooks/useRevealOnScroll';

// The visitor's own sentence goes through the same path as an example card.
const CUSTOM_KEY = 'custom';
const TRY_OWN_INPUT = 'try-own-input';
// The hero's "Try an example" opens the Teaching example directly.
const HERO_EXAMPLE = { ...DEMO_EXAMPLES.find((ex) => ex.key === 'teaching'), key: 'hero-teaching' };

/**
 * @param {{
 *   onGetStarted: () => void,
 *   onDemoStarted: (user: object) => void,
 *   onExampleStarted: (user: object, example: object) => void,
 * }} props
 */
function Landing({ onGetStarted, onDemoStarted, onExampleStarted }) {
  // Which button started the demo: 'main', an example key, 'custom', or null.
  const [busy, setBusy] = useState(null);
  const [demoError, setDemoError] = useState('');
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

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

  function workThrough(sentence) {
    startSession({ key: CUSTOM_KEY, sentence, name: '', category: '' });
  }

  function goToOwnSentence() {
    const section = document.getElementById('try-own');
    if (!section) return;
    section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    document.getElementById(TRY_OWN_INPUT)?.focus({ preventScroll: true });
  }

  const errorLine = demoError && <p className="lp-hero-error" role="alert">{demoError}</p>;

  return (
    <div className="lp" ref={rootRef}>
      <header className="lp-header">
        <div className="lp-header-inner">
          <BrandMark variant="lp" />
          <AboutLink className="about-link-topbar" />
        </div>
      </header>

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
              <button type="button" className="lp-btn-light" onClick={goToOwnSentence}>
                Try it with your own sentence
              </button>
              <button
                type="button"
                className="lp-btn-outline-light"
                onClick={() => startSession(HERO_EXAMPLE)}
                disabled={busy !== null}
                aria-busy={busy === HERO_EXAMPLE.key}
              >
                {busy === HERO_EXAMPLE.key ? 'Starting…' : 'Try an example'}
              </button>
            </div>
            {errorLine}
            <p className="lp-hero-signin">
              Already have an account?{' '}
              <button type="button" className="lp-text-link" onClick={() => onGetStarted()}>Sign in</button>
            </p>
          </div>
          <HeroLoop />
        </div>
      </section>

      <section className="lp-band lp-own" id="try-own" aria-labelledby="lp-own-title">
        <div className="lp-band-inner lp-own-grid">
          <div className="lp-own-intro">
            <h2 className="lp-band-title reveal" id="lp-own-title">Try it with your own sentence</h2>
            <p className="lp-band-text reveal">
              Write how you use AI in one sentence. RAISE lists what to check, and you can open any item
              to see what it means, why it matters, and how to address it. Nothing you type is saved.
            </p>
          </div>
          <LiveHero onWorkThrough={workThrough} busy={busy === CUSTOM_KEY} inputId={TRY_OWN_INPUT} />
        </div>
      </section>

      <section className="lp-band" aria-labelledby="lp-try-title">
        <div className="lp-band-inner">
          <h2 className="lp-band-title reveal" id="lp-try-title">Try one of these</h2>
          <p className="lp-band-text reveal">Each example opens a private demo with made-up data.</p>
          <ExampleCards onTry={(ex) => startSession(ex)} busyKey={busy} />
        </div>
      </section>

      <section className="lp-band lp-band-quiet" aria-label="What RAISE is and is not">
        <div className="lp-band-inner">
          <div className="lp-trust reveal">
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

      <SupportedUses />

      <WhoBehind />

      <section className="lp-cta" aria-label="Try RAISE">
        <div className="lp-band-inner lp-cta-inner">
          <p className="lp-cta-line">See what RAISE flags for your own AI use in two minutes.</p>
          <div className="lp-cta-actions">
            <button
              className="lp-btn-light"
              onClick={() => startSession(null)}
              disabled={busy !== null}
              aria-busy={busy === 'main'}
            >
              {busy === 'main' ? 'Starting…' : 'Try an example'}
            </button>
            {errorLine}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
