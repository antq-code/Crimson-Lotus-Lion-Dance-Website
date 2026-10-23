import { useState } from 'react';
import { site } from '../content.js';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-wrap">
      <nav className="nav">
        <a href="#top" className="nav-logo" aria-label={`${site.name} home`}>
          <img src={site.logo} alt="" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
        </a>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
        <ul className={`nav-links ${open ? 'is-open' : ''}`}>
          {site.nav.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                {...(item.href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
