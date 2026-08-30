import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { applySectionMeta, applyNotFoundMeta, isIndexable, canonicalFor, SITE_URL } from '../../utils/seo';
import { ALL_SECTIONS, pathForSection } from '../../utils/routes';
import { PUBLIC_SECTIONS } from '../../constants';
import type { Section } from '../../types';

const sitemapUrls = (): string[] => {
  const xml = readFileSync(resolve(__dirname, '../../public/sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
};

describe('what we ask search engines to index', () => {
  // The failure this guards against is submitting a URL that shows a crawler
  // something other than what it promises. Every gated section renders the
  // landing page when signed out, so it must not be indexed or listed.
  it('only marks sections a signed-out visitor can open as indexable', () => {
    for (const section of ALL_SECTIONS) {
      if (isIndexable(section)) {
        expect(PUBLIC_SECTIONS, `${section} is indexable but not public`).toContain(section);
      }
    }
  });

  it('never indexes the cookie settings page', () => {
    // Public, but it is a preferences screen — nothing to rank for.
    expect(isIndexable('cookie-settings')).toBe(false);
  });

  it('indexes the landing page', () => {
    expect(isIndexable(null)).toBe(true);
  });

  it('lists exactly the indexable URLs in the sitemap', () => {
    const expected = [
      `${SITE_URL}/`,
      ...ALL_SECTIONS.filter(isIndexable).map(s => `${SITE_URL}${pathForSection(s)}`),
    ];
    expect(sitemapUrls().sort()).toEqual(expected.sort());
  });
});

describe('applySectionMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
  const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const description = () =>
    document.head.querySelector('meta[name="description"]')?.getAttribute('content');

  it('gives a public section its own canonical and title', () => {
    applySectionMeta('vocabulary');
    expect(canonical()).toBe(`${SITE_URL}/vocabulary`);
    expect(document.title).toContain('Vocabulary');
    expect(robots()).toBe('index, follow');
  });

  it('marks a gated section noindex', () => {
    applySectionMeta('quiz');
    expect(robots()).toBe('noindex, follow');
  });

  it('restores the homepage metadata for the landing page', () => {
    applySectionMeta('vocabulary');
    applySectionMeta(null);
    expect(canonical()).toBe(`${SITE_URL}/`);
    expect(robots()).toBe('index, follow');
    expect(document.title).toBe('K-Learn Interactive - Learn Korean Language Online');
  });

  it('updates existing tags rather than appending duplicates', () => {
    applySectionMeta('vocabulary');
    applySectionMeta('grammar');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(canonicalFor('grammar')).toBe(canonical());
  });

  it('falls back to the default description for a section with no copy', () => {
    applySectionMeta('typing' as Section);
    expect(description()).toContain('Master Korean');
  });
});

describe('the 404 page', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  // Static hosting returns 200 for a missing page, so the only signal available
  // is the metadata. Inheriting the landing page's — which is what "no section"
  // means everywhere else — would point a canonical at '/' from every junk URL.
  it('is noindex', () => {
    applyNotFoundMeta();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, follow',
    );
  });

  it('claims no canonical, and drops one left by a previous section', () => {
    applySectionMeta('vocabulary');
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull();
    applyNotFoundMeta();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('does not present itself as the homepage', () => {
    applyNotFoundMeta();
    expect(document.title).not.toBe('K-Learn Interactive - Learn Korean Language Online');
    expect(document.title).toContain('not found');
  });
});
