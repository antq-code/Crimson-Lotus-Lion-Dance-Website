import { useEffect, useRef } from 'react';

const GLOW_RANGE = 120; // px from the text where the glow starts
const BLEED = 24; // px of room around the text so the glow isn't clipped

// Text with the same gold glow as the team arch's border: a faint glow at rest, and a
// bright glow that fades in as the cursor approaches and is centred on the cursor.
export default function GlowText({ as: Tag = 'p', className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    let frame = 0;

    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = Math.max(r.left - event.clientX, 0, event.clientX - r.right);
        const dy = Math.max(r.top - event.clientY, 0, event.clientY - r.bottom);
        const strength = Math.max(0, 1 - Math.hypot(dx, dy) / GLOW_RANGE);
        el.style.setProperty('--glow', strength.toFixed(3));
        el.style.setProperty('--mx', `${event.clientX - r.left + BLEED}px`);
        el.style.setProperty('--my', `${event.clientY - r.top + BLEED}px`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--glow', '0');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <Tag ref={ref} className={`glow-text ${className}`} style={{ '--bleed': `${BLEED}px` }}>
      {children}
      <span className="glow-text-lit" aria-hidden="true">{children}</span>
    </Tag>
  );
}
