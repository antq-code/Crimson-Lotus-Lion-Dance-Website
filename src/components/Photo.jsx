import { useState } from 'react';

// <img> that shows a soft placeholder instead of a broken-image icon
// until the real file is dropped into /public/images.
export default function Photo({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`photo-placeholder ${className}`} role="img" aria-label={alt}>
        <span>{src.split('/').pop()}</span>
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  );
}
