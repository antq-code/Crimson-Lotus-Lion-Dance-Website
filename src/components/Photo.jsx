import { useRef, useState } from 'react';
import { useNear } from '../lazyLoad.js';

// <img> that downloads only once it's about a screen away (after the first load), and shows a
// soft placeholder instead of a broken-image icon if the file is missing from /public/images.
export default function Photo({ src, srcSet, sizes, alt, className = '' }) {
  const ref = useRef(null);
  const near = useNear(ref);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`photo-placeholder ${className}`} role="img" aria-label={alt}>
        <span>{src.split('/').pop()}</span>
      </div>
    );
  }
  return (
    <img
      ref={ref}
      src={near ? src : undefined}
      srcSet={near ? srcSet : undefined}
      sizes={sizes}
      alt={alt}
      className={`photo ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
