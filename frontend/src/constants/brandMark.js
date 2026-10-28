// The RAISE mark: a bookmark (a record you keep) with a rising check
// (guidance you work through) and a small ochre dot at the top of the check.
// One source for the in-app mark, the PDF record header, and the favicon
// (public/raise-mark.svg is this same drawing with the light tone).

const TONES = {
  // On light backgrounds: green bookmark, white check.
  light: { body: '#006747', check: '#FFFFFF', dot: '#E3A23C' },
  // On the deep green top bar: white bookmark, green check.
  dark: { body: '#FFFFFF', check: '#006747', dot: '#E3A23C' },
};

/**
 * @param {{ tone?: 'light' | 'dark', size?: number }} options
 * @returns {string} SVG markup
 */
export function raiseMarkSvg({ tone = 'light', size = 32 } = {}) {
  const c = TONES[tone] || TONES.light;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">`
    + `<path d="M8 2.5h16A3 3 0 0 1 27 5.5v23.4a.9.9 0 0 1-1.38.76L16 23.4l-9.62 6.26A.9.9 0 0 1 5 28.9V5.5A3 3 0 0 1 8 2.5z" fill="${c.body}"/>`
    + `<path d="M10.4 14.6l4.1 4.1 7.6-9.4" fill="none" stroke="${c.check}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="23.7" cy="7.2" r="1.9" fill="${c.dot}"/>`
    + '</svg>';
}

/** Data URI for places that need an <img> (the PDF record header). */
export function raiseMarkDataUri(options) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raiseMarkSvg(options))}`;
}
