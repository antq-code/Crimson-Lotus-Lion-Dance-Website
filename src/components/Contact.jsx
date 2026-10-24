import { useRef, useState } from 'react';
import { site } from '../content.js';
import Glow from './Glow.jsx';
import Turnstile from './Turnstile.jsx';

const icons = {
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

// Local date as YYYY-MM-DD, so the date picker can't pick a day in the past.
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const GENERIC_ERROR = 'Sorry, we couldn’t send your message. Please try again, or email us using the address below.';

export default function Contact() {
  const { title, backgroundImage, email, api, turnstileSiteKey, eventTypes, socials, links } = site.contact;
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const turnstileRef = useRef(null);
  const emailRef = useRef(null);
  const sending = status.state === 'sending';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;

    if (!token) {
      setStatus({ state: 'error', message: 'Please complete the verification check above the Send button.' });
      return;
    }

    setStatus({ state: 'sending', message: 'Sending your message…' });
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), turnstileToken: token }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) {
        // The Worker's 4xx messages are written for visitors (e.g. "Please enter a valid email").
        const message = res.status >= 400 && res.status < 500 && result.error ? result.error : GENERIC_ERROR;
        setStatus({ state: 'error', message });
        return;
      }
      form.reset();
      setStatus({ state: 'success', message: 'Thank you! Your message has been sent, and we’ll get back to you soon.' });
    } catch {
      setStatus({ state: 'error', message: GENERIC_ERROR });
    } finally {
      // Tokens are single-use, so every attempt needs a fresh check.
      turnstileRef.current?.reset();
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Older browsers / insecure contexts: select the address so the user can copy it.
      const range = document.createRange();
      range.selectNodeContents(emailRef.current);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="contact" className="contact">
      <div
        className="contact-bg"
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(rgba(9, 6, 6, 0.68), rgba(9, 6, 6, 0.68)), url(${backgroundImage})` }}
      />
      <div className="contact-inner container">
        <h2 className="section-title">{title}</h2>
        <form className="contact-form" onSubmit={handleSubmit} aria-busy={sending} aria-describedby="form-required-note">
          <p id="form-required-note" className="form-note">Fields marked <span aria-hidden="true">*</span><span className="sr-only">with an asterisk</span> are required.</p>
          <label>
            <span>Name <span className="req" aria-hidden="true">*</span></span>
            <input name="name" type="text" autoComplete="name" placeholder="Your name" maxLength={100} required />
          </label>
          <label>
            <span>Email <span className="req" aria-hidden="true">*</span></span>
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
          </label>
          <div className="form-row">
            <label>
              Event date
              <input name="eventDate" type="date" min={today()} />
            </label>
            <label>
              Event type
              <select name="eventType" defaultValue="">
                <option value="">Select…</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Message <span className="req" aria-hidden="true">*</span></span>
            <textarea name="message" rows="5" placeholder="Tell us about your event: location, time, number of lions…" maxLength={5000} required />
          </label>

          {/* Honeypot: hidden from people and screen readers; bots that fill it are ignored by the Worker. */}
          <div className="hp-field" aria-hidden="true">
            <label>
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            onToken={setToken}
            onError={() => setStatus({ state: 'error', message: 'The verification check couldn’t load. Please refresh the page, or email us using the address below.' })}
          />

          <Glow className="glow-btn" glowIntensity={1.8}>
            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </Glow>

          <p className="form-status is-success" role="status">
            {status.state === 'success' || status.state === 'sending' ? status.message : ''}
          </p>
          <p className="form-status is-error" role="alert">
            {status.state === 'error' ? status.message : ''}
          </p>
        </form>

        <div className="contact-fallback">
          <p>Prefer email? Write to us directly:</p>
          <div className="fallback-row">
            <span className="fallback-email" ref={emailRef}>{email}</span>
            <button type="button" className="copy-btn" onClick={copyEmail}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="sr-only" role="status">{copied ? 'Email address copied to clipboard.' : ''}</p>
        </div>

        <ul className="socials">
          {Object.entries(socials).map(([name, href]) => (
            <li key={name}>
              <Glow backgroundColor="#ffffff" borderRadius={10} glowRadius={20} glowIntensity={1.8}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={name}>
                  <svg viewBox="0 0 24 24" width="20" height="20">{icons[name]}</svg>
                </a>
              </Glow>
            </li>
          ))}
        </ul>
        <div className="contact-links">
          {links.map((link) => (
            <Glow key={link.href} className="glow-btn" glowIntensity={1.8}>
              <a href={link.href} target="_blank" rel="noreferrer" className="outline-btn">
                {link.label}
              </a>
            </Glow>
          ))}
        </div>
      </div>
    </section>
  );
}
