import React, { useState } from 'react';
import { koreanRegions } from '../data/koreanData';
import type { KoreanRegion } from '../types';
import Icon from './Icon';

interface RegionalExplorerProps {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const RegionalExplorer: React.FC<RegionalExplorerProps> = ({ progress, toggleProgress }) => {
  const [selectedRegion, setSelectedRegion] = useState<KoreanRegion | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attractions' | 'food' | 'culture' | 'language' | 'travel'>('overview');

  const isRegionExplored = (regionId: string) => {
    return progress[`region_${regionId}`] || false;
  };

  const handleRegionExplored = (regionId: string) => {
    toggleProgress(`region_${regionId}`);
  };

  const exploredCount = koreanRegions.filter(region => isRegionExplored(region.id)).length;

  const TabButton = ({ tabId, label, icon }: { tabId: typeof activeTab, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
        activeTab === tabId
          ? 'bg-[#8E3B54] text-white'
          : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-[#8E3B54] dark:text-[#D88AA5] mb-3 sm:mb-0">
          🗺️ Korea Regional Explorer
        </h1>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="kl-card px-3 sm:px-4 py-2">
            <span className="text-xs sm:text-sm text-[#4A5566] dark:text-gray-400">Explored: </span>
            <span className="font-semibold text-[#8E3B54] dark:text-[#D88AA5] text-sm sm:text-base">
              {exploredCount}/{koreanRegions.length}
            </span>
          </div>
          <div className="w-16 sm:w-20 lg:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-[#8E3B54] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(exploredCount / koreanRegions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 text-[#4A5566] dark:text-gray-400">
        Discover Korea's diverse regions! Click on any region to explore its culture, food, attractions, and unique characteristics. Each region has its own story to tell! 🇰🇷
      </p>

      {!selectedRegion ? (
        <>
          {/* ── The map ──
              This was a hotlinked Unsplash photograph captioned "real satellite
              map of South Korea" — it was neither a map nor of Korea, so it read
              as a black rectangle with dots floating on it, and it fetched from a
              third party on every load. It is now a drawn schematic: the outline
              is ours, the region positions are the ones already in the data, and
              nothing leaves the app. */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[22px] dark:text-white">
                Where the regions are
              </h2>
              <span className="text-[13px] text-[#4A5566] dark:text-gray-500">
                Schematic — tap a region to open it
              </span>
            </div>

            <div className="kl-card p-4 sm:p-6">
              <div className="relative mx-auto w-full max-w-[420px]">
                <svg viewBox="0 0 100 100" className="w-full" role="img" aria-label="Schematic map of South Korea">
                  {/* Sea */}
                  <rect x="0" y="0" width="100" height="100" rx="4" className="fill-[rgba(47,93,138,0.06)] dark:fill-white/[0.03]" />

                  {/* Mainland */}
                  <path
                    d="M30 20 C34 14, 46 10, 58 10 C66 10, 72 12, 74 18
                       C78 24, 79 32, 78 40 C77 48, 74 56, 71 63
                       C69 68, 67 72, 63 73 C57 75, 50 74, 44 72
                       C38 70, 32 70, 27 66 C23 62, 22 56, 24 51
                       C26 47, 30 45, 28 41 C26 37, 22 34, 24 29
                       C26 24, 28 22, 30 20 Z"
                    className="fill-[#F0EADC] stroke-[rgba(20,32,47,0.22)] dark:fill-gray-800 dark:stroke-white/20"
                    strokeWidth="0.6"
                  />
                  {/* Jeju */}
                  <ellipse
                    cx="42" cy="85" rx="6.5" ry="3.4"
                    className="fill-[#F0EADC] stroke-[rgba(20,32,47,0.22)] dark:fill-gray-800 dark:stroke-white/20"
                    strokeWidth="0.6"
                  />
                </svg>

                {/* Region markers, placed from the coordinates already in the data */}
                {koreanRegions.map(region => {
                  const explored = isRegionExplored(region.id);
                  return (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region)}
                      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${region.coordinates.x}%`, top: `${region.coordinates.y}%` }}
                      title={`${region.name} — ${region.nameKorean}`}
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-125 sm:h-6 sm:w-6"
                          style={{ backgroundColor: region.color }}
                        >
                          {explored && <Icon icon="check" className="h-3 w-3 text-white" />}
                        </span>
                        <span className="whitespace-nowrap rounded px-1.5 text-[10px] font-semibold text-[#16202F] sm:text-[11px] dark:text-white"
                              style={{ background: 'rgba(255,252,244,0.82)' }}>
                          {region.name.split(' & ')[0]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-[12.5px] text-[#4A5566] dark:text-gray-500">
                A simplified outline, not a survey map — it shows how the six regions sit relative to each other.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {koreanRegions.map((region) => {
              const isExplored = isRegionExplored(region.id);
              
              return (
                <div
                  key={region.id}
                  className={`kl-card p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                    isExplored
                      ? 'ring-2 ring-[#8E3B54] bg-[#8E3B54]/[0.06]'
                      : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
                  onClick={() => setSelectedRegion(region)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#16202F] dark:text-white mb-1">
                        {region.name}
                      </h3>
                      <p className="text-sm font-korean text-[#4A5566] dark:text-gray-400">
                        {region.nameKorean}
                      </p>
                    </div>
                    <div
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: region.color }}
                    />
                  </div>
                  
                  <p className="text-sm text-[#4A5566] dark:text-gray-400 mb-4 line-clamp-2">
                    {region.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#4A5566] dark:text-gray-500">
                      Population: {region.population}
                    </span>
                    {isExplored && (
                      <div className="flex items-center space-x-1 text-[#8E3B54] dark:text-[#D88AA5]">
                        <Icon icon="check" className="w-4 h-4" />
                        <span className="text-xs font-medium">Explored</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Region Detail View */
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedRegion(null)}
              className="flex items-center space-x-2 text-[#8E3B54] dark:text-[#D88AA5] hover:underline"
            >
              <span>←</span>
              <span>Back to Map</span>
            </button>
            <button
              onClick={() => handleRegionExplored(selectedRegion.id)}
              className={`flex h-11 items-center gap-2 px-4 rounded-[10px] text-[14px] font-semibold transition-colors ${
                isRegionExplored(selectedRegion.id)
                  ? 'bg-[#8E3B54] text-white'
                  : 'bg-[#8E3B54] text-white hover:bg-[#7A3248]'
              }`}
            >
              <Icon icon={isRegionExplored(selectedRegion.id) ? 'check' : 'plus'} className="w-4 h-4" />
              <span>{isRegionExplored(selectedRegion.id) ? 'Explored' : 'Mark as Explored'}</span>
            </button>
          </div>

          {/* Region Header */}
          <div className="kl-card p-4 sm:p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-display text-[24px] sm:text-[26px] font-semibold tracking-[-0.03em] text-[#16202F] dark:text-white mb-2">
                  {selectedRegion.name}
                </h1>
                <p className="text-lg font-korean text-[#4A5566] dark:text-gray-400 mb-2">
                  {selectedRegion.nameKorean}
                </p>
                <p className="text-[#4A5566] dark:text-gray-400">
                  {selectedRegion.description}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-full border-4 border-white shadow-lg flex-shrink-0"
                style={{ backgroundColor: selectedRegion.color }}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-[#4A5566] dark:text-gray-500">Population</p>
                <p className="font-semibold text-[#16202F] dark:text-white">{selectedRegion.population}</p>
              </div>
              <div>
                <p className="text-sm text-[#4A5566] dark:text-gray-500">Best Time</p>
                <p className="font-semibold text-[#16202F] dark:text-white text-xs sm:text-sm">{selectedRegion.bestTimeToVisit}</p>
              </div>
              <div>
                <p className="text-sm text-[#4A5566] dark:text-gray-500">Climate</p>
                <p className="font-semibold text-[#16202F] dark:text-white text-xs sm:text-sm">{selectedRegion.climate}</p>
              </div>
              <div>
                <p className="text-sm text-[#4A5566] dark:text-gray-500">Features</p>
                <p className="font-semibold text-[#16202F] dark:text-white text-xs sm:text-sm">{selectedRegion.keyFeatures.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-5">
            <TabButton tabId="overview" label="Overview" icon="🏠" />
            <TabButton tabId="attractions" label="Attractions" icon="🏛️" />
            <TabButton tabId="food" label="Food" icon="🍜" />
            <TabButton tabId="culture" label="Culture" icon="🎭" />
            <TabButton tabId="language" label="Language" icon="💬" />
            <TabButton tabId="travel" label="Travel Tips" icon="✈️" />
          </div>

          {/* Tab Content */}
          <div className="kl-card p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRegion.keyFeatures.map((feature, index) => (
                    <div key={index} className="kl-well flex items-center gap-3 p-3.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-[#8E3B54]" />
                      <span className="text-[#3E4A5A] dark:text-gray-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attractions' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Must-Visit Attractions</h3>
                <div className="space-y-4">
                  {selectedRegion.attractions.map((attraction, index) => (
                    <div key={index} className="border-l-4 border-[#8E3B54] pl-4 py-2">
                      <h4 className="font-semibold text-[#16202F] dark:text-white">{attraction.name}</h4>
                      <p className="text-sm font-korean text-[#4A5566] dark:text-gray-400">{attraction.nameKorean}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-[#8E3B54]/10 text-[#8E3B54] dark:bg-[#8E3B54]/25 dark:text-[#D88AA5] text-xs rounded-full">
                        {attraction.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'food' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Regional Specialties</h3>
                <div className="space-y-4">
                  {selectedRegion.specialFoods.map((food, index) => (
                    <div key={index} className="kl-well p-4 rounded-xl">
                      <h4 className="font-semibold text-[#16202F] dark:text-white">{food.name}</h4>
                      <p className="text-sm font-korean text-[#4A5566] dark:text-gray-400 mb-2">{food.nameKorean}</p>
                      <p className="text-[#3E4A5A] dark:text-gray-200">{food.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'culture' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Cultural Notes</h3>
                <div className="space-y-3">
                  {selectedRegion.culturalNotes.map((note, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-[#8E3B54] mt-2 flex-shrink-0" />
                      <p className="text-[#3E4A5A] dark:text-gray-200">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Language & Dialect</h3>
                <div className="space-y-3">
                  {selectedRegion.languageNotes.map((note, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-[#8E3B54] mt-2 flex-shrink-0" />
                      <p className="text-[#3E4A5A] dark:text-gray-200">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'travel' && (
              <div>
                <h3 className="text-[16px] font-semibold mb-4 text-[#16202F] dark:text-white">Travel Tips</h3>
                <div className="space-y-3">
                  {selectedRegion.travelTips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">💡</span>
                      <p className="text-[#3E4A5A] dark:text-gray-200">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalExplorer;
