import { useEffect } from 'react';

const SAFETY_MS = 1500;

/** True when the visitor asked for less motion (or the check is unavailable). */
export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

/** True once any part of the element is at or above the bottom of the viewport. */
function reachedViewport(el) {
  return el.getBoundingClientRect().top < window.innerHeight;
}

/**
 * Fades `.reveal` elements inside the root in once, as they scroll into view.
 *
 * Content is visible by default. The hidden start state only applies once
 * this hook sets data-reveal="on" on the root, and only to elements still
 * below the viewport at that moment. Three paths reveal an element, so a fast
 * scroll, a jump, or a sticky section can never leave one hidden:
 * the IntersectionObserver, a scroll check that reveals anything at or above
 * the viewport, and a safety timer per element after it reaches the viewport.
 * @param {import('react').RefObject<HTMLElement>} rootRef
 */
export function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const pending = new Set(root.querySelectorAll('.reveal:not(.is-visible)'));
    const timers = new Map();

    const show = (el) => {
      el.classList.add('is-visible');
      pending.delete(el);
      clearTimeout(timers.get(el));
      timers.delete(el);
    };

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      [...pending].forEach(show);
      return undefined;
    }

    // Anything already on screen or above it never starts hidden.
    [...pending].filter(reachedViewport).forEach(show);

    const armSafety = (el) => {
      if (!timers.has(el)) timers.set(el, setTimeout(() => show(el), SAFETY_MS));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            show(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px 10% 0px', threshold: 0 },
    );
    pending.forEach((el) => observer.observe(el));

    let frame = 0;
    const check = () => {
      frame = 0;
      pending.forEach((el) => {
        if (!reachedViewport(el)) return;
        armSafety(el);
        // Jumped past it (it is above the viewport): show it at once.
        if (el.getBoundingClientRect().bottom < 0) show(el);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    root.dataset.reveal = 'on';

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      timers.forEach((t) => clearTimeout(t));
      delete root.dataset.reveal;
    };
  }, [rootRef]);
}
