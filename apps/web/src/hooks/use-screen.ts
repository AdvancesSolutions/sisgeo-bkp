import { useEffect, useState } from "react";
import type { Screens } from "@/types/types";

const breakpoints: Record<keyof Screens, number> = {
  sm: 480,
  md: 960,
  lg: 1280,
  xl: 1440,
  "2xl": 1640,
  "3xl": 1900,
};

function getMediaQuery(screen: keyof Screens): string {
  const px = breakpoints[screen];
  return `(min-width: ${px}px)`;
}

export function useScreen(screen: keyof Screens): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(getMediaQuery(screen));
    setMatches(mql.matches);
    const handler = () => setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [screen]);

  return matches;
}

export function useScreenEffect(screen: keyof Screens, callback: (match: boolean) => void): void {
  useEffect(() => {
    const mql = window.matchMedia(getMediaQuery(screen));
    callback(mql.matches);
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [screen, callback]);
}
