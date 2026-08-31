import fs from 'node:fs';
import path from 'node:path';

const siteDir = path.resolve('uru-mae-shindan');
const baseUrl = 'https://flhworks.github.io/flh.works/uru-mae-shindan/';
const htmlFiles = fs.readdirSync(siteDir).filter((name) => name.endsWith('.html') && !/^google[a-z0-9]+\.html$/i.test(name)).sort();
const indexableFiles = htmlFiles.filter((name) => name !== '404.html');
const breadcrumbRequired = new Set([
  'instrument-selling.html',
  'instrument-assessment-check.html',
  'smartphone-pc-selling.html',
  'smartphone-data-erasure-before-selling.html',
  'camera-selling.html',
  'books-hobby-selling.html',
  'figure-purchase-cancellation-check.html',
  'brand-watch-selling.html',
  'kimono-clothing-selling.html',
  'kimono-clothing-assessment-check.html',
  'home-purchase.html',
]);
const errors = [];

const fail = (message) => errors.push(message);
const read = (name) => fs.readFileSync(path.join(siteDir, name), 'utf8');
const canonicalFor = (name) => name === 'index.html' ? baseUrl : `${baseUrl}${name}`;
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2] : '';
};
const findTags = (html, name, required = {}) => tags(html, name).filter((tag) =>
  Object.entries(required).every(([key, value]) => attr(tag, key).toLowerCase() === value.toLowerCase())
);
const textOf = (html, name) => {
  const match = html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? match[1].replace(/<[^>]+>/g, '').replace(/\\s+/g, ' ').trim() : '';
};

const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
const outgoing = new Map();
const incoming = new Map(indexableFiles.map((name) => [name, 0]));

