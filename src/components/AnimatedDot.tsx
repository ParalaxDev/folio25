"use client";

import { useViewportVisibility } from "../hooks/useViewportVisibility";

interface AnimatedDotProps {
  /** Size of the dot (default: "size-3") */
  size?: string;
  /** Background color class (default: "bg-tertiary") */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** The percentage of the viewport height that defines the "middle zone" (default: 0.5 for 50%) */
  middleZonePercentage?: number;
  /** Animation duration in milliseconds (default: 300) */
  animationDuration?: number;
  /** Custom animation easing (default: "ease-in-out") */
  animationEasing?:
    | "ease"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "linear"
    | string;
  /** Animation type for entrance/exit (default: "fade-scale") */
  animationType?: "fade" | "scale" | "fade-scale" | "slide-up" | "slide-down";
  /** Delay before animation starts in milliseconds (default: 0) */
  animationDelay?: number;
  /** Whether to use a pulsing animation when visible (default: false) */
  pulse?: boolean;
  /** Pulse animation speed in seconds (default: 2) */
  pulseSpeed?: number;
  /** Whether to animate the layout to accommodate the dot (default: true) */
  animateLayout?: boolean;
  /** How much space to reserve when not visible (default: 0) */
  reservedSpace?: number;
}

export default function AnimatedDot({
  size = "size-3",
  color = "bg-tertiary",
  className = "",
  style = {},
  middleZonePercentage = 0.1,
  animationDuration = 300,
  animationEasing = "ease-in-out",
  animationType = "fade-scale",
  animationDelay = 0,
  pulse = true,
  pulseSpeed = 2,
  animateLayout = true,
  reservedSpace = 0,
}: AnimatedDotProps) {
  const { isInMiddleZone, elementRef } = useViewportVisibility({
    middleZonePercentage,
  });

  const getContainerStyles = () => {
    const baseTransition = {
      transitionDuration: `${animationDuration}ms`,
      transitionTimingFunction: animationEasing,
      transitionDelay: `${animationDelay}ms`,
    };

    if (!animateLayout) {
      return {
        ...baseTransition,
        transitionProperty: "opacity, transform",
      };
    }

    // Parse size class to get pixel value for smooth width animation
    const sizeMap: { [key: string]: string } = {
      "size-1": "4px",
      "size-2": "8px",
      "size-3": "12px",
      "size-4": "16px",
      "size-5": "20px",
      "size-6": "24px",
      "size-8": "32px",
      "size-10": "40px",
      "size-12": "48px",
    };

    const dotSize = sizeMap[size] || "12px";
    const targetWidth = isInMiddleZone ? dotSize : `${reservedSpace}px`;

    return {
      ...baseTransition,
      transitionProperty: "width, margin-right, opacity, transform",
      width: targetWidth,
      marginRight: isInMiddleZone
        ? "0.75rem"
        : reservedSpace > 0
          ? "0.75rem"
          : "0px",
      overflow: "hidden",
      flexShrink: 0,
    };
  };

  const getAnimationStyles = () => {
    const baseStyles = {
      transitionDuration: `${animationDuration}ms`,
      transitionTimingFunction: animationEasing,
      transitionDelay: `${animationDelay}ms`,
      transitionProperty: "background-color, opacity, transform",
    };

    switch (animationType) {
      case "fade":
        return {
          ...baseStyles,
          opacity: isInMiddleZone ? 1 : 0,
        };
      case "scale":
        return {
          ...baseStyles,
          transform: isInMiddleZone ? "scale(1)" : "scale(0)",
        };
      case "slide-up":
        return {
          ...baseStyles,
          opacity: isInMiddleZone ? 1 : 0,
          transform: isInMiddleZone ? "translateY(0)" : "translateY(8px)",
        };
      case "slide-down":
        return {
          ...baseStyles,
          opacity: isInMiddleZone ? 1 : 0,
          transform: isInMiddleZone ? "translateY(0)" : "translateY(-8px)",
        };
      case "fade-scale":
      default:
        return {
          ...baseStyles,
          opacity: isInMiddleZone ? 1 : 0,
          transform: isInMiddleZone ? "scale(1)" : "scale(0.8)",
        };
    }
  };

  const pulseClassName = pulse && isInMiddleZone ? "animate-pulse" : "";
  const pulseStyle =
    pulse && isInMiddleZone
      ? {
          animationDuration: `${pulseSpeed}s`,
        }
      : {};

  return (
    <span
      ref={elementRef}
      className={`rounded-full inline-flex items-center justify-center transition-all ${pulseClassName} ${className}`}
      style={{
        ...getContainerStyles(),
        ...pulseStyle,
        height: "auto",
        aspectRatio: "1",
        ...style,
      }}
    >
      <span
        className={`block w-full h-full rounded-full ${color} transition-all`}
        style={{
          ...getAnimationStyles(),
        }}
      />
    </span>
  );
}
