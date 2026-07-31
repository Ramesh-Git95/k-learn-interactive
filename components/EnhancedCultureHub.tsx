import React, { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { cultureTips } from '../data/koreanData';
import RegionalExplorer from './RegionalExplorer';
import DailyLife from './DailyLife';
import ModernKorea from './ModernKorea';
import UpgradeModal from './UpgradeModal';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumPeek } from './PremiumLock';
import type { Section } from '../types';
import { accentFor } from '../utils/moduleAccent';

// Culture, one insight at a time.
//
// Mockup 2e draws a long-form article with a photo and a rail. Our insights are
// one or two sentences each — 86 to 157 characters — so the article column is
// deliberately NOT padded out to fill that shape. What is adopted is the reading
// layout: the insight given room to be read properly, with a rail that answers
// "what do I do with this now".
//
// The rail's Korean-word card is real data: five of these tips carry their
// Korean term in the title (눈치, 빨리빨리, 찜질방, 한복), pulled out and made
// speakable rather than left sitting in a bracket.

const ACC = accentFor('culture');
const FREE_TIP_LIMIT = 5;

type Subsection = 'insights' | 'regional' | 'lifestyle' | 'modern';

const SUBSECTIONS: { id: Subsection; title: string; isPremium?: boolean }[] = [
  { id: 'insights',  title: 'Cultural insights' },
  { id: 'regional',  title: 'Regions',    isPremium: true },
  { id: 'lifestyle', title: 'Daily life', isPremium: true },
  { id: 'modern',    title: 'Modern Korea', isPremium: true },
];

const UPGRADE_CONTENT: Record<string, { feature: string; description: string; benefits: string[] }> = {
  regional:  { feature: 'Regional Explorer',    description: "Discover Korea's diverse regions, from bustling Seoul to scenic Jeju Island.", benefits: ['Detailed guides for all Korean regions', 'Local dialect pronunciation guides', 'Regional food & cultural specialties', 'Travel tips and hidden gems'] },
  lifestyle: { feature: 'Daily Life Insights',  description: 'Learn how Koreans really live! Apartments, work-life balance, dating customs.', benefits: ['Korean apartment living culture', 'Work-life balance insights', 'Dating & relationship customs', 'Social etiquette & expectations'] },
  modern:    { feature: 'Modern Korea Trends',  description: 'Explore K-pop, tech innovations, gaming, and beauty trends!', benefits: ['K-pop industry deep-dive', 'Korean gaming & esports', 'Beauty & skincare trends', 'Technology & social movements'] },
};

/** The Korean term a title carries, e.g. "Nunchi (눈치)" → 눈치. */
const koreanIn = (title: string): string | null => {
  const m = title.match(/[가-힣]+/);
  return m ? m[0] : null;
};

/** The title without its bracketed Korean, for the headline. */
const plainTitle = (title: string) => title.replace(/\s*\([^)]*\)\s*/, '').trim();

interface Props {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
  setActiveSection?: (section: Section) => void;
}

