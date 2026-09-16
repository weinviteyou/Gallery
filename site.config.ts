/**
 * Single edit point for everything about the gallery.
 * Replace the placeholders below with real details.
 */
export const site = {
  name: 'Studio Name',
  tagline: 'Paintings & Photography',
  /** Shown at display scale in the hero. Keep it to one or two words. */
  heroHeadline: 'Studio',
  /** Whisper line under the hero, set in weight 300. Keep it short. */
  heroStatement:
    'A working archive of paintings and photographs, published one piece at a time.',
  description:
    'An editorial gallery of original paintings and photography.',
  email: 'hello@example.com',
  location: 'City, Country',
  about: {
    heading: 'About',
    /** Each string is one paragraph. */
    paragraphs: [
      'Write the artist statement here. Two or three short paragraphs work best against the large type - the layout gives them room rather than filling it.',
      'Mention the materials, the recurring subjects, and what the work is reaching for. Keep the register plain; the typography carries the weight.',
    ],
    /** Optional portrait. Drop a file in src/assets/art/ and name it here, or leave null. */
    portrait: null as string | null,
  },
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Behance', href: 'https://behance.net/' },
  ],
  nav: [
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
};

export type Site = typeof site;
