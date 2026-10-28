import { sectionsReady } from './lazyLoad.js';

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let frame;

// Gently scrolls to the element matching `hash` (e.g. '#team'),
// stopping just below the fixed navbar.
export async function smoothScrollTo(hash) {
  // Below-the-fold sections may not be on the page yet; render them first so the target
  // exists and nothing above it changes height mid-scroll.
  if (hash !== '#top') await sectionsReady();
  const target = hash === '#top' ? document.body : document.querySelector(hash);
  if (!target) return;

  const nav = document.querySelector('.nav-wrap');
  const offset = hash === '#top' || !nav ? 0 : nav.getBoundingClientRect().bottom + 16;
  const start = window.scrollY;
  const end = Math.max(0, target.getBoundingClientRect().top + start - offset);
  const distance = end - start;

  history.pushState(null, '', hash);

  // Longer trips take a little longer, within 700–1400ms. When the device asks for
  // reduced motion (e.g. Windows "Animation effects" off), keep a short, gentle glide.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 450 : Math.min(1400, Math.max(700, Math.abs(distance) * 0.5));
  const startTime = performance.now();
  cancelAnimationFrame(frame);

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, start + distance * easeInOutCubic(progress));
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}
