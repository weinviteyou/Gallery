// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Update this once a domain is connected - it is used for canonical URLs.
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
