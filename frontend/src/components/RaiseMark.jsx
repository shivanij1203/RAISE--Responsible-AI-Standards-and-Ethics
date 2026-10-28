import { raiseMarkSvg } from '../constants/brandMark';

/**
 * The RAISE mark as inline SVG. Decorative: the wordmark next to it carries the name.
 * @param {{ tone?: 'light' | 'dark', size?: number, className?: string }} props
 */
function RaiseMark({ tone = 'light', size = 32, className = '' }) {
  return (
    <span
      className={`raise-mark ${className}`}
      // Static markup from our own constant, not user content.
      dangerouslySetInnerHTML={{ __html: raiseMarkSvg({ tone, size }) }}
    />
  );
}

export default RaiseMark;