const EnhancedCultureHub: React.FC<Props> = ({ progress, toggleProgress, setActiveSection }) => {
  const { subscriptionTier } = useFeatureAccess();
  const [active, setActive] = useState<Subsection>('insights');
  const [picked, setPicked] = useState<number | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; key: string }>({ open: false, key: '' });

  const isFree = subscriptionTier === 'free';
  const isTipRead = (i: number) => !!progress[`culture_tip_${i}`];
  const visibleTips = isFree ? cultureTips.slice(0, FREE_TIP_LIMIT) : cultureTips;
  const lockedCount = cultureTips.length - visibleTips.length;
  const readCount = visibleTips.filter((_, i) => isTipRead(i)).length;

  const handleTabClick = (id: Subsection, isPremium?: boolean) => {
    if (isPremium && isFree) { setUpgradeModal({ open: true, key: id }); return; }
    setActive(id);
  };

  const upgradeData = UPGRADE_CONTENT[upgradeModal.key] || { feature: '', description: '', benefits: [] };

  // Open on the first unread insight — the page starts where the work is.
  const frontier = visibleTips.findIndex((_, i) => !isTipRead(i));
  const index = picked ?? (frontier >= 0 ? frontier : 0);
  const tip = visibleTips[index];

  const say = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const railCard = 'rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-5 py-4 dark:border-gray-800 dark:bg-gray-900';

  const Tabs = (
    <div className="mb-6 flex flex-wrap gap-2">
      {SUBSECTIONS.map(({ id, title, isPremium }) => {
        const locked = isPremium && isFree;
        const on = active === id && !locked;
        return (
          <button
            key={id}
            onClick={() => handleTabClick(id, isPremium)}
            className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold transition-colors ${
              on
                ? 'text-white'
                : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            }`}
            style={on ? { background: ACC.light } : undefined}
          >
            {title}
            {locked && <Lock className="h-3.5 w-3.5" />}
          </button>
        );
      })}
    </div>
  );

  // ── The three Premium subsections keep their existing peek behaviour ──
  if (active !== 'insights') {
    const inner =
      active === 'regional' ? <RegionalExplorer progress={progress} toggleProgress={toggleProgress} />
      : active === 'lifestyle' ? <DailyLife progress={progress} toggleProgress={toggleProgress} />
      : <ModernKorea progress={progress} toggleProgress={toggleProgress} />;
    const peek = {
      regional:  { t: 'Regions — Premium', d: "Korea's regions, from Seoul to Jeju — dialects, food and what each place is known for." },
      lifestyle: { t: 'Daily life — Premium', d: 'How Koreans actually live: apartments, work culture, dating, and everyday etiquette.' },
      modern:    { t: 'Modern Korea — Premium', d: 'K-pop, gaming and esports, beauty, and the technology shaping daily life.' },
    }[active]!;

    return (
      <div className="mx-auto max-w-6xl">
        {Tabs}
        {isFree ? (
          <PremiumPeek title={peek.t} description={peek.d} maxHeight={520} className="kl-card">
            {inner}
          </PremiumPeek>
        ) : inner}
        <UpgradeModal
          isOpen={upgradeModal.open}
          onClose={() => setUpgradeModal({ open: false, key: '' })}
          feature={upgradeData.feature}
          description={upgradeData.description}
          benefits={upgradeData.benefits}
        />
      </div>
    );
  }

  const korean = tip ? koreanIn(tip.title) : null;
  const read = tip ? isTipRead(index) : false;
  // Honest reading time from the real text, not a decorative number.
  const minutes = Math.max(1, Math.round(((tip?.content.split(/\s+/).length ?? 0) + 20) / 130));

  return (
    <div className="mx-auto max-w-6xl">
      {Tabs}

      {tip && (
        <>
          {/* ── Header ── */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] sm:text-[28px] dark:text-white">
              {plainTitle(tip.title)}
            </h1>
            <div className="flex flex-none items-center gap-3.5">
              <span className="text-[13.5px] text-[#4A5566] dark:text-gray-500">
                {minutes} min read · no Korean needed
              </span>
              <button
                onClick={() => toggleProgress(`culture_tip_${index}`)}
                className={`flex h-12 items-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors ${
                  read ? 'text-white' : 'border-[1.5px] border-[rgba(20,32,47,0.22)] text-[#16202F] hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200'
                }`}
                style={read ? { background: ACC.light } : undefined}
              >
                {read ? <><Check className="h-4 w-4" /> Read</> : 'Mark as read'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-5 lg:flex-row">
            {/* ── The insight ── */}
            <div className="order-1 w-full min-w-0 flex-1 lg:order-2">
              <div className="kl-card p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
                  {/* The tip's own emoji as an illustrated panel. We ship no
                      photography, and a stock photo would be invented context —
                      this is drawn from the data and costs nothing to load. */}
                  <div
                    className="flex h-[132px] w-full flex-none items-center justify-center rounded-[14px] sm:h-[132px] sm:w-[132px]"
                    style={{
                      border: `1px solid ${ACC.light}3D`,
                      background: `repeating-linear-gradient(135deg, ${ACC.light}1A 0 9px, ${ACC.light}0A 9px 18px)`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="text-[54px] leading-none drop-shadow-sm">{tip.icon}</span>
                  </div>

                  <div className="max-w-[64ch] min-w-0 flex-1">
                    <div className="mb-4 text-[13px] font-semibold" style={{ color: ACC.light }}>
                      WHAT TO KNOW
                    </div>
                    <p className="font-display text-[22px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#16202F] sm:text-[26px] dark:text-white">
                      {tip.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rail cards sit under the article on mobile */}
              <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:hidden">
                {korean && (
                  <div className={railCard}>
                    <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">The Korean word</div>
                    <div className="font-korean text-[24px] font-bold text-[#16202F] dark:text-white">{korean}</div>
                    <button
                      onClick={() => say(korean)}
                      className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] dark:border-gray-700 dark:text-gray-200"
                    >
                      <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
                        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
                        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                        <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                      </span>
                      Hear it
                    </button>
                  </div>
                )}
                {setActiveSection && (
                  <div className={railCard}>
                    <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Check yourself</div>
                    <p className="mb-3 text-[14px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                      Culture cards turn these customs into quick questions.
                    </p>
                    <button
                      onClick={() => setActiveSection('culture-cards')}
                      className="flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-white"
                      style={{ background: ACC.light }}
                    >
                      Open the cards →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Rail (desktop) ── */}
            <div className="order-2 hidden w-full flex-none lg:order-3 lg:block lg:w-[290px]">
              {korean && (
                <div className={`${railCard} mb-3.5`}>
                  <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">The Korean word</div>
                  <div className="font-korean text-[26px] font-bold text-[#16202F] dark:text-white">{korean}</div>
                  <p className="mt-1.5 text-[14px] text-[#3E4A5A] dark:text-gray-400">
                    The word behind this custom — worth knowing by name.
                  </p>
                  <button
                    onClick={() => say(korean)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-[9px] border border-[rgba(20,32,47,0.2)] text-[13.5px] font-semibold text-[#16202F] transition-colors hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200"
                  >
                    <span className="flex h-3 items-end gap-[2.5px]" aria-hidden="true">
                      <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light }} />
                      <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.15s' }} />
                      <span className="kl-bar w-[3px]" style={{ height: '100%', background: ACC.light, animationDelay: '0.3s' }} />
                    </span>
                    Hear it
                  </button>
                </div>
              )}

              {setActiveSection && (
                <>
                  <div className={`${railCard} mb-3.5`}>
                    <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Check yourself</div>
                    <p className="mb-3 text-[14px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
                      Culture cards turn these customs into quick questions.
                    </p>
                    <button
                      onClick={() => setActiveSection('culture-cards')}
                      className="flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
                      style={{ background: ACC.light, boxShadow: `0 5px 16px ${ACC.light}4D` }}
                    >
                      Open the cards →
                    </button>
                  </div>

                  <div className={railCard}>
                    <div className="mb-2.5 text-[13.5px] font-semibold text-[#16202F] dark:text-white">Related</div>
                    <div className="flex flex-col gap-2">
                      {([
                        ['honorifics', 'Honorifics — who you speak to'],
                        ['phrases', 'Phrases you would actually say'],
                      ] as [Section, string][]).map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setActiveSection(id)}
                          className="text-left text-[14px] font-medium text-[#16202F] transition-colors hover:text-[#8E3B54] dark:text-gray-200 dark:hover:text-[#D88AA5]"
                        >
                          {label} →
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── All insights ── */}
            <div className="order-3 w-full flex-none lg:order-1 lg:w-[250px]">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#4A5566] dark:text-gray-400">ALL INSIGHTS</span>
                <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">{readCount}/{visibleTips.length}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {visibleTips.map((t, i) => {
                  const on = i === index;
                  const done = isTipRead(i);
                  return (
                    <button
                      key={t.title}
                      onClick={() => setPicked(i)}
                      className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                        on ? '' : 'hover:bg-[rgba(20,32,47,0.04)] dark:hover:bg-white/5'
                      }`}
                      style={on ? { background: `${ACC.light}1A`, borderLeft: `3px solid ${ACC.light}`, paddingLeft: 9 } : undefined}
                    >
                      <span className="flex-none text-[16px]" aria-hidden="true">{t.icon}</span>
                      <span className={`min-w-0 flex-1 truncate text-[14px] ${
                        on ? 'font-semibold text-[#16202F] dark:text-white'
                        : done ? 'font-medium text-[#16202F]/60 dark:text-gray-500'
                        : 'font-medium text-[#16202F] dark:text-gray-200'
                      }`}>
                        {plainTitle(t.title)}
                      </span>
                      {done && <Check className="h-3.5 w-3.5 flex-none" style={{ color: ACC.light }} />}
                    </button>
                  );
                })}
              </div>

              {lockedCount > 0 && (
                <button
                  onClick={() => setUpgradeModal({ open: true, key: 'regional' })}
                  className="kl-premium mt-3.5 flex w-full items-center gap-3 rounded-xl p-3 text-left"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-white"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    <Lock className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[#16202F] dark:text-white">
                      {lockedCount} more {lockedCount === 1 ? 'insight' : 'insights'}
                    </span>
                    <span className="block text-[12px] text-[#4A5566] dark:text-gray-400">
                      Unlock with Premium · $4/mo
                    </span>
                  </span>
                  <span className="flex-none text-[13px] font-semibold text-[#C13F22] dark:text-[#F07A55]">→</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, key: '' })}
        feature={upgradeData.feature}
        description={upgradeData.description}
        benefits={upgradeData.benefits}
      />
    </div>
  );
};

export default EnhancedCultureHub;
