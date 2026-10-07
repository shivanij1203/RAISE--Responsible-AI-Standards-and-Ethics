import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../constants/attribution';

/**
 * Text wordmark shown in every header and top bar.
 * @param {{ variant?: 'lp' | 'pl' }} props  'lp' for the larger landing and
 *   login header, 'pl' for the signed-in top bar.
 */
function BrandMark({ variant = 'pl' }) {
  return (
    <div className={`brand-mark brand-mark--${variant}`}>
      <span className="brand-mark-name">{PRODUCT_NAME}</span>
      <span className="brand-mark-subtitle">{PRODUCT_SUBTITLE}</span>
    </div>
  );
}

export default BrandMark;
