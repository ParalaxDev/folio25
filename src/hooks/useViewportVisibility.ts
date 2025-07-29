import { useEffect, useState, useRef } from "react";

interface UseViewportVisibilityOptions {
  /** The percentage (0-1) of viewport position at which to activate. 1 = top of viewport, 0 = bottom of viewport */
  activationPercentage?: number;
  /** Threshold for intersection observer (default: 0) */
  threshold?: number;
}

export function useViewportVisibility(
  options: UseViewportVisibilityOptions = {},
) {
  const { activationPercentage = 0.5, threshold = 0 } = options;

  const [isActive, setIsActive] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          setIsActive(false);
          return;
        }

        // Check if element has reached the activation point
        const checkActivation = () => {
          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;

          // Calculate the activation point in the viewport
          // activationPercentage of 1 = top of viewport (0px from top)
          // activationPercentage of 0 = bottom of viewport (viewportHeight from top)
          const activationPoint = viewportHeight * (1 - activationPercentage);

          // Element is active when its top edge reaches the activation point
          const isElementActive = rect.top <= activationPoint;

          setIsActive(isElementActive);
        };

        checkActivation();
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

      // Calculate the activation point in the viewport
      const activationPoint = viewportHeight * (1 - activationPercentage);

      // Element is active when its top edge reaches the activation point
      const isElementActive = rect.top <= activationPoint;

      setIsActive(isElementActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    setTimeout(() => handleScroll(), 20);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [activationPercentage, threshold]);

  return {
    isActive,
    elementRef,
  };
}
