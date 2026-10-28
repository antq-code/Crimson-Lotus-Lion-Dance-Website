import { useEffect, useRef, useState } from 'react';
import { site } from '../content.js';

// Border glow (same idea as the team arch): a photo's border lights up near the cursor.
const GLOW_RANGE = 90; // px from a border where the glow starts

// Officer photo, or the officer's initials until their photo is added to /public/images/officers.
function OfficerPhoto({ src, name }) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('');
    return (
      <div className="officer-photo officer-photo-empty" aria-hidden="true">
        {initials}
      </div>
    );
  }
  return <img className="officer-photo" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

// Photo with a second photo behind it: a click flashes the border and crossfades between them.
function SwappablePhoto({ person }) {
  const [showAlt, setShowAlt] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const toggle = () => {
    setShowAlt((value) => !value);
    // Restart the flash even on quick repeat clicks.
    setFlashing(false);
    requestAnimationFrame(() => setFlashing(true));
  };
  return (
    <button
      type="button"
      className={`officer-swap${showAlt ? ' is-alt' : ''}${flashing ? ' is-flashing' : ''}`}
      aria-pressed={showAlt}
      aria-label={`Surprise! Swap ${person.name}'s photo`}
      onClick={toggle}
      onAnimationEnd={(event) => event.target === event.currentTarget.lastChild && setFlashing(false)}
    >
      <OfficerPhoto src={person.photo} name={person.name} />
      <img className="officer-photo officer-photo-alt" src={person.altPhoto} alt="" loading="lazy" />
      <span className="officer-flash" aria-hidden="true" />
    </button>
  );
}

export default function OfficerContacts() {
  const { title, people } = site.officers;
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const frames = [...section.querySelectorAll('.officer-frame')];
    let frame = 0;
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const el of frames) {
          const rect = el.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          // Distance to the nearest point of the border, from inside or outside the photo.
          const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
          const edgeDistance = inside
            ? Math.min(x, rect.width - x, y, rect.height - y)
            : Math.hypot(Math.max(0, -x, x - rect.width), Math.max(0, -y, y - rect.height));
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);
          el.style.setProperty('--glow', Math.max(0, 1 - edgeDistance / GLOW_RANGE).toFixed(3));
        }
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frames.forEach((el) => el.style.setProperty('--glow', '0'));
    };
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="officers" className="officers" aria-labelledby="officers-title" ref={sectionRef}>
      <h2 id="officers-title" className="section-title">{title}</h2>
      <div className="officers-band">
        <ul className="officers-list container">
          {people.map((person) => (
            <li key={person.name} className="officer">
              <div className="officer-frame">
                {person.altPhoto ? (
                  <SwappablePhoto person={person} />
                ) : (
                  <OfficerPhoto src={person.photo} name={person.name} />
                )}
                <span className="officer-glow" aria-hidden="true">
                  <span className="officer-glow-ring" />
                </span>
              </div>
              <div className="officer-info">
                <p className="officer-name">{person.name}</p>
                <p className="officer-role">({person.role})</p>
                {person.language && <p className="officer-language">({person.language})</p>}
                <a className="officer-phone" href={`tel:+1${person.phone.replace(/\D/g, '')}`}>
                  {person.phone}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
