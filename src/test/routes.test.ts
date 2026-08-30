import { describe, it, expect } from 'vitest';
import {
  ALL_SECTIONS,
  pathForSection,
  sectionFromPath,
  sectionFromLegacyHash,
  isKnownPath,
} from '../../utils/routes';

// Routing moved off the location hash onto real paths so that sections could be
// indexed at all. The risk in that swap is a section whose URL does not round
// trip — it would load the landing page instead of itself, which is exactly the
// bug a crawler would record.

describe('section <-> path', () => {
  it('round trips every section', () => {
    for (const section of ALL_SECTIONS) {
      expect(sectionFromPath(pathForSection(section))).toBe(section);
    }
  });

  it('covers every section in the union', () => {
    // 21 sections as of this change; the `satisfies` in routes.ts is what
    // actually enforces completeness, this just catches an accidental deletion.
    expect(ALL_SECTIONS.length).toBe(21);
    expect(new Set(ALL_SECTIONS).size).toBe(ALL_SECTIONS.length);
  });

  it('treats the site root as the landing page', () => {
    expect(sectionFromPath('/')).toBeNull();
    expect(sectionFromPath('')).toBeNull();
  });

  it('tolerates trailing and repeated slashes', () => {
    expect(sectionFromPath('/vocabulary/')).toBe('vocabulary');
    expect(sectionFromPath('vocabulary')).toBe('vocabulary');
    expect(sectionFromPath('//vocabulary//')).toBe('vocabulary');
  });

  it('returns null for unknown paths rather than throwing', () => {
    // .htaccess serves index.html for anything that is not a file, so every
    // typo'd URL on the site arrives here.
    expect(sectionFromPath('/not-a-section')).toBeNull();
    expect(sectionFromPath('/vocabulary/extra')).toBeNull();
  });

  it('keeps hyphenated sections intact', () => {
    expect(pathForSection('cookie-settings')).toBe('/cookie-settings');
    expect(sectionFromPath('/topik-test')).toBe('topik-test');
    expect(sectionFromPath('/culture-cards')).toBe('culture-cards');
  });
});

describe('isKnownPath — what is a 404 and what is not', () => {
  // The bug this exists for: the 404 check allowed only '/' , which was correct
  // while navigation lived in the hash and pathname was always '/'. The moment
  // sections became real paths, clicking Vocabulary rendered the branded 404 —
  // and "Take me home" bounced to /dashboard, which 404'd for the same reason.
  it('accepts every section path', () => {
    for (const section of ALL_SECTIONS) {
      expect(isKnownPath(pathForSection(section)), `${section} must not 404`).toBe(true);
    }
  });

  it('accepts the root and the standalone routes', () => {
    for (const p of ['/', '/index.html', '/terms', '/privacy', '/reset-password']) {
      expect(isKnownPath(p), `${p} must not 404`).toBe(true);
    }
  });

  it('accepts verify-email with its token suffix', () => {
    expect(isKnownPath('/verify-email')).toBe(true);
    expect(isKnownPath('/verify-email/abc123')).toBe(true);
  });

  it('tolerates a trailing slash', () => {
    expect(isKnownPath('/vocabulary/')).toBe(true);
    expect(isKnownPath('/terms/')).toBe(true);
  });

  it('still 404s genuinely unknown paths', () => {
    for (const p of ['/nope', '/vocabulary/extra', '/wp-admin', '/dashboardd']) {
      expect(isKnownPath(p), `${p} should 404`).toBe(false);
    }
  });
});

describe('legacy hash links', () => {
  it('maps an old #section bookmark to its section', () => {
    expect(sectionFromLegacyHash('#vocabulary')).toBe('vocabulary');
    expect(sectionFromLegacyHash('#topik-test')).toBe('topik-test');
  });

  it('ignores in-page anchors that are not sections', () => {
    // The landing page links to #pricing, and App renders a #main-content skip
    // link. Neither should be mistaken for a route.
    expect(sectionFromLegacyHash('#pricing')).toBeNull();
    expect(sectionFromLegacyHash('#main-content')).toBeNull();
    expect(sectionFromLegacyHash('')).toBeNull();
  });

  it('ignores the #null that the old hash writer could produce', () => {
    expect(sectionFromLegacyHash('#null')).toBeNull();
  });
});
