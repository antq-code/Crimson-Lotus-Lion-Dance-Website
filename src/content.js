// Edit this file to change site text, images, and links.
// Put image files in /public/images and reference them as '/images/<file>'.

export const site = {
  name: 'Crimson Lotus',
  logo: '/images/Crimson_Lotus_Logo_HD.svg',
  lettering: '/images/Crimson_Lotus_Gold_Lettering.svg',
  heroImage: '/images/heroIMG.jpg',
  tagline: "Welcome to College Station's one and only Lion Dance Team!",
  motto: 'Strength Through Tradition, Power in Motion',

  nav: [
    { label: 'Our Team', href: '#team' },
    { label: 'Merch', href: 'https://crimson-lotus-lion-dance.printify.me/' },
    { label: 'Contact Us', href: '#contact' },
  ],

  mission: {
    title: 'Mission Statement',
    text:
      'Founded in 2024 by Texas A&M student lion dancers who wanted to keep this tradition thriving in College Station. We perform at festivals, grand openings, and community events across Texas, from our second home in College Station to Houston, Dallas, and Austin, bringing blessings of good fortune and prosperity. On campus, we offer workshops that open the art to students of every background and experience level, passing on the rhythm, discipline, and spirit of lion dance to the next generation. We are a team built on culture, respect for tradition, and the joy of bringing a crowd to its feet.',
    image: '/images/missionIMG.jpg',
    imageAlt: 'Lions performing on stage',
  },

  team: {
    title: 'Our Team',
    // Add as many photos as you like; the gallery loops through them.
    // title shows under each photo; description shows when a photo is clicked open.
    photos: [
      { src: '/images/teamIMG.jpg', title: 'The Team', description: '', alt: 'Team group photo' },
      { src: '/images/teamIMG2.jpg', title: 'Purple Lion', description: '', alt: 'Dancer holding a purple lion head' },
      { src: '/images/teamIMG3.jpg', title: 'Warm-Ups', description: '', alt: 'Team members warming up' },
      { src: '/images/gallery/lion-closeup.jpg', title: 'Up Close', description: '', alt: 'Close-up of a red and white lion head with gold trim' },
      { src: '/images/gallery/meet-the-lion.jpg', title: 'Meet the Lion', description: '', alt: 'Team member in a jersey standing beside a white and pink lion' },
      { src: '/images/gallery/uniform-reveal-steps.jpg', title: 'Uniform Reveal', description: '', alt: 'Team posing on the steps of a columned building, holding red banners' },
      { src: '/images/gallery/uniform-reveal-doorway.jpg', title: 'Standing Tall', description: '', alt: 'Red and black lion rearing up in a doorway between stone columns' },
      { src: '/images/gallery/uniform-reveal-red-lion.jpg', title: 'Red Lion', description: '', alt: 'Red lion performing on stone steps in front of columns' },
      { src: '/images/gallery/otaku-festival-huddle.jpg', title: 'Team Huddle', description: '', alt: 'Team members bumping fists in a huddle before a performance' },
      { src: '/images/gallery/otaku-festival-performance.jpg', title: 'Otaku Food Festival', description: '', alt: 'Three lions performing inside a shopping mall' },
      { src: '/images/gallery/otaku-festival-group.jpg', title: 'Festival Crew', description: '', alt: 'Team group photo with lions inside a shopping mall' },
    ],
  },

  contact: {
    title: 'Reach out to us for performances!',
    backgroundImage: '/images/contactIMG.jpg',
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
    links: [
      {
        label: 'Workshop Consent Form',
        href: 'https://docs.google.com/forms/d/e/1FAIpQLSeDTk7l5CerUBPddx5nPse2P53PWwEh4IjhQwaY0khQzKSGJQ/viewform',
      },
    ],
  },
};
