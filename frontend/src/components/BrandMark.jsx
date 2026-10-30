import RaiseMark from './RaiseMark';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../constants/attribution';
import { linkTo } from '../utils/routes';

/**
 * The RAISE mark plus wordmark, shown in every header and top bar.
 * @param {{ variant?: 'lp' | 'pl' }} props  'lp' for the landing and sign-in
 *   header, 'pl' for the signed-in top bar. Both sit on the deep green bar.
 *   In the signed-in top bar the mark links to the landing page.
 */
function BrandMark({ variant = 'pl' }) {
  const content = (
    <>
      <RaiseMark tone="dark" size={34} className="brand-mark-icon" />
      <span className="brand-mark-text">
        <span className="brand-mark-name">{PRODUCT_NAME}</span>
        <span className="brand-mark-subtitle">{PRODUCT_SUBTITLE}</span>
      </span>
    </>
  );
  if (variant === 'pl') {
    return (
      <a href="/" onClick={linkTo('/')} className={`brand-mark brand-mark--${variant} brand-mark-link`}
        aria-label="RAISE home page">
        {content}
      </a>
    );
  }
  return <div className={`brand-mark brand-mark--${variant}`}>{content}</div>;
}

export default BrandMark;
