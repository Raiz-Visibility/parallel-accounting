# Parallel Accounting website

Astro site built from the Claude Design handoff (`Parallel Accounting — Website Design`).
Static output, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

```bash
npm install
npm run dev      # http://localhost:4321 (4322 via the Claude preview)
npm run build    # static site in dist/
```

## Where things live

| What | Where |
| --- | --- |
| Phone, email, address, hours, nav, service list | `src/data/site.ts` |
| Header, footer | `src/components/Header.astro`, `src/components/Footer.astro` |
| Page bodies (home, about, services, Victoria, contact) | `src/components/pages/*.astro` |
| Blog posts (Markdown) | `src/content/blog/*.md` |
| Blog archive and post templates | `src/pages/blog/` |
| Per-page styles | `src/styles/pages/*.css` |
| Menu, FAQ, forms, "Load more" | `src/scripts/site.js` |

Each page keeps the stylesheet of the design it came from, because the designs define some
shared class names differently from page to page. Rules that apply everywhere are in
`tools/shared.css` and are appended to every page stylesheet by the converter.

Breakpoints: phone up to 640px, tablet 641–1100px, desktop above. The inline nav folds into
the menu button below 1241px.

## Blog posts

Add a Markdown file to `src/content/blog/`. The file name becomes the URL.

```md
---
title: "Post title"
excerpt: "One or two sentences, shown on the archive and under the title."
category: Cash flow
date: 2026-10-01
readTime: 5 min read
---
```

Plain Markdown is styled to match the design. The six short posts and the holdback article
are sample content from the design (`sample: true`); replace or delete them before launch.

## Placeholders

Content the design flagged as unconfirmed carries the `ph` class and shows a dashed outline
in `npm run dev` only: address, hours, testimonials, sample post titles and dates. The tan
"Shot" fields are where photographs go.

## Contact forms

The four enquiry forms (home, services, Victoria, contact) post to Web3Forms. The access key
is in `src/data/site.ts`; it decides which inbox receives the emails. To use a different
key without editing code, set the `PUBLIC_WEB3FORMS_KEY` repository variable. Each email's
subject says which page the enquiry came from.

## Re-converting the design

`npm run convert` regenerates the page bodies and stylesheets from the handoff folder
(`../parallel-accounting-handoff`). It overwrites `src/components/pages/`, so pass a scratch
folder if those files have been edited by hand: `node tools/convert.mjs <outDir>`.
