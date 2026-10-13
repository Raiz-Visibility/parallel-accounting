// One-shot converter: Claude Design handoff prototypes → Astro page bodies + per-page CSS.
//
// Each prototype carries its own stylesheet and draws the same markup on fixed-width
// artboards (.w1440 / .w768 / .w375). This turns the artboard-scoped rules into media
// queries, strips the canvas chrome, and rewrites prototype links, forms and contact
// details into the real thing.
//
// The page bodies in src/components/pages/ are the source of truth once generated and
// may be hand-edited — re-running OVERWRITES them. To regenerate into a scratch folder:
//   node tools/convert.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('../parallel-accounting-handoff/parallel-accounting-website-design/project');
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : null;
const BODY_OUT = OUT || path.resolve('src/components/pages');
const CSS_OUT = OUT || path.resolve('src/styles/pages');

// name → prototype file. `body: false` pages are hand-built (blog), only their CSS is converted.
const PAGES = {
  Home: { src: 'home-r3', css: 'home' },
  About: { src: 'about-r3', css: 'about' },
  Services: { src: 'services-r3', css: 'services' },
  LocalService: { src: 'local-service-r3', css: 'local-service' },
  Contact: { src: 'contact-r2', css: 'contact' },
  BlogArchive: { src: 'blog-archive-r3', css: 'blog-archive', body: false },
  BlogPost: { src: 'blog-post-r3', css: 'blog-post', body: false },
};

const MOBILE = '@media (max-width:640px)';
const TABLET = '@media (min-width:641px) and (max-width:1100px)';
const UP_TO_TABLET = '@media (max-width:1100px)';

const SERVICE_SLUGS = ['bookkeeping', 'accounts-payable', 'accounts-receivable', 'financial-analysis', 'controllership-cfo'];

// ───────────────────────── CSS ─────────────────────────

// Split a stylesheet into top-level items: { sel, body } rules and { media, rules } blocks.
function parse(css) {
  const items = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth && j < css.length) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const inner = css.slice(open + 1, j - 1);
    if (head.startsWith('@media')) items.push({ media: head, rules: parse(inner) });
    else items.push({ sel: head, body: inner.trim() });
    i = j;
  }
  return items;
}

function fluid(body, where) {
  if (where === 'base') return body.replace('--container:1240px', '--container:min(1240px,calc(100vw - 2 * var(--gutter)))').replace('--gutter:100px', '--gutter:clamp(48px,6.95vw,100px)');
  if (where === 'tablet') return body.replace('--container:672px', '--container:calc(100vw - 96px)');
  return body.replace('--container:327px', '--container:calc(100vw - 48px)');
}

// One design rule → [{ where: 'base'|'tablet'|'mobile', css }]
function convertRule({ sel, body }) {
  const groups = { base: [], tablet: [], mobile: [] };
  for (let s of sel.split(',').map(x => x.trim())) {
    if (/^\.dv-|^\.w1440\b/.test(s)) continue;
    const m = /^\.w(375|768)\b\s*/.exec(s);
    if (!m) { groups.base.push(s); continue; }
    const rest = s.slice(m[0].length);
    // `:root x` keeps the specificity `.w375 x` had, so later base rules still lose to it.
    groups[m[1] === '375' ? 'mobile' : 'tablet'].push(rest ? `:root ${rest}` : ':root');
  }
  const out = [];
  for (const where of ['base', 'tablet', 'mobile']) {
    if (!groups[where].length) continue;
    let b = body;
    if (groups[where].includes(':root')) b = fluid(b.replace(/(^|;)\s*width:\d+px;?/, '$1'), where).trim();
    if (b) out.push({ where, css: `${groups[where].join(',')}{${b}}` });
  }
  return out;
}

function convertCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import url\([^)]*\);/, '');
  const out = [];
  const wrap = { base: null, tablet: TABLET, mobile: MOBILE };
  for (const item of parse(css)) {
    if (item.media) {
      const q = item.media.replace(/\s+/g, '');
      const media = q === '@media(min-width:376px)and(max-width:768px)' ? TABLET : q === '@media(max-width:768px)' ? UP_TO_TABLET : null;
      if (!media) throw new Error('unexpected media query: ' + item.media);
      const inner = item.rules.flatMap(convertRule).map(r => (r.where === 'base' && media === TABLET && r.css.startsWith(':root{') ? fluid(r.css, 'tablet') : r.css));
      out.push(`${media}{\n${inner.join('\n')}\n}`);
    } else {
      for (const r of convertRule(item)) out.push(r.where === 'base' ? (r.css.startsWith(':root{') ? fluid(r.css, 'base') : r.css) : `${wrap[r.where]}{${r.css}}`);
    }
  }
  return out.join('\n') + '\n';
}

// ───────────────────────── markup ─────────────────────────

function matchClose(html, start) {
  const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(start))[1];
  const re = new RegExp(`<(/?)${tag}(?=[ >/])[^>]*>`, 'g');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[1]) depth--; else depth++;
    if (depth === 0) return m.index + m[0].length;
  }
  throw new Error('unbalanced <' + tag + '>');
}

function mainOf(html) {
  const body = html.slice(html.indexOf('</helmet>'));
  const start = body.indexOf('<div class="dv-card w1440">');
  let end = body.indexOf('<div class="dv-opt"', start);
  if (end < 0) end = body.length;
  const b = body.slice(start, end);
  const hs = b.search(/<(header|div) class="header">/);
  const fs_ = b.search(/<(footer|div) class="footer on-dark">/);
  return b.slice(matchClose(b, hs), fs_).trim();
}

const FIELD_NAMES = { Name: 'name', Phone: 'phone', Email: 'email' };

