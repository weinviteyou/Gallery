# Art gallery website

A static editorial gallery site for paintings and photography. Built with Astro 5
and Tailwind CSS v4, styled after the monopo saigon design system: monochrome
interface, oversized type, sharp corners everywhere except pill-shaped buttons,
no shadows, and a single iridescent gradient reserved for hero media.

## Everyday use

### 1. Add images

Copy image files into `src/assets/art/` (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`).
You can also drag files onto the admin page and it will copy them there for you.

### 2. Choose what is public

```bash
npm run admin
```

Open <http://localhost:4322>. The admin is local only — it listens on `127.0.0.1`
and is never part of the published site.

- **Scan folder** picks up any new image. New files always start **hidden**.
- **Public / Hidden** is the switch that decides whether a work appears anywhere
  on the site. A hidden work has no gallery entry and no page of its own.
- **Featured** picks which works appear on the home page. With nothing featured,
  the home page falls back to the first six public works.
- Drag a thumbnail to reorder. Order applies to the home page and the gallery.
- Fill in title, category, year, medium, dimensions and description inline.
- **Save changes** writes `src/data/artworks.json`.

### 3. Preview and publish

```bash
npm run dev      # http://localhost:4321
npm run build    # writes dist/
```

The live site only changes after a build and a deploy.

## Editing the text

Everything about the gallery — name, tagline, hero wording, artist statement,
email, location, social links, nav — lives in `site.config.ts`. That is the only
file to edit for copy changes.

To use a portrait on the About page, put the image in `src/assets/art/` and set
`about.portrait` to its filename. Leave it `null` for the gradient placeholder.

## Deploying to Cloudflare Pages

Set `site` in `astro.config.mjs` to the final URL first (used for canonical tags).

**Option A — connect the repository** (push to deploy):

1. Push this project to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command `npm run build`, output directory `dist`.

**Option B — deploy the built folder directly:**

```bash
npm run build
npx wrangler pages deploy dist --project-name gallery
```

## Layout

```
site.config.ts          all site copy in one file
src/data/artworks.json  the manifest the admin writes
src/lib/artworks.ts     the visibility rule, applied in one place
src/assets/art/         source images (optimised at build time)
src/components/         nav, footer, hero, artwork row, gallery grid
src/pages/              index, gallery, about, contact, art/[slug], 404
tools/admin/            the local admin tool (never published)
```

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server at <http://localhost:4321> |
| `npm run admin` | Artwork admin at <http://localhost:4322> |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
