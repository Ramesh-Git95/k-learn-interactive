import React, { useState } from 'react';
import { cultureTips } from '../data/koreanData';
import RegionalExplorer from './RegionalExplorer';
import DailyLife from './DailyLife';
import ModernKorea from './ModernKorea';
import UpgradeModal from './UpgradeModal';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PremiumPeek, LockedRowBanner } from './PremiumLock';

interface EnhancedCultureHubProps {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

type Subsection = 'insights' | 'regional' | 'lifestyle' | 'modern';

const SUBSECTIONS: { id: Subsection; title: string; icon: string; description: string; isPremium?: boolean; gradient: string }[] = [
  { id: 'insights',  title: 'Cultural Insights', icon: '🎭', description: 'Essential Korean customs & social norms',        gradient: 'var(--brand-gradient)' },
  { id: 'regional',  title: 'Regional Explorer', icon: '🗺️', description: 'Discover Korea\'s diverse regions',              gradient: 'linear-gradient(135deg, #2F5D8A, #24476B)', isPremium: true },
  { id: 'lifestyle', title: 'Daily Life',         icon: '🏠', description: 'How Koreans live, work & socialize',             gradient: 'linear-gradient(135deg, #10B981, #2F5D8A)', isPremium: true },
  { id: 'modern',    title: 'Modern Korea',       icon: '🌆', description: 'K-pop, tech & contemporary trends',              gradient: 'linear-gradient(135deg, #F59E0B, #E4572E)', isPremium: true },
];

const UPGRADE_CONTENT: Record<string, { feature: string; description: string; benefits: string[] }> = {
  regional:  { feature: 'Regional Explorer',    description: "Discover Korea's diverse regions, from bustling Seoul to scenic Jeju Island.", benefits: ['Detailed guides for all Korean regions', 'Local dialect pronunciation guides', 'Regional food & cultural specialties', 'Travel tips and hidden gems'] },
  lifestyle: { feature: 'Daily Life Insights',  description: 'Learn how Koreans really live! Apartments, work-life balance, dating customs.', benefits: ['Korean apartment living culture', 'Work-life balance insights', 'Dating & relationship customs', 'Social etiquette & expectations'] },
  modern:    { feature: 'Modern Korea Trends',  description: 'Explore K-pop, tech innovations, gaming, and beauty trends!', benefits: ['K-pop industry deep-dive', 'Korean gaming & esports', 'Beauty & skincare trends', 'Technology & social movements'] },
};

const FREE_TIP_LIMIT = 5;

const EnhancedCultureHub: React.FC<EnhancedCultureHubProps> = ({ progress, toggleProgress }) => {
  const { subscriptionTier } = useFeatureAccess();
  const [active, setActive] = useState<Subsection>('insights');
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; key: string }>({ open: false, key: '' });

  const isTipRead = (i: number) => !!progress[`culture_tip_${i}`];
  const visibleTips = subscriptionTier === 'free' ? cultureTips.slice(0, FREE_TIP_LIMIT) : cultureTips;
  const readCount = visibleTips.filter((_, i) => isTipRead(i)).length;
  const overallPct = visibleTips.length > 0 ? Math.round((readCount / visibleTips.length) * 100) : 0;

  const handleTabClick = (id: Subsection, isPremium?: boolean) => {
    if (isPremium && subscriptionTier === 'free') {
      setUpgradeModal({ open: true, key: id });
      return;
    }
    setActive(id);
  };