function convertBody(html, name) {
  // internal links
  const routes = { 'index.html': '/', 'services.html': '/services/', 'about.html': '/about/', 'blog-archive.html': '/blog/', 'contact.html': '/contact/' };
  html = html.replace(/href="([\w-]+\.html)"/g, (all, f) => {
    if (!(f in routes)) throw new Error('unmapped link ' + f);
    return `href={u('${routes[f]}')}`;
  });

  // artboard-anchor links (#1a) stand in for real destinations on some prototypes
  html = html.replace(/<a class="(tel|tel-lg|tel-lg nap-tel)" href="#1a">/g, '<a class="$1" href="tel:2505168889">');
  html = html.replace(/href="#1a">Book a call</g, `href={u('/contact/')}>Book a call<`);
  html = html.replace(/href="#1a">See what is included</g, 'href="#included">See what is included<');
  html = html.replace(/href="#(1a)?">Get directions</g, 'href={site.directions} target="_blank" rel="noopener">Get directions<');
  html = html.replace(/<a class="crumb-a" href="#1a">Home</g, `<a class="crumb-a" href={u('/')}>Home<`);

  // service-area tiles: only Victoria has a page so far
  html = html.replace(/<a class="city city-hq" href="#1a">([\s\S]*?)<\/a>/g, `<a class="city city-hq" href={u('/locations/victoria/')}>$1</a>`);
  html = html.replace(/<a class="city" href="#1a">([^<]*)<span class="city-a">&rarr;<\/span><\/a>/g, '<span class="city">$1</span>');

  // per-service links → anchors on the services page
  let n = 0;
  html = html.replace(/<a class="svl-a" href="#1a">/g, () => `<a class="svl-a" href={u('/services/#${SERVICE_SLUGS[n++]}')}>`);
  if (name === 'Home') {
    n = 0;
    html = html.replace(/<a class="btn-txt card-more" href=\{u\('\/services\/'\)\}>/g, () => `<a class="btn-txt card-more" href={u('/services/#${SERVICE_SLUGS[n++]}')}>`);
  }
  if (name === 'Services') {
    n = 0;
    html = html.replace(/<div class="svc-card">/g, () => `<div class="svc-card" id="${SERVICE_SLUGS[n++]}">`);
  }
  // "See what is included" target: the section holding the service cards
  if (html.includes('href="#included"')) {
    const at = html.lastIndexOf('<section', html.indexOf('<div class="svcs">'));
    html = html.slice(0, at) + '<section id="included"' + html.slice(at + '<section'.length);
  }

  // contact page: one form instead of one per artboard
  html = html.replace(/#form-1a/g, '#form-contact').replace(/id="form-1a"/g, 'id="form-contact"').replace(/id="find-us-1a"/g, 'id="find-us"');

  // forms: make them submittable (handled by src/scripts/site.js)
  html = html.replace(/<form class="([^"]*)"/g, '<form class="$1" data-form method="post" action={site.formEndpoint || site.mailto}');
  html = html.replace(/<span class="field-lab">([^<]*)<\/span><(input|textarea) class="([^"]*)"/g, (all, label, tag, cls) =>
    `<span class="field-lab">${label}</span><${tag} class="${cls}" name="${FIELD_NAMES[label] || 'message'}"${label === 'Phone' ? '' : ' required'}`);
  html = html.replace(/<button class="(btn btn-[12])" type="button">Send it over<\/button>/g, '<button class="$1" type="submit">Send it over</button>');
  html = html.replace(/<p class="form-note">/g, '<p class="form-note" data-form-note>');

  // map placeholder → live embed for the listed address
  html = html.replace(/<div class="(nap-map[^"]*)"><p class="nap-map-k">[^<]*<\/p><\/div>/g,
    '<div class="$1 has-map"><iframe src={site.mapEmbed} title="Map showing the Parallel Accounting office" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>');

  // FAQ: the first item is drawn open
  html = html.replace(/<button class="faq-q" type="button">([^<]*)<span class="faq-s">(&ndash;|\+)<\/span><\/button>/g,
    (all, q, sign) => `<button class="faq-q" type="button" aria-expanded="${sign === '+' ? 'false' : 'true'}">${q}<span class="faq-s" aria-hidden="true">${sign}</span></button>`);

  // business details from src/data/site.ts
  html = html.replace(/href="tel:2505168889"/g, 'href={site.tel}').replace(/>250-516-8889</g, '>{site.phone}<');
  html = html.replace(/href="mailto:hello@parallelaccounting\.co"/g, 'href={site.mailto}').replace(/>hello@parallelaccounting\.co</g, '>{site.email}<');
  html = html.replace(/>1002 Wharf Street, Victoria, BC V8W 1T4</g, '>{site.address}<').replace(/>Monday to Friday, 8:30am to 5:00pm PT</g, '>{site.hours}<');

  const left = html.match(/href="#1a"[^>]*>[^<]*/g);
  if (left) throw new Error(`${name}: unmapped prototype links: ${[...new Set(left)].join(' | ')}`);
  return html;
}

// ───────────────────────── run ─────────────────────────

fs.mkdirSync(BODY_OUT, { recursive: true });
fs.mkdirSync(CSS_OUT, { recursive: true });
const shared = fs.readFileSync(path.resolve('tools/shared.css'), 'utf8');

for (const [name, page] of Object.entries(PAGES)) {
  const html = fs.readFileSync(path.join(SRC, page.src + '.html'), 'utf8');
  const css = convertCss(/<style>([\s\S]*?)<\/style>/.exec(html)[1]);
  fs.writeFileSync(path.join(CSS_OUT, page.css + '.css'), `/* Generated from ${page.src}.html by tools/convert.mjs, followed by tools/shared.css. */\n${css}\n${shared}`);
  if (page.body === false) continue;
  const body = convertBody(mainOf(html), name);
  const opens = (body.match(/<div[ >]/g) || []).length, closes = (body.match(/<\/div>/g) || []).length;
  if (opens !== closes) console.warn(`${name}: <div> ${opens} opened, ${closes} closed`);
  fs.writeFileSync(path.join(BODY_OUT, name + '.astro'), `---\n// Page body converted from the Claude Design handoff (${page.src}.html). Edit freely.\nimport { site, u } from '../../data/site';\n---\n${body}\n`);
  console.log('wrote', name);
}
