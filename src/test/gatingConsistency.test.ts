import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// The bug this guards against, in one sentence: gating on subscriptionTier asks
// what the subscription record says, not whether it still grants anything.
//
// A cancelled Stripe subscription keeps type: 'premium' forever — it is history,
// not entitlement. Six components read the tier, so an account whose period had
// ended kept Vocabulary, Culture Cards, Honorifics, TOPIK Prep, Typing and
// Scripted Conversation in full, while the components that read isPremium
// correctly locked. Verified against a real cancelled account: every section
// using the tier stayed open.
//
// useFeatureAccess exposes subscriptionTier for display, so this does not ban
// the value — only comparing it to decide access.

const COMPONENTS = resolve(__dirname, '../../components');

const sources = readdirSync(COMPONENTS)
  .filter(f => f.endsWith('.tsx'))
  .map(f => ({ file: f, text: readFileSync(join(COMPONENTS, f), 'utf8') }));

/** Strips // and /* *​/ comments so prose about the rule is not mistaken for it. */
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('access is decided by access, not by tier', () => {
  it('no component compares subscriptionTier to decide what is unlocked', () => {
    const offenders = sources
      .filter(({ text }) => /subscriptionTier\s*===/.test(stripComments(text)))
      .map(({ file }) => file);

    expect(
      offenders,
      `These compare subscriptionTier instead of using isPremium, so a cancelled ` +
        `account (type stays 'premium') keeps access: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('still allows the tier to be read for display', () => {
    // Guard against over-correcting into a ban on the value itself.
    const hook = readFileSync(resolve(__dirname, '../../hooks/useFeatureAccess.tsx'), 'utf8');
    expect(hook).toContain('subscriptionTier');
  });
});
