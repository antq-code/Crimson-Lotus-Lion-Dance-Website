// Edit this file to change site text, images, and links.
// Put image files in /public/images and reference them as '/images/<file>'.
// The hero, mission and contact photos are resized copies made by `npm run images`
// from the originals in /images-src (see scripts/optimize-images.mjs).

export const site = {
  name: 'Crimson Lotus',
  logo: '/images/Crimson_Lotus_Logo_HD.svg',
  lettering: '/images/Crimson_Lotus_Gold_Lettering.svg',
  // Also listed in index.html (preload); keep the two in sync.
  heroImage: {
    src: '/images/opt/hero-1920.webp',
    srcSet: '/images/opt/hero-1280.webp 1280w, /images/opt/hero-1920.webp 1920w, /images/opt/hero-2560.webp 2560w',
    // Phones get a 3:4 crop from the middle of the photo (the part they show anyway).
    mobileSrcSet: '/images/opt/hero-m-720.webp 720w, /images/opt/hero-m-1080.webp 1080w',
  },
  tagline: "Welcome to College Station's one and only Lion Dance Team!",
  motto: 'Strength Through Tradition, Power in Motion',

  nav: [
    { label: 'Our Team', href: '#team' },
    { label: 'Membership', href: 'https://docs.google.com/forms/d/e/1FAIpQLSeJots9PxmMkF-wnCNTq7l4KBvW2SoWqsJXZ5MY4cTQoT7rZQ/viewform' },
    { label: 'Merch', href: 'https://crimson-lotus-lion-dance.printify.me/' },
    { label: 'Contact Us', href: '#officers' },
  ],

  mission: {
    title: 'Mission Statement',
    text:
      'Crimson Lotus Lion Dance Team is a lion dance team based in College Station, Texas, dedicated to preserving and sharing the art and culture of lion dance with the College Station and Bryan communities. Starting as a group of friends who wanted to continue practicing lion dance while away from home, Crimson Lotus has grown into a team of hardworking members with diverse levels of lion dance experience. Here at Crimson Lotus we want to provide a fun and educational environment to our members and clients throughout Texas!',
    image: '/images/opt/mission-960.webp',
    imageSrcSet: '/images/opt/mission-640.webp 640w, /images/opt/mission-960.webp 960w, /images/opt/mission-1280.webp 1280w',
    imageAlt: 'Lions performing on stage',
  },

  team: {
    title: 'Our Team',
    // Gallery photos come from the team's Google Drive folder (see docs/photo-gallery.md).
  },

  officers: {
    title: 'Officer Contacts',
    // Photos: put each officer's photo (portrait, about 3:4) in /public/images/officers.
    // Until a photo is there, the card shows the officer's initials. `language` is optional.
    // `altPhoto` (optional): clicking the photo makes it glow and fade into this one, and back.
    people: [
      { name: 'Evan Cao', role: 'Team Lead', phone: '(713)-499-0859', photo: '/images/officers/evan-cao.webp' },
      {
        name: 'Star Phan',
        role: 'Team Officer',
        phone: '(281)-636-3731',
        photo: '/images/officers/star-phan.webp',
        altPhoto: '/images/officers/star-loopy.webp',
      },
      {
        name: 'An Le',
        role: 'Team Officer',
        language: 'Vietnamese',
        phone: '(832)-909-2464',
        photo: '/images/officers/an-le.webp',
      },
      {
        name: 'Keiko Cheung',
        role: 'Team Officer',
        language: 'Mandarin',
        phone: '(281)-786-0999',
        photo: '/images/officers/keiko-cheung.webp',
      },
    ],
  },

  contact: {
    title: 'Reach out to us for performances!',
    // Sizes of the background photo; the page picks one to fit the screen.
    backgroundSrcSet: '/images/opt/contact-1280.webp 1280w, /images/opt/contact-1920.webp 1920w, /images/opt/contact-2560.webp 2560w',
    // Easter egg: clicking the purple "LEVEL 7" parking sign in the background photo dims
    // the site and plays this.
    easterEgg: {
      image: '/images/surprise.webp',
      alt: 'A team member dancing at night next to a Texas A&M parking sign',
      // Pixel size of the original background photo (its shape is what matters), used to keep
      // the clickable area on the sign at any screen size.
      backgroundSize: [5797, 3865],
      // Clickable area, as [x%, y%] points across/down the background photo: the LEVEL 7 sign.
      outline: [[63.6, 47.8], [65.3, 47.8], [65.3, 50.6], [63.6, 50.6]],
    },
    // Shown next to the form as a fallback. The form itself sends through the Cloudflare
    // Worker in /worker; its destination address is set in worker/wrangler.toml.
    email: 'crimsonlotuslions@gmail.com',
    // The contact Worker. In dev, point it at a local `wrangler dev` with VITE_CONTACT_API.
    api: import.meta.env.VITE_CONTACT_API || 'https://api.crimsonlotusld.com/contact',
    // Turnstile site key (public). Dev uses Cloudflare's always-pass test key.
    turnstileSiteKey: import.meta.env.DEV ? '1x00000000000000000000AA' : '0x4AAAAAAFjqLx_FS2nvtKWv',
    eventTypes: [
      'Lunar New Year',
      'Wedding',
      'Grand opening',
      'Festival or cultural event',
      'School or community event',
      'Corporate event',
      'Other',
    ],
    socials: {
      instagram: 'https://www.instagram.com/crimsonlotusld/',
      youtube: 'https://www.youtube.com/@crimsonlotusliondance',
      discord: 'https://discord.com/invite/v7aPxyUg9f',
    },
  },
};