for (const file of htmlFiles) {
  const html = read(file);
  const title = textOf(html, 'title');
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const descriptionTags = findTags(html, 'meta', { name: 'description' });
  const robotsTags = findTags(html, 'meta', { name: 'robots' });

  if (!title) fail(`${file}: title is missing`);
  if (/href=["']index\.html(?:["'#])/i.test(html)) fail(`${file}: top links must use the canonical ./ URL instead of index.html`);
  if (h1Count !== 1) fail(`${file}: expected exactly one h1, found ${h1Count}`);
  if (descriptionTags.length !== 1 || !attr(descriptionTags[0], 'content')) fail(`${file}: expected one non-empty meta description`);
  if (robotsTags.length !== 1) fail(`${file}: expected exactly one robots meta tag`);

  if (file === '404.html') {
    if (!attr(robotsTags[0] || '', 'content').toLowerCase().includes('noindex')) fail('404.html: robots must include noindex');
  } else {
    const expectedCanonical = canonicalFor(file);
    const canonicalTags = findTags(html, 'link', { rel: 'canonical' });
    const ogType = findTags(html, 'meta', { property: 'og:type' });
    const ogTitle = findTags(html, 'meta', { property: 'og:title' });
    const ogDescription = findTags(html, 'meta', { property: 'og:description' });
    const ogUrl = findTags(html, 'meta', { property: 'og:url' });
    const twitterCard = findTags(html, 'meta', { name: 'twitter:card' });
    const robots = attr(robotsTags[0] || '', 'content').toLowerCase();

    if (!robots.includes('index') || robots.includes('noindex')) fail(`${file}: robots must allow indexing`);
    if (canonicalTags.length !== 1 || attr(canonicalTags[0], 'href') !== expectedCanonical) fail(`${file}: canonical must be ${expectedCanonical}`);
    if (ogType.length !== 1) fail(`${file}: expected exactly one og:type`);
    if (ogTitle.length !== 1 || !attr(ogTitle[0], 'content')) fail(`${file}: expected one non-empty og:title`);
    if (ogDescription.length !== 1 || !attr(ogDescription[0], 'content')) fail(`${file}: expected one non-empty og:description`);
    if (ogUrl.length !== 1 || attr(ogUrl[0], 'content') !== expectedCanonical) fail(`${file}: og:url must match canonical`);
    if (twitterCard.length !== 1 || attr(twitterCard[0], 'content') !== 'summary') fail(`${file}: twitter:card must be summary`);

    const description = attr(descriptionTags[0] || '', 'content');
    if (titles.has(title)) fail(`${file}: duplicate title with ${titles.get(title)}`); else titles.set(title, file);
    if (descriptions.has(description)) fail(`${file}: duplicate description with ${descriptions.get(description)}`); else descriptions.set(description, file);
    if (canonicals.has(expectedCanonical)) fail(`${file}: duplicate canonical with ${canonicals.get(expectedCanonical)}`); else canonicals.set(expectedCanonical, file);
  }

  let hasBreadcrumb = false;
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      const types = [data['@type'], ...(data['@graph'] || []).map((item) => item['@type'])].flat();
      if (types.includes('BreadcrumbList')) hasBreadcrumb = true;
    } catch (error) {
      fail(`${file}: invalid JSON-LD (${error.message})`);
    }
  }
  if (breadcrumbRequired.has(file) && !hasBreadcrumb) fail(`${file}: BreadcrumbList JSON-LD is required`);

  for (const anchor of html.matchAll(/<a\b[^>]*href=["']https:\/\/px\.a8\.net\/[^"']+["'][^>]*>/gi)) {
    const rel = attr(anchor[0], 'rel').split(/\s+/).map((value) => value.toLowerCase());
    if (!rel.includes('nofollow')) fail(`${file}: A8 link must retain the formal nofollow attribute`);
  }

  const destinations = new Set();
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|javascript:|#)/i.test(href)) continue;
    const pathname = href.split(/[?#]/)[0];
    if (!pathname) continue;
    const targetPath = path.resolve(siteDir, pathname);
    if (!targetPath.startsWith(`${siteDir}${path.sep}`) && targetPath !== siteDir) {
      fail(`${file}: internal link escapes the site directory (${href})`);
      continue;
    }
    if (!fs.existsSync(targetPath)) {
      fail(`${file}: broken internal link (${href})`);
      continue;
    }
    if (targetPath.endsWith('.html')) {
      const target = path.basename(targetPath);
      destinations.add(target);
      if (incoming.has(target)) incoming.set(target, incoming.get(target) + 1);
    }
  }
  outgoing.set(file, destinations);
}

const reachable = new Set(['index.html']);
const queue = ['index.html'];
while (queue.length) {
  const current = queue.shift();
  for (const target of outgoing.get(current) || []) {
    if (!reachable.has(target) && target !== '404.html') {
      reachable.add(target);
      queue.push(target);
    }
  }
}
for (const file of indexableFiles) {
  if (!reachable.has(file)) fail(`${file}: not reachable from index.html through crawlable links`);
  if (file !== 'index.html' && incoming.get(file) === 0) fail(`${file}: has no incoming internal link`);
}

const sitemap = read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = indexableFiles.map(canonicalFor).sort();
const actualUrls = [...sitemapUrls].sort();
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml: duplicate URL found');
if (JSON.stringify(actualUrls) !== JSON.stringify(expectedUrls)) {
  const missing = expectedUrls.filter((url) => !actualUrls.includes(url));
  const extra = actualUrls.filter((url) => !expectedUrls.includes(url));
  fail(`sitemap.xml: URL set mismatch; missing=${missing.join(',') || 'none'} extra=${extra.join(',') || 'none'}`);
}
for (const match of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const block = match[1];
  if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(block)) fail('sitemap.xml: every URL must have an ISO date lastmod');
}

const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${baseUrl}sitemap.xml`)) fail('robots.txt: sitemap declaration is missing or incorrect');

if (errors.length) {
  console.error(errors.map((message) => `ERROR: ${message}`).join('\n'));
  process.exit(1);
}

console.log(`SEO_AUDIT=PASS pages=${htmlFiles.length} indexable=${indexableFiles.length} sitemap_urls=${sitemapUrls.length}`);
