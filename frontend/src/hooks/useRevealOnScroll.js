import { useEffect } from 'react';

/** True when the visitor asked for less motion (or the check is unavailable). */
export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

/**
 * Fades `.reveal` elements inside the root in once, as they scroll into view.
 * Sets data-reveal="on" on the root (which React leaves alone), so elements
 * start hidden only when JavaScript and motion are both available.
 * @param {import('react').RefObject<HTMLElement>} rootRef
 */
export function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    root.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    root.dataset.reveal = 'on';
    return () => observer.disconnect();
  }, [rootRef]);
}
