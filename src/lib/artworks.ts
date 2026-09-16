import artworksData from '../data/artworks.json';

export type Category = 'painting' | 'photograph';

export interface Artwork {
  id: string;
  /** Filename inside src/assets/art/ */
  file: string;
  title: string;
  category: Category;
  year: string;
  medium: string;
  dimensions: string;
  description: string;
  /** The single switch the whole site respects. */
  visible: boolean;
  featured: boolean;
  order: number;
}

const all = artworksData as Artwork[];

/** Every image under src/assets/art/, keyed by filename. */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/art/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true }
);

const byFilename = new Map<string, ImageMetadata>(
  Object.entries(images).map(([path, mod]) => [
    path.split('/').pop() as string,
    mod.default,
  ])
);

/** Resolved image for an artwork, or null when the file is missing from disk. */
export function imageFor(artwork: Artwork): ImageMetadata | null {
  return byFilename.get(artwork.file) ?? null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Stable, collision-free slug for an artwork's detail page. */
export function slugFor(artwork: Artwork): string {
  const base = slugify(artwork.title) || 'untitled';
  return `${base}-${artwork.id}`;
}

function sorted(list: Artwork[]): Artwork[] {
  return [...list].sort((a, b) => a.order - b.order);
}

/**
 * The visibility rule lives here and nowhere else. Every page reads through
 * this function, so a hidden artwork cannot leak into a listing or a route.
 */
export function getVisibleArtworks(): Artwork[] {
  return sorted(all.filter((a) => a.visible && byFilename.has(a.file)));
}

export function getFeatured(limit = 6): Artwork[] {
  const featured = getVisibleArtworks().filter((a) => a.featured);
  return (featured.length ? featured : getVisibleArtworks()).slice(0, limit);
}

export function getByCategory(category: Category): Artwork[] {
  return getVisibleArtworks().filter((a) => a.category === category);
}

export function getBySlug(slug: string): Artwork | undefined {
  return getVisibleArtworks().find((a) => slugFor(a) === slug);
}

/** Categories that actually have visible work, for the gallery filter. */
export function activeCategories(): Category[] {
  const present = new Set(getVisibleArtworks().map((a) => a.category));
  return (['painting', 'photograph'] as Category[]).filter((c) => present.has(c));
}

export const categoryLabels: Record<Category, string> = {
  painting: 'Paintings',
  photograph: 'Photography',
};
