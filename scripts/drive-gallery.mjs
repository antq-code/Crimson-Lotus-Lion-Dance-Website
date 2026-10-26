#!/usr/bin/env node
/*
 * Team gallery pipeline: builds the circular gallery from a public Google Drive folder.
 * See docs/photo-gallery.md for the photo rules and how to run it.
 *
 * Photos are downloaded and processed at build time (the gallery draws them with WebGL,
 * which needs CORS-enabled images that Drive doesn't serve), into the deployed site:
 *
 *   public/gallery/<driveFileId>.webp       1200px wide, for larger screens
 *   public/gallery/<driveFileId>-600.webp   600px wide, for small screens / the lite tier
 *   public/gallery.json                     manifest the gallery reads at runtime
 *
 * Modes (GitHub Actions runs them in this order; see .github/workflows/deploy.yml):
 *   check  Scheduled runs only. Lists the folder and compares it with the live
 *          https://crimsonlotusld.com/gallery.json. Sets the step output changed=true|false.
 *   list   Lists the folder into .drive-listing.json and sets the step output `fingerprint`,
 *          which keys the actions/cache of processed photos.
 *   build  Validates and processes every photo, reusing cached results (keyed by Drive file
 *          id + md5Checksum), writes the gallery, and a job summary.
 *
 * Safety: if Drive can't be reached or no photo passes validation, the currently deployed
 * gallery is kept (re-downloaded from the live site, or rebuilt from the cache), an empty
 * gallery is never written, and the script never fails the site deploy.
 *
 * Local run (PowerShell): $env:DRIVE_API_KEY="..."; $env:DRIVE_FOLDER_ID="..."; npm run gallery
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { appendFile, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'gallery');
const MANIFEST = path.join(ROOT, 'public', 'gallery.json');
const CACHE_DIR = path.join(ROOT, '.drive-cache');
const PROCESSED_DIR = path.join(CACHE_DIR, 'photos');
const LAST_GOOD = path.join(CACHE_DIR, 'last-gallery.json');
const LISTING = path.join(ROOT, '.drive-listing.json');

// Overridable only so the pipeline can be tested against local stand-ins.
const API = process.env.DRIVE_API_URL || 'https://www.googleapis.com/drive/v3/files';
const SITE_URL = (process.env.GALLERY_SITE_URL || 'https://crimsonlotusld.com').replace(/\/$/, '');

// Bump to force every photo to be re-processed (e.g. after changing the output settings).
const PIPELINE_VERSION = 1;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_BYTES = 30 * 1024 * 1024;
const MIN_WIDTH = 800;
const FULL_WIDTH = 1200;
const MOBILE_WIDTH = 600;
const PLACEHOLDER_WIDTH = 16;
const TIMEOUT_MS = 120_000;

const log = (...args) => console.log('[gallery]', ...args);
const warn = (...args) => console.warn('[gallery] warning:', ...args);

// ---------- Drive ----------

// Every file directly in the folder (photos in subfolders aren't used). Throws on API errors.
async function listFolder(key, folder) {
  const files = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folder}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, modifiedTime, size)',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      key,
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`${API}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Drive API returned ${res.status} (${await apiMessage(res)})`);
    const data = await res.json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
}

async function download(key, id) {
  const res = await fetch(`${API}/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`download failed with ${res.status} (${await apiMessage(res)})`);
  return Buffer.from(await res.arrayBuffer());
}

// Error text from a Drive response. Never includes the request URL, which holds the key.
async function apiMessage(res) {
  try {
    return (await res.json()).error?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

// Network errors from fetch() don't include the URL either; keep only the message.
const describe = (err) => (err?.name === 'TimeoutError' ? 'request timed out' : err?.message || String(err));

// Changes whenever a file is added, edited, or removed (or the pipeline changes).
function fingerprintOf(files) {
  const lines = files.map((f) => [f.id, f.md5Checksum || '', f.modifiedTime, f.mimeType, f.size || ''].join('|')).sort();
  return createHash('sha256').update(`v${PIPELINE_VERSION}\n${lines.join('\n')}`).digest('hex').slice(0, 32);
}

async function fetchLiveManifest() {
  try {
    const res = await fetch(`${SITE_URL}/gallery.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.photos) ? data : null;
  } catch {
    return null;
  }
}

// ---------- Validation + processing ----------

function precheck(file) {
  if (file.mimeType === 'application/vnd.google-apps.folder') return 'subfolder (only photos directly in the folder are used)';
  if (file.mimeType === 'application/vnd.google-apps.shortcut') return 'shortcut (upload the photo itself)';
  if (!ALLOWED_TYPES.has(file.mimeType)) return `unsupported file type (${file.mimeType})`;
  const size = Number(file.size || 0);
  if (size > MAX_BYTES) return `larger than 30 MB (${(size / 1024 / 1024).toFixed(1)} MB)`;
  return null;
}

// Returns { skip } or the processed outputs. Never trusts the extension or mimeType:
// the bytes must actually decode.
async function processPhoto(sharp, buffer, mimeType) {
  let decoded;
  try {
    // rotate() applies the EXIF orientation. Decoding to raw pixels drops ALL metadata
    // (EXIF, GPS, XMP, IPTC) before anything is written out.
    decoded = await sharp(buffer, { failOn: 'truncated' })
      .rotate()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    if (/hei[cf]/.test(mimeType)) {
      return { skip: "HEIC/HEIF isn't supported by this build of sharp (no HEVC decoder); export the photo as JPEG and re-upload it" };
    }
    return { skip: `couldn't be decoded as an image (${describe(err).split('\n')[0]})` };
  }

  const { data, info } = decoded;
  if (info.width < MIN_WIDTH) return { skip: `too small (${info.width}px wide; minimum is ${MIN_WIDTH}px)` };

  const pixels = () => sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  const full = await pixels().resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer({ resolveWithObject: true });
  const mobile = await pixels().resize({ width: MOBILE_WIDTH }).webp({ quality: 72 }).toBuffer();
  const tiny = await pixels().resize({ width: PLACEHOLDER_WIDTH }).blur(1).webp({ quality: 50 }).toBuffer();
  return {
    full: full.data,
    mobile,
    width: full.info.width,
    height: full.info.height,
    placeholder: `data:image/webp;base64,${tiny.toString('base64')}`,
  };
}

// ---------- Modes ----------

async function check() {
  const { key, folder } = secrets();
  if (!key || !folder) {
    await summary('### Photo gallery\nDrive secrets are not set; nothing to check.');
    return output('changed', 'false');
  }
  let files;
  try {
    files = await listFolder(key, folder);
  } catch (err) {
    warn(`couldn't list the Drive folder: ${describe(err)}`);
    await summary(`### Photo gallery\n⚠️ Couldn't reach Google Drive (${describe(err)}). Keeping the deployed gallery.`);
    return output('changed', 'false');
  }
  const live = await fetchLiveManifest();
  const fingerprint = fingerprintOf(files);
  const changed = live?.source?.fingerprint !== fingerprint;
  log(changed ? (live ? 'Drive folder changed since the last deploy.' : 'no live gallery.json found.') : 'no changes in the Drive folder.');
  await summary(
    changed
      ? `### Photo gallery\n${live ? 'Drive folder changed' : 'No live gallery found'}; rebuilding.`
      : '### Photo gallery\nNo changes in the Drive folder; skipping the build and deploy.'
  );
  output('changed', String(changed));
}

async function list() {
  const { key, folder } = secrets();
  try {
    if (!key || !folder) throw new Error('DRIVE_API_KEY / DRIVE_FOLDER_ID are not set');
    const files = await listFolder(key, folder);
    await writeAtomic(LISTING, JSON.stringify({ listedAt: Date.now(), files }));
    output('fingerprint', fingerprintOf(files));
    log(`listed ${files.length} file(s).`);
  } catch (err) {
    warn(`couldn't list the Drive folder: ${describe(err)}`);
    await writeAtomic(LISTING, JSON.stringify({ listedAt: Date.now(), error: describe(err) }));
  }
}

async function build() {
  const { key, folder } = secrets();
  const live = await fetchLiveManifest();

  // Use the listing from the `list` step if there is a fresh one; otherwise list now (local runs).
  let listing = await readJson(LISTING, null);
  await rm(LISTING, { force: true });
  if (!listing || Date.now() - (listing.listedAt || 0) > 30 * 60 * 1000) listing = null;
  if (!listing) {
    try {
      if (!key || !folder) throw new Error('DRIVE_API_KEY / DRIVE_FOLDER_ID are not set');
      listing = { files: await listFolder(key, folder) };
    } catch (err) {
      listing = { error: describe(err) };
    }
  }
  if (listing.error) return keepCurrentGallery(`couldn't reach Google Drive (${listing.error})`, live);

  const { default: sharp } = await import('sharp');
  await mkdir(PROCESSED_DIR, { recursive: true });

  const accepted = [];
  const skipped = [];
  const usedKeys = new Set();

  for (const file of listing.files) {
    const reason = precheck(file);
    if (reason) {
      skipped.push({ name: file.name, reason });
      continue;
    }

    // Cache entry per Drive file id + content checksum.
    const cacheKey = `${file.id}-${file.md5Checksum || createHash('sha1').update(file.modifiedTime).digest('hex').slice(0, 16)}-v${PIPELINE_VERSION}`;
    const dir = path.join(PROCESSED_DIR, cacheKey);
    usedKeys.add(cacheKey);
    let meta = await readJson(path.join(dir, 'meta.json'), null);

    if (!meta) {
      let result;
      try {
        result = await processPhoto(sharp, await download(key, file.id), file.mimeType);
      } catch (err) {
        // Not cached, so it's retried on the next run.
        skipped.push({ name: file.name, reason: describe(err) });
        continue;
      }
      await mkdir(dir, { recursive: true });
      if (result.skip) {
        meta = { skip: result.skip };
      } else {
        await writeFile(path.join(dir, 'full.webp'), result.full);
        await writeFile(path.join(dir, 'mobile.webp'), result.mobile);
        meta = { width: result.width, height: result.height, placeholder: result.placeholder };
      }
      await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta));
      log(`processed ${file.name}${meta.skip ? ` (skipped: ${meta.skip})` : ''}`);
    }

    if (meta.skip) skipped.push({ name: file.name, reason: meta.skip });
    else accepted.push({ file, cacheKey, meta });
  }

  if (!accepted.length) {
    return keepCurrentGallery('no photos passed validation', live, { skipped });
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      fingerprint: fingerprintOf(listing.files),
      files: accepted.map(({ file, cacheKey }) => ({ id: file.id, md5Checksum: file.md5Checksum || null, cacheKey })),
    },
    photos: accepted.map(({ file, meta }, i) => {
      const v = (file.md5Checksum || file.modifiedTime).replace(/[^a-z0-9]/gi, '').slice(0, 8);
      return {
        src: `/gallery/${file.id}.webp?v=${v}`,
        srcMobile: `/gallery/${file.id}-600.webp?v=${v}`,
        width: meta.width,
        height: meta.height,
        placeholder: meta.placeholder,
        alt: `Crimson Lotus Lion Dance performance photo ${i + 1} of ${accepted.length}`,
      };
    }),
  };

  await publish(manifest, async (dir) => {
    for (const { file, cacheKey } of accepted) {
      await copyFile(path.join(PROCESSED_DIR, cacheKey, 'full.webp'), path.join(dir, `${file.id}.webp`));
      await copyFile(path.join(PROCESSED_DIR, cacheKey, 'mobile.webp'), path.join(dir, `${file.id}-600.webp`));
    }
  });
  await writeAtomic(LAST_GOOD, JSON.stringify(manifest));

  // Drop cache entries for files that are gone from Drive or were replaced.
  for (const name of await readdir(PROCESSED_DIR)) {
    if (!usedKeys.has(name)) await rm(path.join(PROCESSED_DIR, name), { recursive: true, force: true });
  }

  const before = new Map((live?.source?.files || []).map((f) => [f.id, f.md5Checksum]));
  const now = new Map(accepted.map(({ file }) => [file.id, file.md5Checksum || null]));
  const nameOf = new Map(listing.files.map((f) => [f.id, f.name]));
  const added = [...now.keys()].filter((id) => !before.has(id));
  const updated = [...now.keys()].filter((id) => before.has(id) && before.get(id) !== now.get(id));
  const removed = [...before.keys()].filter((id) => !now.has(id));

  log(`gallery: ${accepted.length} photo(s), ${added.length} added, ${updated.length} updated, ${removed.length} removed, ${skipped.length} skipped.`);
  await summary(
    [
      '### Photo gallery',
      `✅ **${accepted.length} photo(s)** in the gallery · total size **${await galleryKb()} KB**`,
      '',
      section('Added', added.map((id) => nameOf.get(id) || id)),
      section('Updated', updated.map((id) => nameOf.get(id) || id)),
      section('Removed', removed.map((id) => `${id} (no longer in the Drive folder)`)),
      section('Skipped', skipped.map((s) => `${s.name}: ${s.reason}`)),
    ].join('\n')
  );
}

// Keep whatever is deployed now: re-download the live gallery, else rebuild the last good
// one from the cache. Never writes an empty gallery.
async function keepCurrentGallery(reason, live, { skipped = [] } = {}) {
  warn(`${reason}; keeping the current gallery.`);
  let kept = null;

  if (live?.photos?.length) {
    try {
      await publish(live, async (dir) => {
        for (const photo of live.photos) {
          for (const src of [photo.src, photo.srcMobile]) {
            const res = await fetch(`${SITE_URL}${src}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
            if (!res.ok) throw new Error(`${src} returned ${res.status}`);
            await writeFile(path.join(dir, path.basename(src.split('?')[0])), Buffer.from(await res.arrayBuffer()));
          }
        }
      });
      kept = `the live gallery (${live.photos.length} photos)`;
    } catch (err) {
      warn(`couldn't copy the live gallery: ${describe(err)}`);
    }
  }

  if (!kept) {
    const last = await readJson(LAST_GOOD, null);
    const files = last?.source?.files || [];
    const cached = files.length && files.every((f) => existsSync(path.join(PROCESSED_DIR, f.cacheKey || '', 'full.webp')));
    if (last?.photos?.length && cached) {
      await publish(last, async (dir) => {
        for (const f of files) {
          await copyFile(path.join(PROCESSED_DIR, f.cacheKey, 'full.webp'), path.join(dir, `${f.id}.webp`));
          await copyFile(path.join(PROCESSED_DIR, f.cacheKey, 'mobile.webp'), path.join(dir, `${f.id}-600.webp`));
        }
      });
      kept = `the last cached gallery (${last.photos.length} photos)`;
    }
  }

  await summary(
    [
      '### Photo gallery',
      `⚠️ ${reason[0].toUpperCase()}${reason.slice(1)}.`,
      kept ? `Kept ${kept}.` : 'No previous gallery was available, so the gallery section stays hidden.',
      kept ? `Total size **${await galleryKb()} KB**.` : '',
      '',
      section('Skipped', skipped.map((s) => `${s.name}: ${s.reason}`)),
    ].join('\n')
  );
}

// Replace public/gallery + gallery.json together. Images are written to a staging folder
// first (writeImages receives its path), so if anything fails the current gallery is kept.
async function publish(manifest, writeImages) {
  const staging = `${OUT_DIR}.staging`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    await writeImages(staging);
  } catch (err) {
    await rm(staging, { recursive: true, force: true });
    throw err;
  }
  await rm(OUT_DIR, { recursive: true, force: true });
  await rename(staging, OUT_DIR);
  await writeAtomic(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

// ---------- Helpers ----------

function secrets() {
  return { key: process.env.DRIVE_API_KEY, folder: process.env.DRIVE_FOLDER_ID };
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) return appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  log(`${name}=${value}`);
}

async function summary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  else console.log(`\n${markdown}\n`);
}

const section = (title, items) => (items.length ? `**${title} (${items.length})**\n${items.map((i) => `- ${i}`).join('\n')}\n` : '');

async function galleryKb() {
  let bytes = 0;
  for (const name of existsSync(OUT_DIR) ? await readdir(OUT_DIR) : []) bytes += (await stat(path.join(OUT_DIR, name))).size;
  if (existsSync(MANIFEST)) bytes += (await stat(MANIFEST)).size;
  return Math.round(bytes / 1024);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeAtomic(file, contents) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.tmp`, contents);
  await rename(`${file}.tmp`, file);
}

const modes = { check, list, build };
const mode = process.argv[2] || 'build';
if (!modes[mode]) {
  console.error(`Unknown mode "${mode}". Use check, list, or build.`);
  process.exit(1);
}
modes[mode]().catch(async (err) => {
  // Never fail the site deploy because of the gallery.
  warn(`unexpected error: ${describe(err)}`);
  if (mode === 'check') await output('changed', 'true');
});
