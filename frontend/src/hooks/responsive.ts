import { useLayoutEffect, useState } from "react";

// Media query breakpoints for Tailwind v4
// https://tailwindcss.com/docs/responsive-design
const Queries = {
  sm: "(width >= 40rem)",
  md: "(width >= 48rem)",
  lg: "(width >= 64rem)",
  xl: "(width >= 80rem)",
  "2xl": "(width >= 96rem)",
  "max-sm": "(width < 40rem)",
  "max-md": "(width < 48rem)",
  "max-lg": "(width < 64rem)",
  "max-xl": "(width < 80rem)",
  "max-2xl": "(width < 96rem)",
} as const;

type BreakPointType = keyof typeof Queries;

export default function useResponsive(size: BreakPointType) {
  const [isMatch, setIsMatch] = useState<boolean | undefined>(undefined);

  useLayoutEffect(() => {
    const query = Queries[size];
    const mediaQueryList = window.matchMedia(query);
    setIsMatch(mediaQueryList.matches);
    const listener = (event: MediaQueryListEvent) => setIsMatch(event.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, []);

  return isMatch;
}
