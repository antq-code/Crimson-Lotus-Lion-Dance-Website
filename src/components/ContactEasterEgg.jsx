import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Hidden easter egg: an invisible button over a spot in the contact section's background
// photo (the LEVEL 7 sign; see `outline` in content.js). Clicking it dims the site and plays an animation (config in content.js).
export default function ContactEasterEgg({ sectionRef, egg }) {
  const buttonRef = useRef(null);
  const closeRef = useRef(null);
  const blobRef = useRef(null);
  const openRef = useRef(false);
  const [box, setBox] = useState(null);
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');

  // Bounding box of the outline (in % of the photo), and the outline relative to that box.
  const xs = egg.outline.map(([x]) => x);
  const ys = egg.outline.map(([, y]) => y);
  const bounds = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  const clipPath = `polygon(${egg.outline
    .map(([x, y]) => `${(((x - bounds.x) / bounds.w) * 100).toFixed(2)}% ${(((y - bounds.y) / bounds.h) * 100).toFixed(2)}%`)
    .join(', ')})`;

  // Keep the button on its spot in the photo: mirror the photo's `background-size: cover` and
  // `background-position: center` for the section's current size.
  useEffect(() => {
    const section = sectionRef.current;
    const [imageW, imageH] = egg.backgroundSize;
    const place = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      if (!width || !height) return;
      const scale = Math.max(width / imageW, height / imageH);
      const shownW = imageW * scale;
      const shownH = imageH * scale;
      const offsetX = (width - shownW) / 2;
      const offsetY = (height - shownH) / 2;
      setBox({
        left: offsetX + (bounds.x / 100) * shownW,
        top: offsetY + (bounds.y / 100) * shownH,
        width: (bounds.w / 100) * shownW,
        height: (bounds.h / 100) * shownH,
      });
    };
    const observer = new ResizeObserver(place);
    observer.observe(section);
    place();
    return () => observer.disconnect();
    // The outline and photo size are fixed config, so this only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetched once (on hover/focus, or the first click), then reused.
  const preload = () => {
    blobRef.current ??= fetch(egg.image)
      .then((res) => (res.ok ? res.blob() : null))
      .catch(() => null)
      .then((blob) => {
        if (!blob) blobRef.current = null;
        return blob;
      });
    return blobRef.current;
  };

  const show = async () => {
    openRef.current = true;
    setOpen(true);
    const blob = await preload();
    if (!openRef.current) return;
    // A fresh object URL each time makes the animation start again from its first frame.
    setSrc(blob ? URL.createObjectURL(blob) : `${egg.image}?play=${Date.now()}`);
  };

  const hide = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    setSrc((old) => {
      if (old.startsWith('blob:')) URL.revokeObjectURL(old);
      return '';
    });
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  // While open: Esc closes, focus stays on the close button, and the page can't scroll.
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') hide();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open, hide]);

  return (
    <>
      {box && (
        <button
          ref={buttonRef}
          type="button"
          className="contact-egg"
          style={{ ...box, clipPath, WebkitClipPath: clipPath }}
          aria-label="Surprise! Play a hidden animation"
          onClick={show}
          onPointerEnter={preload}
          onFocus={preload}
        />
      )}
      {open &&
        createPortal(
          <div className="egg-overlay" role="dialog" aria-modal="true" aria-label="Hidden animation" onClick={hide}>
            {src ? (
              <div className="egg-frame">
                <img className="egg-image" src={src} alt={egg.alt} />
              </div>
            ) : (
              <span className="egg-loading" aria-live="polite">Loading…</span>
            )}
            <button ref={closeRef} type="button" className="egg-close" aria-label="Close" onClick={hide}>
              ×
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
