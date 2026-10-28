# Page speed: how the site loads

The first load fetches only what's on screen: the page code, the two fonts, the logo and
lettering, and the hero photo. Everything below it waits until the visitor scrolls near it.

## Large photos (hero, mission, contact background)

The originals live in `images-src/` and are **not** deployed. The site uses resized WebP
copies in `public/images/opt/`, made by:

```
npm run images
```

To replace a photo, overwrite the file in `images-src/` with the same name, run
`npm run images`, and commit both. The output names don't change, so no code changes are
needed. To add a new size or photo, edit `PHOTOS` in `scripts/optimize-images.mjs`.

- **Hero:** 1280/1920/2560px wide for larger screens, plus a 3:4 crop from the middle
  (720/1080px) for phones. It's preloaded from `index.html`, so it starts downloading before
  the page code runs. If you change the hero file names, update both `index.html` and
  `heroImage` in `src/content.js`.
- **Mission photo:** 640/960/1280px; the browser picks one for the screen.
- **Contact background:** 1280/1920/2560px; the page picks the smallest that covers the
  section on that screen.

## What loads on demand

"Near" means about one screen away, and only after the first load (hero included) has
finished, so nothing competes with the hero.

| What | When it downloads |
|---|---|
| Mission photo, officer photos, contact background | Near |
| StarLoopy (Star's second photo) | When someone points at, focuses or taps Star's photo |
| Gallery photos | Within about 600px (the gallery's own setting) |
| Cloudflare Turnstile (about 900 KB on the live site) | When the form is near |
| Easter-egg animation | On hover/focus or the first click of the LEVEL 7 sign |
| Hero cursor grid (WebGL) | After the first load, when the browser is idle; it fades in. Setting up WebGL for the first time can block a fresh browser for a moment |
| Code for the Our Team, Officer Contacts and Contact sections | Near, or as soon as the browser is idle after the first load |

The sections render when the browser is idle even if nobody scrolls, so find-in-page,
screen readers and search engines see the whole page; their photos still wait until they're
near. Navbar links render any sections that aren't on the page yet before scrolling.

The helpers are in `src/lazyLoad.js` (`useNear`, `showAllSections`) and
`src/components/Deferred.jsx`. To add a below-the-fold section, import it with `lazy()` in
`src/App.jsx` and wrap it in `<Deferred>`; for a below-the-fold image, use `useNear` the way
`src/components/Photo.jsx` does.

## Fonts

Cinzel and Crimson Pro are served from `public/fonts/` (Latin subsets from Google Fonts,
variable fonts, so one file covers every weight). They're declared with `@font-face` at the
top of `src/styles.css` and preloaded from `index.html`. Both are under the SIL Open Font
License; the license texts are next to the files.

## SVGs

The logo and lettering were compressed with `svgo` (`npx svgo -p 1 -i <file> -o <file>`), which
rounds path coordinates to one decimal place. Run the same on any replacement SVG.
