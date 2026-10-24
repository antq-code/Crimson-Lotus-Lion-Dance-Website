import { site } from '../content.js';
import CursorGrid from './CursorGrid.jsx';

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-image" style={{ backgroundImage: `url(${site.heroImage})` }} />
      {/* Interactive gold grid over the photo; the canvas ignores clicks, so links still work. */}
      <div className="hero-grid">
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
