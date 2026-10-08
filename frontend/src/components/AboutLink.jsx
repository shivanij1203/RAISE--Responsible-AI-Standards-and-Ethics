import { useOpenAbout } from '../context/aboutContext';

/** Text link that opens the About this prototype panel. */
function AboutLink({ label = 'About', className = '' }) {
  const openAbout = useOpenAbout();
  return (
    <button type="button" className={`about-link ${className}`} onClick={openAbout}>
      {label}
    </button>
  );
}

export default AboutLink;
