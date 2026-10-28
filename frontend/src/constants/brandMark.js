// The RAISE mark: a shield built from list lines, the first one checked
// (protection through a checklist). One source for the in-app mark, the PDF
// record header, and the favicon (public/raise-mark.svg is this same drawing
// with the light tone).

const TONES = {
  // On light backgrounds: green shield, white lines.
  light: { body: '#006747', lines: '#FFFFFF', check: '#E3A23C' },
  // On the deep green top bar: white shield, green lines.
  dark: { body: '#FFFFFF', lines: '#006747', check: '#E3A23C' },
};

/**
 * @param {{ tone?: 'light' | 'dark', size?: number }} options
 * @returns {string} SVG markup
 */
export function raiseMarkSvg({ tone = 'light', size = 32 } = {}) {
  const c = TONES[tone] || TONES.light;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">`
    + `<path d="M16 2.5l11 4v8.5c0 7.2-4.7 12.3-11 14.5C9.7 27.3 5 22.2 5 15V6.5z" fill="${c.body}"/>`
    + `<path d="M10.5 11.5l2.4 2.4 4.6-5" fill="none" stroke="${c.check}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M19.5 12h2.5M10.5 17.5h11.5M12 23h8" fill="none" stroke="${c.lines}" stroke-width="2.6" stroke-linecap="round"/>`
    + '</svg>';
}

/** Data URI for places that need an <img> (the PDF record header). */
export function raiseMarkDataUri(options) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raiseMarkSvg(options))}`;
}
