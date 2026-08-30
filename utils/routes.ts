// URL <-> Section mapping.
//
// Navigation used to run on the location hash, which meant every screen in the
// app shared one URL as far as a crawler was concerned: korean-learn.com/ with
// a fragment the server never sees. Only the homepage could be indexed, and the
// sitemap had a single entry to match.
//
// Sections now live at real paths (/vocabulary), served by the SPA fallback
// already in public/.htaccess. The internal API is unchanged — everything still
// calls setActiveSection(section) — so this file is the only place that knows
// what a section looks like in an address bar.
//
// `satisfies Record<Section, string>` is load-bearing: add a section to the
// Section union without giving it a path here and this fails to compile, rather
// than shipping a section whose URL silently falls back to the dashboard.

import type { Section } from '../types';

const SECTION_PATHS = {
  dashboard: 'dashboard',
  hangul: 'hangul',
  vocabulary: 'vocabulary',
  grammar: 'grammar',
  phrases: 'phrases',
  culture: 'culture',
  quiz: 'quiz',
  conversation: 'conversation',
  bookmarks: 'bookmarks',
  srs: 'srs',
  profile: 'profile',
  'cookie-settings': 'cookie-settings',
  topik: 'topik',
  'topik-test': 'topik-test',
  honorifics: 'honorifics',
  'culture-cards': 'culture-cards',
  typing: 'typing',
  writing: 'writing',
  kdrama: 'kdrama',
  kpop: 'kpop',
  reading: 'reading',
} satisfies Record<Section, string>;

export const ALL_SECTIONS = Object.keys(SECTION_PATHS) as Section[];

/** The address-bar path for a section, e.g. 'vocabulary' -> '/vocabulary'. */
export const pathForSection = (section: Section): string => `/${SECTION_PATHS[section]}`;

/**
 * The section a path refers to, or null for the landing page / an unknown path.
 * Unknown paths return null rather than throwing: .htaccess serves index.html
 * for anything that is not a file, so this receives every 404 the site gets.
 */
export const sectionFromPath = (pathname: string): Section | null => {
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!slug) return null;
  const found = (Object.entries(SECTION_PATHS) as [Section, string][]).find(([, p]) => p === slug);
  return found ? found[0] : null;
};

/**
 * Paths the app serves that are not sections: the root, and the standalone
 * routes App.tsx checks before it renders the shell.
 */
const SPECIAL_PATHS = ['/', '/index.html', '/terms', '/privacy', '/reset-password'];

/**
 * Whether the app has something to show at this path. The SPA fallback serves
 * index.html for every URL, so this is what decides between a real page and the
 * branded 404 — get it wrong and either a valid screen 404s or a typo renders
 * the app.
 */
export const isKnownPath = (pathname: string): boolean => {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return (
    sectionFromPath(normalized) !== null ||
    SPECIAL_PATHS.includes(normalized) ||
    normalized.startsWith('/verify-email')
  );
};

/**
 * Legacy '#vocabulary' links — bookmarks, and anything shared while the app was
 * hash-routed — map to the equivalent path so they keep working.
 */
export const sectionFromLegacyHash = (hash: string): Section | null => {
  const slug = hash.replace(/^#/, '');
  return slug ? sectionFromPath(slug) : null;
};
