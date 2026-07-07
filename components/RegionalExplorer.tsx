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
      className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 ${
        activeTab === tabId
          ? 'bg-pink-500 text-white dark:bg-pink-500'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
      }`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-500 dark:text-pink-400 mb-3 sm:mb-0">
          🗺️ Korea Regional Explorer
        </h1>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg px-3 sm:px-4 py-2 shadow-sm">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Explored: </span>
            <span className="font-semibold text-pink-500 dark:text-pink-400 text-sm sm:text-base">
              {exploredCount}/{koreanRegions.length}
            </span>
          </div>
          <div className="w-16 sm:w-20 lg:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-pink-500 dark:bg-pink-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(exploredCount / koreanRegions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10 text-gray-600 dark:text-gray-400">
        Discover Korea's diverse regions! Click on any region to explore its culture, food, attractions, and unique characteristics. Each region has its own story to tell! 🇰🇷
      </p>

      {!selectedRegion ? (
        <>
          {/* Interactive Map */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
              📡 Satellite Map of South Korea
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div className="relative w-full aspect-[3/4] max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-inner">
                {/* Real Korea Satellite Map Background */}
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url("https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")`
                  }}
                >
                  {/* Enhanced overlay for better contrast and readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
                  <div className="absolute inset-0 bg-blue-900/10"></div>
                </div>
                
                {/* Region markers with enhanced styling */}
                {koreanRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full border-4 border-white shadow-2xl transition-all duration-300 hover:scale-125 hover:shadow-2xl group z-10 ${
                      isRegionExplored(region.id)
                        ? 'bg-green-500 hover:bg-green-600 ring-4 ring-green-300/60'
                        : 'hover:ring-4 hover:ring-white/60'
                    }`}
                    style={{
                      left: `${region.coordinates.x}%`,
                      top: `${region.coordinates.y}%`,
                      backgroundColor: isRegionExplored(region.id) ? undefined : region.color,
                      boxShadow: isRegionExplored(region.id) 
                        ? '0 0 0 6px rgba(34, 197, 94, 0.25), 0 12px 24px rgba(0, 0, 0, 0.3)' 
                        : `0 0 0 3px ${region.color}44, 0 12px 24px rgba(0, 0, 0, 0.2)`
                    }}
                    title={region.name}
                  >
                    {isRegionExplored(region.id) && (
                      <Icon icon="check" className="w-4 h-4 sm:w-5 sm:h-5 text-white m-auto" />
                    )}
                    
                    {/* Enhanced Tooltip with better positioning */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30">
                      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 whitespace-nowrap max-w-56 backdrop-blur-sm">
                        <div className="font-bold text-sm">{region.name}</div>
                        <div className="text-gray-600 dark:text-gray-300 font-korean text-xs mb-1">{region.nameKorean}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{region.population}</div>
                        {isRegionExplored(region.id) && (
                          <div className="text-green-600 dark:text-green-400 text-xs mt-2 flex items-center">
                            <Icon icon="check" className="w-3 h-3 mr-1" />
                            Explored ✓
                          </div>
                        )}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-6 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced pulsing effect for unexplored regions */}
                    {!isRegionExplored(region.id) && (
                      <>
                        <div 
                          className="absolute inset-0 rounded-full animate-ping opacity-60"
                          style={{ backgroundColor: region.color }}
                        ></div>
                        <div 
                          className="absolute inset-0 rounded-full animate-pulse opacity-40"
                          style={{ backgroundColor: region.color }}
                        ></div>
                      </>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                �️ Real satellite map of South Korea! Click on the region markers to explore each area. Hover over markers for detailed information.
              </p>
            </div>
          </div>

          {/* Region Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {koreanRegions.map((region) => {
              const isExplored = isRegionExplored(region.id);
              
              return (
                <div
                  key={region.id}
                  className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 cursor-pointer transition-all duration-300 ${
                    isExplored
                      ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
                  onClick={() => setSelectedRegion(region)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {region.name}
                      </h3>
                      <p className="text-sm font-korean text-gray-600 dark:text-gray-400">
                        {region.nameKorean}
                      </p>
                    </div>
                    <div
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: region.color }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {region.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Population: {region.population}
                    </span>
                    {isExplored && (
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
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
              className="flex items-center space-x-2 text-pink-500 dark:text-pink-400 hover:underline"
            >
              <span>←</span>
              <span>Back to Map</span>
            </button>
            <button
              onClick={() => handleRegionExplored(selectedRegion.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isRegionExplored(selectedRegion.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-500 text-white hover:bg-pink-500/80'
              }`}
            >
              <Icon icon={isRegionExplored(selectedRegion.id) ? 'check' : 'plus'} className="w-4 h-4" />
              <span>{isRegionExplored(selectedRegion.id) ? 'Explored' : 'Mark as Explored'}</span>
            </button>
          </div>

          {/* Region Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedRegion.name}
                </h1>
                <p className="text-lg font-korean text-gray-600 dark:text-gray-400 mb-2">
                  {selectedRegion.nameKorean}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Population</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedRegion.population}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Best Time</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{selectedRegion.bestTimeToVisit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Climate</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{selectedRegion.climate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Features</p>
                <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{selectedRegion.keyFeatures.length}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 p-2 bg-gray-100 dark:bg-gray-950 rounded-xl">
            <TabButton tabId="overview" label="Overview" icon="🏠" />
            <TabButton tabId="attractions" label="Attractions" icon="🏛️" />
            <TabButton tabId="food" label="Food" icon="🍜" />
            <TabButton tabId="culture" label="Culture" icon="🎭" />
            <TabButton tabId="language" label="Language" icon="💬" />
            <TabButton tabId="travel" label="Travel Tips" icon="✈️" />
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedRegion.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-500" />
                      <span className="text-gray-700 dark:text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attractions' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Must-Visit Attractions</h3>
                <div className="space-y-4">
                  {selectedRegion.attractions.map((attraction, index) => (
                    <div key={index} className="border-l-4 border-pink-500 dark:border-pink-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{attraction.name}</h4>
                      <p className="text-sm font-korean text-gray-600 dark:text-gray-400">{attraction.nameKorean}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-pink-50/20 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400 text-xs rounded-full">
                        {attraction.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'food' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Regional Specialties</h3>
                <div className="space-y-4">
                  {selectedRegion.specialFoods.map((food, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{food.name}</h4>
                      <p className="text-sm font-korean text-gray-600 dark:text-gray-400 mb-2">{food.nameKorean}</p>
                      <p className="text-gray-700 dark:text-white">{food.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'culture' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Cultural Notes</h3>
                <div className="space-y-3">
                  {selectedRegion.culturalNotes.map((note, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-white">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Language & Dialect</h3>
                <div className="space-y-3">
                  {selectedRegion.languageNotes.map((note, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-500 mt-2 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-white">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'travel' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Travel Tips</h3>
                <div className="space-y-3">
                  {selectedRegion.travelTips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">💡</span>
                      <p className="text-gray-700 dark:text-white">{tip}</p>
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
