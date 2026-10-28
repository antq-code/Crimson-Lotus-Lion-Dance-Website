/**
 * Builds the web versions of the site's large photos.
 *
 * Originals live in images-src/ (kept in git, not deployed). This writes resized WebP
 * copies to public/images/opt/, which the site uses and which are committed too, so the
 * site works without running this. Run it again after replacing an original:
 *
 *   npm run images
 *
 * File names are fixed (hero-1920.webp, etc.), so swapping a photo needs no code changes.
 * The hero's URLs are also listed in index.html (preload) and src/content.js.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'images-src';
const OUT = 'public/images/opt';
const QUALITY = 70;

// Centre 3:4 slice: what a phone shows of a wide photo with `object-fit: cover`.
const centre3x4 = ({ width, height }) => {
  const w = Math.min(width, Math.round((height * 3) / 4));
  return { left: Math.round((width - w) / 2), top: 0, width: w, height };
};

const PHOTOS = [
  { source: 'heroIMG.jpg', name: 'hero', widths: [1280, 1920, 2560] },
  { source: 'heroIMG.jpg', name: 'hero-m', widths: [720, 1080], crop: centre3x4 },
  { source: 'missionIMG.jpg', name: 'mission', widths: [640, 960, 1280] },
  { source: 'contactIMG.jpg', name: 'contact', widths: [1280, 1920, 2560] },
];

await mkdir(OUT, { recursive: true });
for (const { source, name, widths, crop } of PHOTOS) {
  const file = path.join(SRC, source);
  const meta = await sharp(file).rotate().metadata();
  for (const width of widths) {
    let image = sharp(file).rotate();
    if (crop) image = image.extract(crop(meta));
    const info = await image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(path.join(OUT, `${name}-${width}.webp`));
    console.log(`${name}-${width}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
  }
}
