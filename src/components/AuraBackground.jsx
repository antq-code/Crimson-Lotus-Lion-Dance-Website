// Page-wide "aura" background: a dark gradient with a hint of logo red, a soft glow
// blended with `screen`, and film grain. Fixed to the viewport, behind all content.
// The base colour lives on <body> (--bg) because the blend modes composite against it.
export default function AuraBackground() {
  return (
    <div className="aura-bg" aria-hidden="true">
      <div className="aura-layer-1" />
      <div className="aura-layer-2" />
      <div className="aura-grain">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="aura-grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0.181 0.608 0.061 0 0.075
                      0.181 0.608 0.061 0 0.075
                      0.181 0.608 0.061 0 0.075
                      0     0     0     1 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#aura-grain-filter)" />
        </svg>
      </div>
    </div>
  );
}
