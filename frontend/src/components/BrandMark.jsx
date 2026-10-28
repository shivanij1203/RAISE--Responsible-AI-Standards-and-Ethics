import RaiseMark from './RaiseMark';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../constants/attribution';

/**
 * The RAISE mark plus wordmark, shown in every header and top bar.
 * @param {{ variant?: 'lp' | 'pl' }} props  'lp' for the landing and sign-in
 *   header, 'pl' for the signed-in top bar. Both sit on the deep green bar.
 */
function BrandMark({ variant = 'pl' }) {
  return (
    <div className={`brand-mark brand-mark--${variant}`}>
      <RaiseMark tone="dark" size={34} className="brand-mark-icon" />
      <span className="brand-mark-text">
        <span className="brand-mark-name">{PRODUCT_NAME}</span>
        <span className="brand-mark-subtitle">{PRODUCT_SUBTITLE}</span>
      </span>
    </div>
  );
}

export default BrandMark;
