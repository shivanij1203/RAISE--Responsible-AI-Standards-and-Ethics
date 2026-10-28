import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../hooks/useRevealOnScroll';

const POSTER = '/media/raise-hero-7s-poster.jpg';
// Intrinsic size of the video, so the box is reserved before it loads.
const WIDTH = 1536;
const HEIGHT = 866;

/** Decorative looping hero video. With reduced motion, only the poster frame. */
function HeroVideo() {
  const [reduced] = useState(prefersReducedMotion);
  const videoRef = useRef(null);

  // Some browsers only autoplay when muted is set as a property, not just an attribute.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  if (reduced) {
    return <img className="hv" src={POSTER} width={WIDTH} height={HEIGHT} alt="" aria-hidden="true" />;
  }

  return (
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
    >
      <source src="/media/raise-hero-7s.webm" type="video/webm" />
      <source src="/media/raise-hero-7s.mp4" type="video/mp4" />
    </video>
  );
}

export default HeroVideo;
