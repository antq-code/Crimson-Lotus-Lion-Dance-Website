import { useRef } from 'react';
import { site } from '../content.js';
import Photo from './Photo.jsx';

export default function TeamCarousel() {
  const track = useRef(null);

  const scroll = (dir) => {
    const el = track.current;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id="team" className="team">
      <h2 className="section-title">{site.team.title}</h2>
      <div className="team-band">
        <button className="carousel-btn prev" aria-label="Previous photos" onClick={() => scroll(-1)}>‹</button>
        <div className="carousel-track" ref={track}>
          {site.team.photos.map((p) => (
            <div className="carousel-item" key={p.src}>
              <Photo src={p.src} alt={p.alt} />
            </div>
          ))}
        </div>
        <button className="carousel-btn next" aria-label="Next photos" onClick={() => scroll(1)}>›</button>
      </div>
    </section>
  );
}
