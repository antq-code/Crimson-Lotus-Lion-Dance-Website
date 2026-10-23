import { site } from '../content.js';

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-image" style={{ backgroundImage: `url(${site.heroImage})` }} />
      <div className="hero-fade" />
      <h1 className="wordmark">
        <img src={site.lettering} alt={site.name} />
      </h1>
    </section>
  );
}
