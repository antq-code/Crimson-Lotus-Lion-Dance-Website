# Team photo gallery (Google Drive)

The circular gallery in the "Our Team" section shows the photos in the team's public Google Drive folder. To change the gallery, add or remove photos in that folder. The site updates itself within about 30 minutes.

## Photo rules

Put photos **directly in the folder**. Photos inside subfolders are ignored.

| Rule | Details |
|---|---|
| File types | JPEG, PNG, WebP. HEIC/HEIF (iPhone) photos are skipped, because the image library used in the build can't decode them. Export them as JPEG first. |
| Minimum width | 800 px (after rotation). Smaller photos are skipped. |
| Maximum size | 30 MB per file. |
| Anything else | Videos, PDFs, documents, shortcuts and subfolders are skipped. |

- **Order:** newest first, by when each file was last modified in Drive.
- **Rotation and location data:** photos are rotated upright automatically, and all metadata, including GPS location, is removed before they go on the site.
- **Alt text:** each photo gets "Crimson Lotus Lion Dance performance photo N of M". Drive file names and descriptions aren't used on the site.

## How it works

Everything runs in GitHub Actions (`.github/workflows/deploy.yml`) using `scripts/drive-gallery.mjs`:

1. **Every 30 minutes**, a quick check lists the Drive folder and compares it with the live `https://crimsonlotusld.com/gallery.json`. If nothing was added, changed or removed, the run stops there, with no build and no deploy.
2. **When something changed**, or on any push to `main` or a manual run, the build job:
   - downloads each new or changed photo and checks it against the rules above. Each file must actually decode as an image; the file name or type alone isn't trusted.
   - makes a 1200px-wide WebP for larger screens, a 600px-wide WebP for phones and slow connections, and a tiny blurred placeholder.
   - writes them to `public/gallery/` and `public/gallery.json`, which are deployed with the site and never committed to git.
3. **Unchanged photos are reused** from the Actions cache, keyed by each Drive file's id and checksum, so they aren't downloaded or processed again.
4. Each run's **summary page** (Actions → the run → Summary) lists photos added, updated, removed and skipped (with the reason), plus the total gallery size.

**Safety:**
- **Drive unavailable, or no photo passes the rules:** the gallery currently on the site is kept, copied from the live site or rebuilt from the cache. An empty gallery is never deployed, and the rest of the site still deploys.
- **No gallery at all:** if none has been built yet (e.g. running locally), the "Our Team" heading shows without the gallery.

The repository secrets `DRIVE_API_KEY` and `DRIVE_FOLDER_ID` (Settings → Secrets and variables → Actions) give the workflow access. The folder must be shared as "Anyone with the link → Viewer".

## Updating the gallery right away

GitHub → **Actions** → **Build and Deploy** → **Run workflow** → **Run workflow**. A manual run always rebuilds and deploys.

Scheduled runs can start a few minutes late when GitHub is busy. GitHub also pauses scheduled workflows in repositories with no activity for 60 days; if that happens, re-enable the workflow from the Actions tab.

## Running it locally

```
$env:DRIVE_API_KEY="..."; $env:DRIVE_FOLDER_ID="..."; npm run gallery
npm run dev
```

This writes `public/gallery/` and `public/gallery.json` (ignored by git) so the gallery shows up in `npm run dev`.
