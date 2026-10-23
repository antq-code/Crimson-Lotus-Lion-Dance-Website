import { useState } from 'react';
import { site } from '../content.js';

const icons = {
  email: (
    <path d="M4 6h16v12H4z M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" />
    </g>
  ),
  x: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </g>
  ),
  discord: (
    <path
      fill="currentColor"
      d="M19.3 5.3A16.6 16.6 0 0 0 15.2 4l-.5 1a15.4 15.4 0 0 0-5.4 0l-.5-1a16.5 16.5 0 0 0-4.1 1.3C2.1 9.2 1.4 13 1.7 16.7a16.7 16.7 0 0 0 5 2.5l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.3-.7-8-3-11.4ZM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"
    />
  ),
  youtube: (
    <g>
      <rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10.5 9.5v5l4-2.5z" fill="currentColor" />
    </g>
  ),
};

export default function Contact() {
  const { title, backgroundImage, email, formEndpoint, socials, links } = site.contact;
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (!formEndpoint) {
      const body = `${data.message}\n\n— ${data.name} (${data.email})`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(
        'Performance inquiry from ' + data.name
      )}&body=${encodeURIComponent(body)}`;
      return;
    }

    setStatus('Sending…');
    try {
      const res = await fetch(formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      e.target.reset();
      setStatus('Thanks! We’ll be in touch soon.');
    } catch {
      setStatus('Something went wrong — please email us directly.');
    }
  };

  return (
    <section id="contact" className="contact" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="contact-overlay" />
      <div className="contact-inner container">
        <h2 className="section-title">{title}</h2>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" type="text" placeholder="Your name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Message
            <textarea name="message" rows="5" placeholder="How can we help?" required />
          </label>
          <button type="submit" className="submit-btn">Send</button>
          {status && <p className="form-status">{status}</p>}
        </form>
        <ul className="socials">
          {Object.entries(socials).map(([name, href]) => (
            <li key={name}>
              <a href={href} target={name === 'email' ? undefined : '_blank'} rel="noreferrer" aria-label={name}>
                <svg viewBox="0 0 24 24" width="20" height="20">{icons[name]}</svg>
              </a>
            </li>
          ))}
        </ul>
        <div className="contact-links">
          {links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="outline-btn">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
