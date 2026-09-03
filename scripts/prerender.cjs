/**
 * Writes one static HTML file per section, so a shared link previews as itself.
 *
 * utils/seo.ts already gives each route its own title, description and canonical
 * — but it does that in JavaScript, after the page boots. Google runs JS and so
 * sees it; the crawlers behind link previews (Facebook, WhatsApp, Slack, X,
 * Reddit, iMessage) do not. They read the raw HTML and stop. Every section link
 * shared anywhere therefore unfurled with the homepage's title and blurb.
 *
 * This takes dist/index.html, swaps the metadata for each section's, and writes
 * dist/<section>.html. public/.htaccess serves those files for extension-less
 * URLs. The page itself is unchanged — same bundle, same app — so this only
 * affects what a crawler reads before any JavaScript runs.
 *
 * The copy is read from utils/seo.ts rather than restated here: two lists of
 * descriptions that must agree is the bug this repo keeps finding.
 *
 * Runs automatically as part of `npm run build`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const INDEX = path.join(DIST, 'index.html');

/** Compile one of the app's TypeScript modules and load it here. */
function loadModule(relPath, tmpName) {
  const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'));
  const tmp = path.join(DIST, tmpName);
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, relPath)],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: tmp,
    logLevel: 'silent',
  });
  const mod = require(tmp);
  fs.unlinkSync(tmp);
  return mod;
}

/** Replace a tag's content attribute, or report that the tag was not found. */
function setTag(html, attr, key, value) {
  const pattern = new RegExp(`(<meta\\s+${attr}=["']${key}["']\\s+content=["'])([^"']*)(["'])`, 'i');
  if (!pattern.test(html)) return { html, missing: `${attr}=${key}` };
  return { html: html.replace(pattern, `$1${escapeAttr(value)}$3`), missing: null };
}

const escapeAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function buildPage(indexHtml, section, seo) {
  const { title, description } = seo.metaForSection(section);
  const canonical = seo.canonicalFor(section);
  const robots = seo.isIndexable(section) ? 'index, follow' : 'noindex, follow';

  let html = indexHtml;
  const missing = [];
  const apply = (attr, key, value) => {
    const r = setTag(html, attr, key, value);
    html = r.html;
    if (r.missing) missing.push(r.missing);
  };

  apply('name', 'title', title);
  apply('name', 'description', description);
  apply('name', 'robots', robots);
  apply('property', 'og:title', title);
  apply('property', 'og:description', description);
  apply('property', 'og:url', canonical);
  apply('property', 'twitter:title', title);
  apply('property', 'twitter:description', description);
  apply('property', 'twitter:url', canonical);

  // <title> and canonical are not meta tags.
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) missing.push('<title>');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);

  if (!/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']/i.test(html)) missing.push('canonical');
  html = html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])([^"']*)(["'])/i,
    `$1${canonical}$3`,
  );

  return { html, missing };
}

function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('prerender: dist/index.html not found — run vite build first.');
    process.exit(1);
  }

  const seo = loadModule('utils/seo.ts', '__seo.cjs');
  const routes = loadModule('utils/routes.ts', '__routes.cjs');
  const indexHtml = fs.readFileSync(INDEX, 'utf8');
  const sections = Object.keys(seo.SECTION_META);

  if (sections.length === 0) {
    console.error('prerender: SECTION_META is empty — nothing to write.');
    process.exit(1);
  }

  let failed = false;
  for (const section of sections) {
    const { html, missing } = buildPage(indexHtml, section, seo);

    // A silent no-op is the dangerous outcome here: the file would be written,
    // deploy fine, and still preview as the homepage. Fail the build instead.
    if (missing.length) {
      console.error(`prerender: ${section} — could not find ${missing.join(', ')} in index.html`);
      failed = true;
      continue;
    }

    const slug = routes.pathForSection(section).replace(/^\//, '');
    fs.writeFileSync(path.join(DIST, `${slug}.html`), html, 'utf8');
    console.log(`prerender: ${slug}.html`);
  }

  if (failed) {
    console.error('prerender: index.html no longer has the tags this rewrites. Fix before deploying.');
    process.exit(1);
  }
  console.log(`prerender: wrote ${sections.length} page(s).`);
}

main();
