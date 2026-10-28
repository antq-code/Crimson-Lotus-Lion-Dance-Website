import { useEffect, useState } from 'react';
import { site } from '../content.js';
import { pageLoaded } from '../lazyLoad.js';
import CursorGrid from './CursorGrid.jsx';

export default function Hero() {
  // The grid is decorative, and the browser's first WebGL setup can block the page for a
  // moment, so it starts once the first load is done and the browser is idle (it fades in).
  const [showGrid, setShowGrid] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const show = () => !cancelled && setShowGrid(true);
    pageLoaded.then(() =>
      'requestIdleCallback' in window ? requestIdleCallback(show, { timeout: 2000 }) : setTimeout(show, 500)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="top" className="hero">
      {/* Preloaded from index.html. `sizes` matches .hero's `object-fit: cover` crop: phones show a
          3:4 slice about as wide as the screen; wider screens show ~120% of the screen width. */}
      <picture>
        <source media="(max-width: 700px)" srcSet={site.heroImage.mobileSrcSet} sizes="100vw" />
        <img
          className="hero-image"
          src={site.heroImage.src}
          srcSet={site.heroImage.srcSet}
          sizes="120vw"
          alt=""
          fetchpriority="high"
        />
      </picture>
      {/* Interactive gold grid over the photo; the canvas ignores clicks, so links still work. */}
      <div className="hero-grid">
        {showGrid && (
          <CursorGrid
            cellSize={24}
            color="#f3d77a"
            highlight="area"
            gridStyle="crosses"
            radius={120}
            holdTime={200}
            fadeDuration={200}
            fillOpacity={0.1}
            gridOpacity={0.2}
            spotlight={1}
            clickPulse
          />
        )}
      </div>
      <div className="hero-heading">
        <h1 className="wordmark">
          <img src={site.lettering} alt={site.name} />
        </h1>
        <p className="hero-tagline">{site.tagline}</p>
      </div>
    </section>
  );
}
