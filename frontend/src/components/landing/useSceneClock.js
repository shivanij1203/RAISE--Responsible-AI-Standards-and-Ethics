import { useCallback, useEffect, useRef, useState } from 'react';

const PUSH_MS = 40;

/**
 * Elapsed scene time in ms. Advances on animation frames only while
 * `running`, so pausing freezes the scene where it is. `seek(ms)` jumps.
 * @param {boolean} running
 * @returns {[number, (ms: number) => void]}
 */
export function useSceneClock(running) {
  const [now, setNow] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    let frame;
    let last = null;
    let pushed = elapsed.current;
    const tick = (ts) => {
      // Frame timestamps can start before this effect ran; never run backwards.
      if (last !== null) elapsed.current += Math.max(0, ts - last);
      last = ts;
      if (Math.abs(elapsed.current - pushed) >= PUSH_MS) {
        pushed = elapsed.current;
        setNow(elapsed.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const seek = useCallback((ms) => {
    elapsed.current = Math.max(0, ms);
    setNow(elapsed.current);
  }, []);

  return [now, seek];
}
