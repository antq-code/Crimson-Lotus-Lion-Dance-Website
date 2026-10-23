import { site } from '../content.js';
import Photo from './Photo.jsx';

export default function Mission() {
  const { title, text, image, imageAlt } = site.mission;
  return (
    <section className="mission container">
      <div className="mission-text">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <Photo src={image} alt={imageAlt} className="mission-image" />
    </section>
  );
}