  const upgradeData = UPGRADE_CONTENT[upgradeModal.key] || { feature: '', description: '', benefits: [] };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #E4572E 40%, #3F8571 80%, #2F5D8A 100%)' }}
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['🇰🇷','한복','태권도','김치','K-pop'].map((w, i) => (
            <span key={i} className="absolute text-white/10 font-black" style={{ fontSize: `${1.5 + (i % 3) * 0.5}rem`, top: `${(i * 33) % 85}%`, left: `${(i * 47) % 80}%` }}>{w}</span>
          ))}
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🎭</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Korean Culture Hub</h1>
                <p className="text-yellow-100 text-sm">한국 문화 · {cultureTips.length} cultural insights</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              Dive into Korean customs, regional life, modern trends, and everyday culture. Understanding culture is the key to truly connecting with Korea!
            </p>
          </div>
          {active === 'insights' && (
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-3xl font-black text-white">{readCount}/{visibleTips.length}</div>
              <div className="text-xs text-white/70 mb-2">tips read</div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subsection tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {SUBSECTIONS.map(({ id, title, icon, description, isPremium, gradient }) => {
          const isLocked = isPremium && subscriptionTier === 'free';
          const isActive = active === id && !isLocked;
          return (
            <button
              key={id}
              onClick={() => handleTabClick(id, isPremium)}
              className={`relative p-4 rounded-2xl text-left transition-all duration-200 border ${
                isActive
                  ? 'text-white shadow-lg scale-[1.02] border-transparent'
                  : isLocked
                  ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-80 hover:opacity-100'
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-md hover:-translate-y-0.5'
              }`}
              style={isActive ? { background: gradient } : {}}
            >
              {isLocked && (
                <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  🔒
                </span>
              )}
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className={`text-sm font-black mb-1 ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
              <p className={`text-[11px] leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div>
        {active === 'insights' && (() => {
          const lockedCount = cultureTips.length - visibleTips.length;
          return (
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-5">Essential Cultural Insights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                {visibleTips.map((tip, i) => {
                  const read = isTipRead(i);
                  return (
                    <div
                      key={tip.title}
                      className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm flex flex-col items-center text-center p-5 transition-all duration-300 ${
                        read
                          ? 'border-green-300 dark:border-green-700 ring-1 ring-green-300 dark:ring-green-700 hover:shadow-md'
                          : 'border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-lg'
                      }`}
                    >
                      <div className="relative mb-3">
                        <div className="text-4xl">{tip.icon}</div>
                        {read && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-[10px] font-black">✓</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">{tip.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1 leading-relaxed">{tip.content}</p>
                      <button
                        onClick={() => toggleProgress(`culture_tip_${i}`)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                          read ? 'bg-green-500 text-white' : 'text-white'
                        }`}
                        style={!read ? { background: 'var(--brand-gradient)' } : {}}
                      >
                        {read ? '✓ Read' : '📌 Mark as Read'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {lockedCount > 0 && (
                <LockedRowBanner count={lockedCount} label="cultural insights" />
              )}
            </div>
          );
        })()}

        {active === 'regional' && (
          subscriptionTier === 'free' ? (
            <PremiumPeek
              title="🗺️ Regional Explorer — Premium"
              description="Discover Korea's diverse regions — Seoul, Busan, Jeju and more. Everything you see here unlocks with Premium."
              maxHeight={520}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <RegionalExplorer progress={progress} toggleProgress={toggleProgress} />
            </PremiumPeek>
          ) : (
            <RegionalExplorer progress={progress} toggleProgress={toggleProgress} />
          )
        )}

        {active === 'lifestyle' && (
          subscriptionTier === 'free' ? (
            <PremiumPeek
              title="🏠 Daily Life Insights — Premium"
              description="How Koreans really live — apartments, work culture, social customs, and everyday etiquette."
              maxHeight={520}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <DailyLife progress={progress} toggleProgress={toggleProgress} />
            </PremiumPeek>
          ) : (
            <DailyLife progress={progress} toggleProgress={toggleProgress} />
          )
        )}

        {active === 'modern' && (
          subscriptionTier === 'free' ? (
            <PremiumPeek
              title="🌆 Modern Korea — Premium"
              description="K-pop industry, gaming & esports, beauty trends, and Korea's tech innovations — all in one place."
              maxHeight={520}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <ModernKorea progress={progress} toggleProgress={toggleProgress} />
            </PremiumPeek>
          ) : (
            <ModernKorea progress={progress} toggleProgress={toggleProgress} />
          )
        )}
      </div>

      {/* Upgrade modal */}
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
