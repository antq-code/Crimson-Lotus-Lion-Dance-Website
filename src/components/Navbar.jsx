import { useState } from 'react';
import { site } from '../content.js';
import { smoothScrollTo } from '../smoothScroll.js';
import Glow from './Glow.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const handleClick = (e, href) => {
    setOpen(false);
    if (href.startsWith('#')) {
      e.preventDefault();
      // Wait a frame so the mobile menu has closed before measuring the navbar.
      requestAnimationFrame(() => smoothScrollTo(href));
    }
  };

  return (
    <header className="nav-wrap">
      <Glow className="nav-glow" borderRadius={14} glowRadius={40}>
        <nav className="nav">
          <a href="#top" className="nav-logo" aria-label={`${site.name} home`} onClick={(e) => handleClick(e, '#top')}>
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
                  onClick={(e) => handleClick(e, item.href)}
                  {...(item.href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Glow>
    </header>
  );
}
