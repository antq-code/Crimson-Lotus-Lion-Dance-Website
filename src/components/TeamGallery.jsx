import { useEffect, useRef, useState } from 'react';
import { site } from '../content.js';
import CircularGallery from './CircularGallery.jsx';

const items = site.team.photos.map((p) => ({
  image: p.src,
  text: p.title,
  description: p.description,
  alt: p.alt,
}));

// Gallery settings shared with the arch math below.
const BEND = 3;
const FONT_PX = 30;
// Space between the band's edges and the photos (top) / captions (bottom).
const PAD_TOP = 28;
const PAD_BOTTOM = 22;

// Mirrors CircularGallery's layout (measure + arcOf, itemSize 1, itemAspect 0.78):
// cards sit on a circle of radius R centred below the gallery, so the band is the
// ring between two circles sharing that centre.
function archFor(width, height) {
  const depth = (BEND * height) / 16.57; // CircularGallery's WORLD_HEIGHT
  const half = Math.max(width, height * 1.9) / 2;
  const R = (half * half + depth * depth) / (2 * depth);
  const cardH = 0.6 * height * Math.min(1, (width * 0.82) / (0.6 * height * 0.78));
  const label = cardH * 0.072 * (FONT_PX / 30);
  return {
    cx: width / 2,
    cy: height / 2 + R,
    outer: R + cardH / 2 + PAD_TOP,
    inner: R - (cardH / 2 + label * 1.7 + PAD_BOTTOM),
    width,
    depth,
  };
}

function bandPath({ cx, cy, outer, inner, width }) {
  const yAt = (r, x) => cy - Math.sqrt(r * r - (x - cx) * (x - cx));
  return [
    `M 0 ${yAt(outer, 0)}`,
    `A ${outer} ${outer} 0 0 1 ${width} ${yAt(outer, width)}`,
    `L ${width} ${yAt(inner, width)}`,
    `A ${inner} ${inner} 0 0 0 0 ${yAt(inner, 0)}`,
    'Z',
  ].join(' ');
}

export default function TeamGallery() {
  const wrapRef = useRef(null);
  const archRef = useRef(null);
  const [arch, setArch] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;

    const resize = () => {
      archRef.current = archFor(wrap.clientWidth, wrap.clientHeight);
      setArch(archRef.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();

    const inArch = (event) => {
      const a = archRef.current;
      const rect = wrap.getBoundingClientRect();
      const d = Math.hypot(event.clientX - rect.left - a.cx, event.clientY - rect.top - a.cy);
      return d >= a.inner && d <= a.outer;
    };

    // Outside the arch, stop wheel/drag events before they reach the gallery so the
    // page scrolls normally instead of the carousel capturing the wheel.
    const guard = (event) => {
      const inside = inArch(event);
      wrap.classList.toggle('is-outside-arch', !inside);
      if (!inside && event.type !== 'pointermove') event.stopPropagation();
    };
    const events = ['wheel', 'pointerdown', 'pointermove'];
    events.forEach((type) => wrap.addEventListener(type, guard, { capture: true }));

    return () => {
      observer.disconnect();
      events.forEach((type) => wrap.removeEventListener(type, guard, { capture: true }));
    };
  }, []);

  return (
    <section id="team" className="team">
      <h2 className="section-title">{site.team.title}</h2>
      <div className="team-gallery" ref={wrapRef}>
        {arch && (
          <svg
            className="team-arch"
            width={arch.width}
            height={arch.depth + wrapRef.current.clientHeight}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="team-arch-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--olive)" />
                <stop offset="100%" stopColor="var(--olive-dark)" />
              </linearGradient>
            </defs>
            <path d={bandPath(arch)} fill="url(#team-arch-fill)" />
          </svg>
        )}
        <CircularGallery
          items={items}
          bend={BEND}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.05}
          font={`400 ${FONT_PX}px Cinzel`}
          fontUrl="https://fonts.googleapis.com/css2?family=Cinzel:wght@400&display=swap"
        />
      </div>
    </section>
  );
}
