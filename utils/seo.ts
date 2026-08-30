// Per-route document metadata.
//
// index.html carries one title, one description and one canonical, which was
// honest while every screen shared a single URL. Now that sections have real
// paths, a page that keeps the homepage's metadata is worse than no metadata:
// it tells a crawler that /vocabulary and /grammar are the same document.
//
// Two rules encoded here:
//
// 1. Only sections a signed-out visitor can actually open are indexable. The
//    rest render the landing page for a crawler (it is not signed in), so
//    letting them be indexed would offer Google a URL that does not show what
//    it claims to. Those get noindex.
// 2. The counts below are real — 94 words across 10 categories, 7 grammar
//    patterns, 12 culture notes, 40 letters — checked against data/koreanData.ts
//    by compiling it, not by grepping it. Keep them that way or drop the number.

import type { Section } from '../types';
import { PUBLIC_SECTIONS } from '../constants';
import { pathForSection } from './routes';

export const SITE_URL = 'https://korean-learn.com';
const SITE_NAME = 'K-Learn Interactive';

const DEFAULT_TITLE = 'K-Learn Interactive - Learn Korean Language Online';
const DEFAULT_DESCRIPTION =
  'Master Korean with our interactive learning platform. Study Hangul, vocabulary, grammar, phrases, and culture with AI-powered conversations, quizzes, and progress tracking.';

interface PageMeta {
  title: string;
  description: string;
}

/** Sections with copy worth showing a search result for. */
export const SECTION_META: Partial<Record<Section, PageMeta>> = {
  vocabulary: {
    title: `Korean Vocabulary — 94 Words by Category | ${SITE_NAME}`,
    description:
      'Learn 94 Korean words across 10 everyday categories, each with romanization, audio and example sentences. Save any word to a spaced-repetition deck.',
  },
  grammar: {
    title: `Korean Grammar Patterns Explained | ${SITE_NAME}`,
    description:
      'Seven core Korean grammar patterns explained in plain English, each with worked examples showing how the pattern changes a sentence.',
  },
  culture: {
    title: `Korean Culture Notes for Learners | ${SITE_NAME}`,
    description:
      'Twelve short notes on Korean culture — etiquette, age and speech levels, and the context behind the language you are learning.',
  },
  hangul: {
    title: `Learn Hangul — the Korean Alphabet | ${SITE_NAME}`,
    description:
      'All 40 Hangul letters with stroke order, pronunciation and practice. Korean is written in an alphabet designed to be learnable in an afternoon.',
  },
  phrases: {
    title: `Essential Korean Phrases | ${SITE_NAME}`,
    description:
      'Common Korean phrases with romanization, audio and the situations they belong in — greetings, politeness, and getting by in conversation.',
  },
  honorifics: {
    title: `Korean Honorifics and Speech Levels | ${SITE_NAME}`,
    description:
      'How Korean speech levels work, and how to choose one: who you are talking to changes the verb ending, not just the vocabulary.',
  },
  topik: {
    title: `TOPIK Test Preparation | ${SITE_NAME}`,
    description:
      'Prepare for TOPIK with levelled practice questions and an assessment that estimates where you currently sit.',
  },
};

export const metaForSection = (section: Section | null): PageMeta =>
  (section && SECTION_META[section]) || { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };

/**
 * A section is indexable only if a signed-out crawler would see the thing the
 * URL promises. cookie-settings is public but has no business in search results.
 */
export const isIndexable = (section: Section | null): boolean =>
  section === null || (PUBLIC_SECTIONS.includes(section) && section !== 'cookie-settings');

export const canonicalFor = (section: Section | null): string =>
  section ? `${SITE_URL}${pathForSection(section)}` : `${SITE_URL}/`;

/**
 * Metadata for the branded 404.
 *
 * Static hosting serves index.html for every URL, so a missing page returns 200
 * and Google decides for itself that it is a "soft 404". Left alone it is worse
 * than that: an unknown path has no section, and the section metadata for "no
 * section" is the landing page's — so every junk URL would carry the homepage's
 * title and a canonical pointing at '/', asking Google to treat them as
 * duplicates of the homepage. noindex, and no canonical claim at all.
 */
export const applyNotFoundMeta = (): void => {
  document.title = `Page not found | ${SITE_NAME}`;
  setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, follow');
  setMeta(
    'meta[name="description"]',
    'name',
    'description',
    'This page does not exist.',
  );
  document.head.querySelector('link[rel="canonical"]')?.remove();
};

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Points the document's metadata at the section currently on screen. */
export const applySectionMeta = (section: Section | null): void => {
  const { title, description } = metaForSection(section);
  const canonical = canonicalFor(section);

  document.title = title;
  setMeta('meta[name="description"]', 'name', 'description', description);
  setMeta('meta[name="title"]', 'name', 'title', title);
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  setMeta('meta[property="twitter:title"]', 'property', 'twitter:title', title);
  setMeta('meta[property="twitter:description"]', 'property', 'twitter:description', description);
  setMeta('meta[property="twitter:url"]', 'property', 'twitter:url', canonical);
  setMeta(
    'meta[name="robots"]',
    'name',
    'robots',
    isIndexable(section) ? 'index, follow' : 'noindex, follow',
  );

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonical;
};
