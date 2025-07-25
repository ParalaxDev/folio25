import { useEffect, useState } from "react";

export function useTheme(): "light" | "dark" {
  const getTheme = (): "light" | "dark" => {
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark" || theme === "light") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState<"light" | "dark">(getTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const mediaListener = () => setTheme(getTheme());
    media.addEventListener("change", mediaListener);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", mediaListener);
    };
  }, []);

  return theme;
}
