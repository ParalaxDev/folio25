import { useState, useEffect } from "react";
import { event } from "onedollarstats";

interface Image {
  alt: string;
}

interface Props {
  galleryId: string;
  images: Image[];
}

const debounce = <T extends unknown[]>(
  callback: (...args: T) => void,
  wait: number,
) => {
  let timeoutId: number | null = null;
  return (...args: T) => {
    window.clearTimeout(timeoutId!);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

export default function ProjectGalleryControls({ galleryId, images }: Props) {
  const [altText, setAltText] = useState(images[0]?.alt || "");

  useEffect(() => {
    const carousel = document.getElementById(`${galleryId}-carousel`);
    const prev = document.getElementById(`${galleryId}-prev`);
    const next = document.getElementById(`${galleryId}-next`);

    if (!carousel || !prev || !next) return;

    const hide = (el: Element) => {
      el.classList.add("opacity-0", "pointer-events-none");
      el.classList.remove("opacity-100", "pointer-events-auto");
    };

    const show = (el: Element) => {
      el.classList.remove("opacity-0", "pointer-events-none");
      el.classList.add("opacity-100", "pointer-events-auto");
    };

    const debouncedScrollEvent = debounce((args: Record<string, string>) => {
      event("Gallery Changed", args);
    }, 200);

    const updateState = () => {
      const scrollLeft = carousel.scrollLeft;
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

      if (scrollLeft <= 0) {
        hide(prev);
      } else {
        show(prev);
      }

      if (scrollLeft >= maxScrollLeft - 1) {
        hide(next);
      } else {
        show(next);
      }

      const activeIndex = Math.round(
        carousel.scrollLeft / carousel.clientWidth,
      );
      setAltText(images[activeIndex]?.alt || "");
    };

    const handlePrevClick = () => {
      carousel.scrollBy({
        left: -carousel.clientWidth,
        behavior: "smooth",
      });
    };

    const handleNextClick = () => {
      carousel.scrollBy({
        left: carousel.clientWidth,
        behavior: "smooth",
      });
    };

    carousel.addEventListener("scroll", () => {
      updateState();
      debouncedScrollEvent({
        galleryId,
        changedTo:
          images[Math.round(carousel.scrollLeft / carousel.clientWidth)]?.alt,
      });
    });
    prev.addEventListener("click", handlePrevClick);
    next.addEventListener("click", handleNextClick);

    updateState();

    return () => {
      carousel.removeEventListener("scroll", () => {
        updateState();
        debouncedScrollEvent({
          galleryId,
          changedTo:
            images[Math.round(carousel.scrollLeft / carousel.clientWidth)]?.alt,
        });
      });
      prev.removeEventListener("click", handlePrevClick);
      next.removeEventListener("click", handleNextClick);
    };
  }, [galleryId, images]);

  return (
    <div className="text-text-secondary w-full flex justify-center items-center mt-4">
      <button
        id={`${galleryId}-prev`}
        aria-label="Previous"
        className="px-4 h-8 hover:bg-text-primary/10 hover:cursor-pointer transition-opacity bg-background touch-manipulation"
      >
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="size-4 inline"
        >
          <path
            d="M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <p className="px-2 font-mono text-xs text-center min-w-1/4">{altText}</p>
      <button
        id={`${galleryId}-next`}
        aria-label="Next"
        className="px-4 h-8 hover:bg-text-primary/10 hover:cursor-pointer transition-opacity bg-background touch-manipulation"
      >
        <svg
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="size-4 inline"
        >
          <path
            d="M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>
  );
}
