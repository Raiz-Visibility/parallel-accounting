// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages: SITE is the public origin, BASE the repo subpath ('/' for a custom
// domain or a <user>.github.io repo). Both are set by .github/workflows/deploy.yml.
export default defineConfig({
  site: process.env.SITE || 'https://parallelaccounting.co',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
