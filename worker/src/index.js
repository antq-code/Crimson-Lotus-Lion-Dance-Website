import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext';

const ALLOWED_ORIGINS = ['https://crimsonlotusld.com', 'https://www.crimsonlotusld.com'];
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_BODY_BYTES = 20_000;

// Max characters per field. Keep in sync with the maxLength attributes in src/components/Contact.jsx.
const LIMITS = { name: 100, email: 254, eventDate: 40, eventType: 80, message: 5000 };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.DEV_ORIGIN ? [...ALLOWED_ORIGINS, env.DEV_ORIGIN] : ALLOWED_ORIGINS;
    const cors = allowedOrigins.includes(origin) ? corsHeaders(origin) : null;

    if (url.pathname !== '/contact') return json({ ok: false, error: 'Not found.' }, 404, cors);

    if (request.method === 'OPTIONS') {
      return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed.' }, 405, { ...cors, Allow: 'POST, OPTIONS' });
    }
    if (!cors) return json({ ok: false, error: 'Origin not allowed.' }, 403);

    try {
      const body = await readJson(request);

      // Bots fill every field; people never see this one. Pretend it worked.
      if (str(body.website)) return json({ ok: true }, 200, cors);

      const fields = validate(body);
      await verifyTurnstile(env, str(body.turnstileToken), request.headers.get('CF-Connecting-IP'));
      await sendEmail(env, fields);

      return json({ ok: true }, 200, cors);
    } catch (err) {
      if (err instanceof RequestError) return json({ ok: false, error: err.message }, err.status, cors);
      console.error('Contact form failed:', err);
      return json({ ok: false, error: 'Something went wrong sending your message. Please try again later.' }, 500, cors);
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function readJson(request) {
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    throw new RequestError(415, 'Expected a JSON request.');
  }
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    throw new RequestError(413, 'Your message is too long.');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new RequestError(413, 'Your message is too long.');
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {
    // fall through
  }
  throw new RequestError(400, 'Invalid request.');
}

const str = (value) => (typeof value === 'string' ? value.trim() : '');

// Single-line fields end up in email headers (Reply-To, Subject), so line breaks
// are collapsed to spaces to rule out header injection.
const singleLine = (value) => str(value).replace(/[\r\n]+/g, ' ').trim();

function validate(body) {
  const fields = {
    name: singleLine(body.name),
    email: singleLine(body.email),
    eventDate: singleLine(body.eventDate),
    eventType: singleLine(body.eventType),
    message: str(body.message).replace(/\r\n?/g, '\n'),
  };

  if (!fields.name) throw new RequestError(400, 'Please enter your name.');
  if (!fields.email) throw new RequestError(400, 'Please enter your email address.');
  if (!EMAIL_PATTERN.test(fields.email)) throw new RequestError(400, 'Please enter a valid email address.');
  if (!fields.message) throw new RequestError(400, 'Please enter a message.');

  for (const [key, max] of Object.entries(LIMITS)) {
    if (fields[key].length > max) throw new RequestError(400, `Please shorten the ${labelFor(key)} field (max ${max} characters).`);
  }
  return fields;
}

const labelFor = (key) => ({ eventDate: 'event date', eventType: 'event type' })[key] || key;

async function verifyTurnstile(env, token, ip) {
  if (!token) throw new RequestError(400, 'Please complete the verification check.');
  if (!env.TURNSTILE_SECRET) throw new Error('TURNSTILE_SECRET is not set.');

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  const res = await fetch(SITEVERIFY_URL, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Turnstile siteverify returned HTTP ${res.status}`);
  const result = await res.json();

  if (!result.success) {
    console.error('Turnstile rejected token:', result['error-codes']);
    throw new RequestError(403, 'Verification failed. Please try the check again.');
  }
}

async function sendEmail(env, f) {
  const subject = `Booking request: ${f.eventType || 'Performance'}${f.eventDate ? ` on ${f.eventDate}` : ''} from ${f.name}`;
  const body = [
    'New booking request from crimsonlotusld.com',
    '',
    `Name:        ${f.name}`,
    `Email:       ${f.email}`,
    `Event date:  ${f.eventDate || '(not given)'}`,
    `Event type:  ${f.eventType || '(not given)'}`,
    '',
    'Message:',
    f.message,
    '',
    '—',
    'Reply to this email to answer the sender directly.',
  ].join('\n');

  const msg = createMimeMessage();
  msg.setSender({ name: 'Crimson Lotus Website', addr: env.CONTACT_FROM });
  msg.setRecipient(env.CONTACT_TO);
  msg.setHeader('Reply-To', new Mailbox(f.email));
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/plain', data: body });

  await env.EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, msg.asRaw()));
}
