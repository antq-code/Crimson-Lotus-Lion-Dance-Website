// Edit this file to change site text, images, and links.
// Put image files in /public/images and reference them as '/images/<file>'.

export const site = {
  name: 'Crimson Lotus',
  logo: '/images/Crimson_Lotus_Logo_HD.svg',
  lettering: '/images/Crimson_Lotus_Gold_Lettering.svg',
  heroImage: '/images/heroIMG.jpg',

  nav: [
    { label: 'Our Team', href: '#team' },
    { label: 'Merch', href: 'https://crimson-lotus-lion-dance.printify.me/' },
    { label: 'Contact Us', href: '#contact' },
  ],

  mission: {
    title: 'Mission Statement',
    text:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
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
    turnstileSiteKey: import.meta.env.DEV ? '1x00000000000000000000AA' : 'YOUR_SITE_KEY',
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
      email: 'mailto:crimsonlotuslions@gmail.com',
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
