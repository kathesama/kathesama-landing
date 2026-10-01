import { useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface NavigationManagerProps {
  mainRef: RefObject<HTMLElement | null>;
}

const hashTargetWaitMs = 1_000;

function isLanguageOnlySearchChange(previousSearch: string, nextSearch: string) {
  const previousParams = new URLSearchParams(previousSearch);
  const nextParams = new URLSearchParams(nextSearch);
  const languageChanged = previousParams.get('lang') !== nextParams.get('lang');

  previousParams.delete('lang');
  nextParams.delete('lang');
  previousParams.sort();
  nextParams.sort();

  return languageChanged && previousParams.toString() === nextParams.toString();
}

export function NavigationManager({ mainRef }: NavigationManagerProps) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const mounted = useRef(false);
  const previousLocation = useRef({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  });

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  useEffect(() => {
    const isInitialRender = !mounted.current;
    const previous = previousLocation.current;
    const pathnameChanged = previous.pathname !== location.pathname;
    const searchChanged = previous.search !== location.search;
    const hashChanged = previous.hash !== location.hash;
    const languageOnlySearchChanged = isLanguageOnlySearchChange(
      previous.search,
      location.search,
    );

    mounted.current = true;
    previousLocation.current = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    };

    if (!isInitialRender && navigationType === 'POP') return;

    if (
      !isInitialRender &&
      !pathnameChanged &&
      searchChanged &&
      !hashChanged &&
      !languageOnlySearchChanged
    ) {
      return;
    }

    if (location.hash) {
      let observer: MutationObserver | null = null;
      let timeoutId: number | null = null;
      const rawTargetId = location.hash.slice(1);
      let targetId = rawTargetId;

      try {
        targetId = decodeURIComponent(rawTargetId);
      } catch {
        // A malformed escape should not break route focus management.
      }

      const focusHashTarget = () => {
        const target = document.getElementById(targetId);

        if (!target) return false;

        if (!target.hasAttribute('tabindex')) {
          target.tabIndex = -1;
        }

        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'start' });
        return true;
      };

      const stopWatching = () => {
        observer?.disconnect();
        observer = null;

        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      if (!focusHashTarget()) {
        observer = new MutationObserver(() => {
          if (focusHashTarget()) stopWatching();
        });
        observer.observe(mainRef.current ?? document.body, {
          childList: true,
          subtree: true,
        });
        timeoutId = window.setTimeout(stopWatching, hashTargetWaitMs);
      }

      return stopWatching;
    }

    if (isInitialRender) {
      mainRef.current?.focus({ preventScroll: true });
      return;
    }

    if (pathnameChanged || languageOnlySearchChanged) {
      const resetToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      };
      let settledFrameId: number | null = null;
      const paintFrameId = window.requestAnimationFrame(() => {
        settledFrameId = window.requestAnimationFrame(resetToTop);
      });

      resetToTop();
      mainRef.current?.focus({ preventScroll: true });

      return () => {
        window.cancelAnimationFrame(paintFrameId);
        if (settledFrameId !== null) window.cancelAnimationFrame(settledFrameId);
      };
    }
  }, [location.hash, location.pathname, location.search, mainRef, navigationType]);

  return null;
}
