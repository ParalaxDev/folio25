import { useEffect, useState, useRef } from "react";

interface UseViewportVisibilityOptions {
  /** The percentage of the viewport height that defines the "middle zone" (default: 0.5 for 50%) */
  middleZonePercentage?: number;
  /** Threshold for intersection observer (default: 0) */
  threshold?: number;
}

export function useViewportVisibility(
  options: UseViewportVisibilityOptions = {},
) {
  const { middleZonePercentage = 0.5, threshold = 0 } = options;

  const [isInMiddleZone, setIsInMiddleZone] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          setIsInMiddleZone(false);
          return;
        }

        const viewportHeight = window.innerHeight;
        const middleZoneStart =
          viewportHeight * ((1 - middleZonePercentage) / 2);
        const middleZoneEnd = viewportHeight;

        const rect = entry.boundingClientRect;
        const elementCenter = rect.top + rect.height / 2;

        const inMiddleZone =
          elementCenter >= middleZoneStart && elementCenter <= middleZoneEnd;
        setIsInMiddleZone(inMiddleZone);
      },
      {
        threshold,
        root: null,
        rootMargin: "0px",
      },
    );

    observer.observe(element);

    // Also check on scroll for more precise positioning
    const handleScroll = () => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const middleZoneStart = viewportHeight * ((1 - middleZonePercentage) / 2);
      const middleZoneEnd =
        viewportHeight * (1 - (1 - middleZonePercentage) / 2);

      const elementCenter = rect.top + rect.height / 2;
      const inMiddleZone = elementCenter <= middleZoneEnd;
      // elementCenter >= middleZoneStart &&

      setIsInMiddleZone(inMiddleZone);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [middleZonePercentage, threshold]);

  return {
    isInMiddleZone,
    elementRef,
  };
}
