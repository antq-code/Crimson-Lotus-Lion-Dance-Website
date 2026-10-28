import { startTransition, useEffect, useState } from 'react';

// Helpers for loading below-the-fold content on demand, so the first load only fetches
// what's on screen (above all the hero photo, which decides how fast the page appears).

// Resolves once the first load is done (the hero photo included), so nothing loaded on
// demand competes with it for bandwidth.
export const pageLoaded = new Promise((resolve) => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', () => resolve(), { once: true });
});

// True once `ref`'s element is within `margin` of the screen (default: one screen away)
// and the first load is done. Stays true after that.
export function useNear(ref, margin = '100% 0px') {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (near || !el) return undefined;
    let observer;
    let cancelled = false;
    pageLoaded.then(() => {
      if (cancelled) return;
      if (!('IntersectionObserver' in window)) {
        setNear(true);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            setNear(true);
          }
        },
        { rootMargin: margin }
      );
      observer.observe(el);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [ref, margin, near]);

  return near;
}

// Below-the-fold sections render when they come near the screen. They're also rendered
// without scrolling, so find-in-page and screen readers see the whole page: all at once when
// a navbar link needs them (showAllSections), or one per idle moment after the first load
// (showSectionsWhenIdle), so no single long task makes the page unresponsive.
const waiting = []; // show() callbacks of sections not on the page yet, in page order
let allShown = false;

export function showAllSections() {
  allShown = true;
  waiting.splice(0).forEach((show) => show());
}

export function showSectionsWhenIdle() {
  const whenIdle = (callback) =>
    'requestIdleCallback' in window ? requestIdleCallback(callback, { timeout: 4000 }) : setTimeout(callback, 200);
  const next = () => {
    const show = waiting.shift();
    if (!show) return;
    show();
    whenIdle(next);
  };
  whenIdle(next);
}

// True once this section should render regardless of where the visitor has scrolled.
export function useShownWithoutScrolling() {
  const [shown, setShown] = useState(allShown);
  useEffect(() => {
    if (allShown) {
      setShown(true);
      return undefined;
    }
    // A transition renders in small slices, so the page stays responsive while it renders.
    const show = () => startTransition(() => setShown(true));
    waiting.push(show);
    return () => {
      const index = waiting.indexOf(show);
      if (index !== -1) waiting.splice(index, 1);
    };
  }, []);
  return shown;
}

// Resolves once every deferred section has rendered (placeholders carry data-deferred),
// or after `timeout` ms if one is slow to download.
export function sectionsReady(timeout = 8000) {
  showAllSections();
  const start = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      if (!document.querySelector('[data-deferred]') || performance.now() - start > timeout) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}
