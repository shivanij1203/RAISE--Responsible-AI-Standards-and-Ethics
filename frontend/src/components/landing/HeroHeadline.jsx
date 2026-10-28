import { useLayoutEffect, useRef } from 'react';

const HEADLINE = 'Using AI in your teaching or research? See what to check first.';
const WORDS = HEADLINE.split(' ');

/**
 * The hero headline, revealed one rendered line at a time. Words are grouped
 * into lines by measuring where they wrap, so it works at any width. Motion
 * only runs under prefers-reduced-motion: no-preference (see landing.css).
 */
function HeroHeadline() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let line = -1;
    let lastTop = null;
    el.querySelectorAll('.hh-word').forEach((word) => {
      if (word.offsetTop !== lastTop) {
        line += 1;
        lastTop = word.offsetTop;
      }
      word.style.setProperty('--line', line);
    });
    el.classList.add('is-measured');
  }, []);

  return (
    <h1 className="lp-hero-title hh" ref={ref} aria-label={HEADLINE}>
      {WORDS.map((word, i) => (
        <span key={i} aria-hidden="true">
          <span className="hh-word">{word}</span>{i < WORDS.length - 1 ? ' ' : ''}
        </span>
      ))}
    </h1>
  );
}

export default HeroHeadline;
