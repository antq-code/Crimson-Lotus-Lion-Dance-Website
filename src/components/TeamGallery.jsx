import { useEffect, useRef, useState } from 'react';
import { site } from '../content.js';
import CircularGallery from './CircularGallery.jsx';
import GlowText from './GlowText.jsx';

// Gallery settings shared with the arch math below.
const BEND = 3;
// Space between the band's edges and the photos.
const PAD_TOP = 28;
const PAD_BOTTOM = 22;
// Border glow (same idea as BorderGlow): lights up the arch edge near the cursor.
const GLOW_RANGE = 90; // px from an edge where the glow starts
const GLOW_RADIUS = 260; // px radius of the lit stretch of edge
const RAIL_WIDTH = 11; // px thickness of the gold rails (was a 1px line)

// Mirrors CircularGallery's layout (measure + arcOf, itemSize 1, itemAspect 0.78, no captions):
// cards sit on a circle of radius R centred below the gallery, so the band is the
// ring between two circles sharing that centre.
function archFor(width, height) {
  const depth = (BEND * height) / 16.57; // CircularGallery's WORLD_HEIGHT
  const half = Math.max(width, height * 1.9) / 2;
  const R = (half * half + depth * depth) / (2 * depth);
  const cardH = 0.6 * height * Math.min(1, (width * 0.82) / (0.6 * height * 0.78));
  return {
    cx: width / 2,
    cy: height / 2 + R,
    outer: R + cardH / 2 + PAD_TOP,
    inner: R - (cardH / 2 + PAD_BOTTOM),
    width,
    depth,
  };
}

// One curved edge of the band, left to right.
function arcPath({ cx, cy, width }, r) {
  const yAt = (x) => cy - Math.sqrt(r * r - (x - cx) * (x - cx));
  return `M 0 ${yAt(0)} A ${r} ${r} 0 0 1 ${width} ${yAt(width)}`;
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
  const sectionRef = useRef(null);
  const wrapRef = useRef(null);
  const archRef = useRef(null);
  const glowRef = useRef(null);
  const spotRef = useRef(null);
  const [arch, setArch] = useState(null);
  // 'loading' | 'ready' | 'empty' (no gallery.json yet, e.g. local dev before `npm run gallery`).
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const wrap = wrapRef.current;

    const resize = () => {
      // Hidden (no photos) or not laid out yet: there's no arch to draw.
      if (!wrap.clientWidth || !wrap.clientHeight) return;
      archRef.current = archFor(wrap.clientWidth, wrap.clientHeight);
      setArch(archRef.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();

    const inArch = (event) => {
      const a = archRef.current;
      if (!a) return true;
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

    // Border glow: fade in as the cursor nears the arch's top or bottom edge, and
    // centre the lit stretch of edge on the cursor. Listens on the whole section
    // because the arch's ends dip below the gallery box.
    const section = sectionRef.current;
    let frame = 0;
    const onGlowMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const a = archRef.current;
        if (!a || !glowRef.current) return;
        const rect = wrap.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const d = Math.hypot(x - a.cx, y - a.cy);
        const edgeDistance = Math.min(Math.abs(d - a.outer), Math.abs(d - a.inner));
        const strength = Math.max(0, 1 - edgeDistance / GLOW_RANGE);
        spotRef.current.setAttribute('cx', x);
        spotRef.current.setAttribute('cy', y);
        glowRef.current.style.opacity = strength.toFixed(3);
      });
    };
    const onGlowLeave = () => {
      cancelAnimationFrame(frame);
      if (glowRef.current) glowRef.current.style.opacity = '0';
    };
    section.addEventListener('pointermove', onGlowMove);
    section.addEventListener('pointerleave', onGlowLeave);

    return () => {
      observer.disconnect();
      events.forEach((type) => wrap.removeEventListener(type, guard, { capture: true }));
      section.removeEventListener('pointermove', onGlowMove);
      section.removeEventListener('pointerleave', onGlowLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="team" className="team" ref={sectionRef}>
      <h2 className="section-title">{site.team.title}</h2>
      <GlowText className="team-motto">{site.motto}</GlowText>
      <div className={`team-gallery${status === 'empty' ? ' is-empty' : ''}`} ref={wrapRef}>
        {arch && (() => {
          const path = bandPath(arch);
          const rails = [arcPath(arch, arch.outer), arcPath(arch, arch.inner)];
          const height = arch.depth + wrapRef.current.clientHeight;
          return (
            <svg className="team-arch" width={arch.width} height={height} aria-hidden="true">
              <defs>
                {/* Logo reds: brightest at the top centre, deepening toward the ends of the arch. */}
                <radialGradient id="team-arch-fill" cx="0.5" cy="0.25" r="0.75">
                  <stop offset="0%" stopColor="#ff3b3b" />
                  <stop offset="35%" stopColor="#ea2b2f" />
                  <stop offset="65%" stopColor="var(--crimson)" />
                  <stop offset="85%" stopColor="var(--crimson-dark)" />
                  <stop offset="100%" stopColor="#7a0808" />
                </radialGradient>
                {/* Brushed-gold look across each rail's thickness. */}
                <linearGradient id="team-arch-rail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold-dark)" />
                  <stop offset="50%" stopColor="var(--gold)" />
                  <stop offset="100%" stopColor="var(--gold-dark)" />
                </linearGradient>
                <radialGradient id="team-arch-spot">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="45%" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <mask id="team-arch-glow-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={arch.width} height={height}>
                  <circle ref={spotRef} cx="-9999" cy="-9999" r={GLOW_RADIUS} fill="url(#team-arch-spot)" />
                </mask>
                <filter id="team-arch-blur" filterUnits="userSpaceOnUse" x="0" y="-40" width={arch.width} height={height + 80}>
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              <path d={path} fill="url(#team-arch-fill)" fillOpacity="0.6" />
              {/* Gold rails on the top and bottom edges, like the rods of a hanging scroll. */}
              {rails.map((d) => (
                <g key={d}>
                  <path d={d} fill="none" stroke="url(#team-arch-rail)" strokeWidth={RAIL_WIDTH} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="var(--gold-light)" strokeOpacity="0.7" strokeWidth="2" />
                </g>
              ))}
              <g ref={glowRef} className="team-arch-glow" mask="url(#team-arch-glow-mask)">
                {rails.map((d) => (
                  <g key={d}>
                    <path d={d} fill="none" stroke="var(--gold-light)" strokeWidth={RAIL_WIDTH + 12} filter="url(#team-arch-blur)" />
                    <path d={d} fill="none" stroke="#fff3c4" strokeWidth="3" />
                  </g>
                ))}
              </g>
            </svg>
          );
        })()}
        {/* Photos come from Google Drive via the build pipeline (scripts/drive-gallery.mjs),
            which writes /gallery.json. Mounted only when the section nears the viewport. */}
        <CircularGallery
          manifestUrl="/gallery.json"
          onStatus={setStatus}
          ariaLabel="Photo gallery of Crimson Lotus performances"
          bend={BEND}
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.05}
          snap={false}
          showTitles={false}
          borderColor="#c9a227"
          borderWidth={3}
        />
      </div>
    </section>
  );
}
