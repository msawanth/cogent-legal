// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://iocogent.com',
  integrations: [
    react(),
    sitemap({
      // The legal pages are static files in public/, not Astro routes, so list
      // them explicitly alongside the generated home route.
      customPages: [
        'https://iocogent.com/privacy.html',
        'https://iocogent.com/terms.html',
        'https://iocogent.com/delete-account.html',
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
