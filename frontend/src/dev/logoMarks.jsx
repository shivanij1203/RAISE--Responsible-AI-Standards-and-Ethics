// Four logo ideas for RAISE, for review only. Each mark is drawn on a 32 x 32
// grid with thick strokes so it still reads at 16px. Not used in the app yet.

const GREEN = '#006747';
const OCHRE = '#E3A23C';
const WHITE = '#FFFFFF';

/** Colors for a mark on a light background or on the green brand color. */
function palette(tone) {
  return tone === 'dark'
    ? { main: WHITE, accent: OCHRE, cut: GREEN }
    : { main: GREEN, accent: OCHRE, cut: WHITE };
}

/** 1. The "R" whose leg is a check mark. */
export function CheckR({ tone, size }) {
  const c = palette(tone);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 27V5h8.5a6 6 0 0 1 0 12H8" fill="none" stroke={c.main} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 17.5l4.2 5L27.5 9" fill="none" stroke={c.accent} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 2. A stack of checklist lines that forms an upward arrow. */
export function RisingList({ tone, size }) {
  const c = palette(tone);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5l9 9h-5.5" fill="none" stroke={c.accent} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.5l-9 9h5.5" fill="none" stroke={c.accent} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12" y="15" width="8" height="3.6" rx="1.8" fill={c.main} />
      <rect x="9" y="21" width="14" height="3.6" rx="1.8" fill={c.main} />
      <rect x="6" y="27" width="20" height="3.6" rx="1.8" fill={c.main} />
    </svg>
  );
}

/** 3. A shield made of list lines, the top line a check. */
export function ListShield({ tone, size }) {
  const c = palette(tone);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2.5l11 4v8.5c0 7.2-4.7 12.3-11 14.5C9.7 27.3 5 22.2 5 15V6.5z" fill={c.main} />
      <path d="M10.5 11.5l2.4 2.4 4.6-5" fill="none" stroke={c.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 12h2.5M10.5 17.5h11.5M12 23h8" fill="none" stroke={c.cut} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** 4. An open book with a check rising from the pages. */
export function BookCheck({ tone, size }) {
  const c = palette(tone);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3.5 13.5c4.5-1.6 8.7-1 12.5 1.8 3.8-2.8 8-3.4 12.5-1.8v14c-4.5-1.6-8.7-1-12.5 1.8-3.8-2.8-8-3.4-12.5-1.8z" fill={c.main} />
      <path d="M16 15.3v14" stroke={c.cut} strokeWidth="1.6" />
      <path d="M9.5 6.5l4.5 4.5 9-9" fill="none" stroke={c.accent} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
