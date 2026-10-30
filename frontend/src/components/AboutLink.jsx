import { linkTo } from '../utils/routes';

/**
 * Link to a section of the landing page, such as /#about. Works from any
 * screen without reloading: the landing page scrolls to the section.
 * @param {{ label?: string, href?: string, className?: string }} props
 */
function AboutLink({ label = 'About', href = '/#about', className = '' }) {
  return (
    <a href={href} onClick={linkTo(href)} className={`about-link ${className}`}>
      {label}
    </a>
  );
}

export default AboutLink;
