import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useNear } from '../lazyLoad.js';

// Explicit rendering so React controls when the widget mounts, resets, and unmounts.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Turnstile script failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Cloudflare Turnstile widget. The mode (managed) is set on the widget in the Cloudflare dashboard.
// onToken receives the token, or '' when it expires, errors, or is reset.
// It loads only once the form is about a screen away: on the live site its check downloads
// close to 900 KB, which visitors who never reach the form shouldn't pay for.
const Turnstile = forwardRef(function Turnstile({ siteKey, onToken, onError }, ref) {
  const containerRef = useRef(null);
  const widgetId = useRef(null);
  const near = useNear(containerRef);
  const handlers = useRef({ onToken, onError });
  handlers.current = { onToken, onError };

  useImperativeHandle(ref, () => ({
    reset() {
      handlers.current.onToken('');
      if (widgetId.current != null) window.turnstile?.reset(widgetId.current);
    },
  }), []);

  useEffect(() => {
    if (!near) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          // The token is sent in the JSON body, so skip Turnstile's hidden form input.
          'response-field': false,
          callback: (token) => handlers.current.onToken(token),
          'expired-callback': () => handlers.current.onToken(''),
          'error-callback': () => {
            handlers.current.onToken('');
            handlers.current.onError?.();
          },
        });
      })
      .catch(() => handlers.current.onError?.());

    return () => {
      cancelled = true;
      if (widgetId.current != null) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, near]);

  return <div ref={containerRef} className="turnstile" />;
});

export default Turnstile;
