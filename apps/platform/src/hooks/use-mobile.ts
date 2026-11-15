import { useCallback, useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 992;

const getServerSnapshot = (): boolean => false;

function useBelowBreakpoint(breakpoint: number): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mediaQuery.addEventListener("change", onChange);
      return () => {
        mediaQuery.removeEventListener("change", onChange);
      };
    },
    [breakpoint]
  );
  const getSnapshot = useCallback(
    () => window.innerWidth < breakpoint,
    [breakpoint]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMobile(): boolean {
  return useBelowBreakpoint(MOBILE_BREAKPOINT);
}

export function useIsTablet(): boolean {
  return useBelowBreakpoint(TABLET_BREAKPOINT);
}
