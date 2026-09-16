# Artwork images

Drop image files here — `.jpg`, `.jpeg`, `.png`, `.webp`, or `.avif`.

Nothing in this folder appears on the site until it is switched on:

1. Copy images into this folder (or drag them onto the admin page).
2. Run `npm run admin` and open http://localhost:4322
3. Press **Scan folder**. New files appear as **hidden**.
4. Toggle the ones that should be public, set titles and details, reorder.
5. Run `npm run build` and deploy.

Filenames become the default titles, so `Sunrise Over The Bay.jpg` starts out
titled "Sunrise Over The Bay". Rename the file or edit the title in the admin.
