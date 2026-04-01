import { useRef, useEffect } from 'react';

/**
 * Tracks scroll velocity with smooth decay for natural-feeling warp effects
 * Returns a ref with the current smoothed velocity value
 */
export function useScrollVelocity() {
  const scrollVelRef = useRef(0);
  const rawDeltaRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number>();

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;
      // Normalize the delta - adjust divisor to tune sensitivity
      rawDeltaRef.current = delta / 100;
      lastScrollYRef.current = currentY;
    };

    const animate = () => {
      // Lerp toward 0 for smooth decay
      scrollVelRef.current += (rawDeltaRef.current - scrollVelRef.current) * 0.1;
      // Decay the raw delta
      rawDeltaRef.current *= 0.9;
      
      rafIdRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return scrollVelRef;
}
