import { useEffect, useState } from "react";

export default () => {
  const [scrollAmount, setScrollAmount] = useState(0);
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    const sections = document.querySelectorAll("h3");

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollAmount(scrollPercent);

      // Find which section is currently in view
      let currentSectionTitle = "";

      for (let i = 0; i < sections.length; i++) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= window.innerHeight / 4) {
          currentSectionTitle = sections[i].textContent?.trim() || "";
        } else {
          break;
        }
      }

      setCurrentSection(currentSectionTitle);
    };

    handleScroll(); // Initialize on mount

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      <div
        className="absolute left-0 -translate-y-full"
        style={{ top: `${scrollAmount}%` }}
      >
        <h1 className="text-xs font-mono text-secondary -mb-1.5 bg-background py-0.5">
          {currentSection}
        </h1>
        <div className="size-3 bg-tertiary rounded-full translate-y-1/2 -translate-x-[150%]" />
        <div className={`w-24 h-px bg-tertiary`} />
      </div>
      {Array(31)
        .fill(null)
        .map((_, i) => (
          <div
            key={`minimap-tick-${i}`}
            className={`${i % 5 == 0 ? "w-14" : "w-10"} h-px bg-border not-last:mb-2`}
          />
        ))}
    </div>
  );
};
