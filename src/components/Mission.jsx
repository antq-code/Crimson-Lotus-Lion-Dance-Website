import { site } from '../content.js';
import Photo from './Photo.jsx';

export default function Mission() {
  const { title, text, image, imageSrcSet, imageAlt } = site.mission;
  return (
    <section className="mission container">
      <div className="mission-text">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {/* The image column is about 640px wide on desktop and full width (minus margins) below 860px. */}
      <Photo
        src={image}
        srcSet={imageSrcSet}
        sizes="(max-width: 860px) calc(100vw - 48px), 640px"
        alt={imageAlt}
        className="mission-image"
      />
    </section>
  );
}
