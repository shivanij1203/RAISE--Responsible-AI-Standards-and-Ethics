import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const POSTER = '/media/raise-hero-7s-poster.jpg';
// Intrinsic size of the video, so the box is reserved before it loads.
const WIDTH = 1536;
const HEIGHT = 866;

// What the video shows, for screen reader users. The video itself is hidden
// from assistive technology because it has no audio or text of its own.
export const HERO_VIDEO_DESCRIPTION =
  'A professor, a researcher, and an admissions officer each start pasting student data into an AI chat. '
  + 'RAISE shows three checks first, the names and IDs are hidden, and each use is recorded.';

/**
 * Looping hero video with a pause/play button. With reduced motion, only the
 * poster frame. Either way, a visually hidden description says what it shows.
 */
function HeroVideo() {
  const [reduced] = useState(prefersReducedMotion);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  // Some browsers only autoplay when muted is set as a property, not just an attribute.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => setPaused(true));
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  }

  const description = <p className="hv-description">{HERO_VIDEO_DESCRIPTION}</p>;

  if (reduced) {
    return (
      <div className="hv-wrap">
        {description}
        <img className="hv" src={POSTER} width={WIDTH} height={HEIGHT} alt="" aria-hidden="true" />
      </div>
    );
  }

  const label = paused ? 'Play the background video' : 'Pause the background video';
  return (
    <div className="hv-wrap">
      {description}
      <video
        ref={videoRef}
        className="hv"
        width={WIDTH}
        height={HEIGHT}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER}
        aria-hidden="true"
        tabIndex={-1}
        onPause={() => setPaused(true)}
        onPlay={() => setPaused(false)}
      >
        <source src="/media/raise-hero-7s.webm" type="video/webm" />
        <source src="/media/raise-hero-7s.mp4" type="video/mp4" />
      </video>
      <button type="button" className="hv-toggle" onClick={toggle} aria-label={label} title={label}>
        {paused
          ? <Play size={18} aria-hidden="true" strokeWidth={2.25} />
          : <Pause size={18} aria-hidden="true" strokeWidth={2.25} />}
      </button>
    </div>
  );
}

export default HeroVideo;
