/**
 * Link to the About section of the landing page. Works from any screen:
 * App opens the landing page for /#about.
 * @param {{ label?: string, href?: string, className?: string }} props
 */
function AboutLink({ label = 'About', href = '/#about', className = '' }) {
  return (
    <a href={href} className={`about-link ${className}`}>
      {label}
    </a>
  );
}

export default AboutLink;
