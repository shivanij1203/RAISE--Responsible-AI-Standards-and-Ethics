import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import BrandMark from '../BrandMark';
import './landingNav.css';

const NAV_SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'try', label: 'Try it' },
  { id: 'about', label: 'About' },
];

/** Height of the prototype banner when it stays on screen (fixed or sticky). */
function bannerOffset() {
  const banner = document.querySelector('.prototype-banner');
  if (!banner) return 0;
  const { position } = getComputedStyle(banner);
  return position === 'fixed' || position === 'sticky' ? banner.getBoundingClientRect().height : 0;
}

/** The last section whose top has passed the upper third of the screen. */
function currentSection() {
  let current = null;
  NAV_SECTIONS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) current = id;
  });
  return current;
}

/**
 * Sticky landing navbar: section links with the current one highlighted,
 * and one action on the right. On phones the links fold into a menu.
 * @param {{ action: import('react').ReactNode }} props
 */
function LandingNav({ action }) {
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const navRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(currentSection());
      setTop(bannerOffset());
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  // Close the phone menu with Escape or a tap outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onPointer = (e) => { if (!navRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <header className="ln" ref={navRef} style={{ top }}>
      <div className="ln-inner">
        <a href="#top" className="ln-brand" aria-label="RAISE, back to top">
          <BrandMark variant="lp" />
        </a>
        <nav aria-label="Sections" className={`ln-links ${open ? 'is-open' : ''}`} id="ln-links">
          {NAV_SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`ln-link ${active === id ? 'is-active' : ''}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ln-action">{action}</div>
        <button
          type="button"
          className="ln-menu"
          aria-expanded={open}
          aria-controls="ln-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

export default LandingNav;
