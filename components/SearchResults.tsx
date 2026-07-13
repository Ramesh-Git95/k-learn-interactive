import React, { useMemo, useState } from 'react';
import { vocabulary, commonPhrases, grammarPatterns, cultureTips, koreanRegions, dailyLifeTopics, modernKoreaTopics } from '../data/koreanData';
import type { VocabItem, PhraseItem, GrammarPattern, CultureTip, KoreanRegion, DailyLifeTopic } from '../types';
import Icon from './Icon';

interface SearchResult {
  id: string;
  type: 'vocabulary' | 'phrase' | 'grammar' | 'culture' | 'region' | 'daily-life' | 'modern-korea';
  title: string;
  subtitle?: string;
  korean?: string;
  romanization?: string;
  english?: string;
  content?: string;
  category?: string;
  section?: string;
  icon: string;
  data: any;
}

interface SearchResultsProps {
  searchTerm: string;
  onItemClick?: (result: SearchResult) => void;
  onClose?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchTerm, onItemClick, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Search vocabulary
    vocabulary.forEach(category => {
      category.items.forEach(item => {
        if (
          item.korean.toLowerCase().includes(term) ||
          item.romanization.toLowerCase().includes(term) ||
          item.english.toLowerCase().includes(term) ||
          category.name.toLowerCase().includes(term)
        ) {
          results.push({
            id: `vocab-${item.korean}`,
            type: 'vocabulary',
            title: item.korean,
            subtitle: item.english,
            korean: item.korean,
            romanization: item.romanization,
            english: item.english,
            category: category.name,
            section: 'Vocabulary',
            icon: '📚',
            data: item
          });
        }
      });
    });

    // Search phrases
    commonPhrases.forEach((phrase, index) => {
      if (
        phrase.korean.toLowerCase().includes(term) ||
        phrase.romanization.toLowerCase().includes(term) ||
        phrase.english.toLowerCase().includes(term) ||
        phrase.context.toLowerCase().includes(term)
      ) {
        results.push({
          id: `phrase-${index}`,
          type: 'phrase',
          title: phrase.korean,
          subtitle: phrase.english,
          korean: phrase.korean,
          romanization: phrase.romanization,
          english: phrase.english,
          category: phrase.context,
          section: 'Phrases',
          icon: '💬',
          data: phrase
        });
      }
    });

    // Search grammar patterns
    grammarPatterns.forEach((pattern, index) => {
      if (
        pattern.pattern.toLowerCase().includes(term) ||
        pattern.explanation.toLowerCase().includes(term) ||
        pattern.examples.some(ex => 
          ex.korean.toLowerCase().includes(term) || 
          ex.english.toLowerCase().includes(term)
        )
      ) {
        results.push({
          id: `grammar-${index}`,
          type: 'grammar',
          title: pattern.pattern,
          subtitle: pattern.explanation,
          content: pattern.explanation,
          section: 'Grammar',
          icon: '📝',
          data: pattern
        });
      }
    });

    // Search culture tips
    cultureTips.forEach((tip, index) => {
      if (
        tip.title.toLowerCase().includes(term) ||
        tip.content.toLowerCase().includes(term) ||
        (tip.category && tip.category.toLowerCase().includes(term))
      ) {
        results.push({
          id: `culture-${index}`,
          type: 'culture',
          title: tip.title,
          subtitle: tip.content.substring(0, 100) + '...',
          content: tip.content,
          category: tip.category,
          section: 'Culture',
          icon: tip.icon,
          data: tip
        });
      }
    });

    // Search regions
    koreanRegions.forEach(region => {
      if (
        region.name.toLowerCase().includes(term) ||
        region.nameKorean.toLowerCase().includes(term) ||
        region.description.toLowerCase().includes(term) ||
        region.keyFeatures.some(feature => feature.toLowerCase().includes(term)) ||
        region.attractions.some(attr => attr.name.toLowerCase().includes(term)) ||
        region.specialFoods.some(food => food.name.toLowerCase().includes(term))
      ) {
        results.push({
          id: `region-${region.id}`,
          type: 'region',
          title: region.name,
          subtitle: region.nameKorean,
          korean: region.nameKorean,
          english: region.name,
          content: region.description,
          section: 'Regional Explorer',
          icon: '🗺️',
          data: region
        });
      }
    });

    // Search daily life topics
    dailyLifeTopics.forEach(topic => {
      topic.sections.forEach(section => {
        if (
          topic.title.toLowerCase().includes(term) ||
          topic.titleKorean.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term) ||
          section.content.toLowerCase().includes(term) ||
          section.tips?.some(tip => tip.toLowerCase().includes(term)) ||
          section.vocabulary?.some(vocab => 
            vocab.korean.toLowerCase().includes(term) ||
            vocab.romanization.toLowerCase().includes(term) ||
            vocab.english.toLowerCase().includes(term)
          ) ||
          section.phrases?.some(phrase => 
            phrase.korean.toLowerCase().includes(term) ||
            phrase.english.toLowerCase().includes(term)
          )
        ) {
          results.push({
            id: `daily-life-${topic.id}-${section.id}`,
            type: 'daily-life',
            title: `${topic.title}: ${section.title}`,
            subtitle: section.content.substring(0, 100) + '...',
            content: section.content,
            category: topic.title,
            section: 'Daily Life',
            icon: topic.icon,
            data: { topic, section }
          });
        }
      });
    });

    // Search modern korea topics
    modernKoreaTopics.forEach(topic => {
      topic.sections.forEach(section => {
        if (
          topic.title.toLowerCase().includes(term) ||
          topic.titleKorean.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term) ||
          section.content.toLowerCase().includes(term) ||
          section.tips?.some(tip => tip.toLowerCase().includes(term)) ||
          section.vocabulary?.some(vocab => 
            vocab.korean.toLowerCase().includes(term) ||
            vocab.romanization.toLowerCase().includes(term) ||
            vocab.english.toLowerCase().includes(term)
          )
        ) {
          results.push({
            id: `modern-korea-${topic.id}-${section.id}`,
            type: 'modern-korea',
            title: `${topic.title}: ${section.title}`,
            subtitle: section.content.substring(0, 100) + '...',
            content: section.content,
            category: topic.title,
            section: 'Modern Korea',
            icon: topic.icon,
            data: { topic, section }
          });
        }
      });
    });

    // Sort results by relevance (exact matches first)
    return results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(term) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(term) ? 1 : 0;
      return bExact - aExact;
    });
  }, [searchTerm]);

  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') return searchResults;
    return searchResults.filter(result => result.type === activeCategory);
  }, [searchResults, activeCategory]);

  const categories = useMemo(() => {
    const counts = searchResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { id: 'all', name: 'All Results', count: searchResults.length, icon: '🔍' },
      { id: 'vocabulary', name: 'Vocabulary', count: counts.vocabulary || 0, icon: '📚' },
      { id: 'phrase', name: 'Phrases', count: counts.phrase || 0, icon: '💬' },
      { id: 'grammar', name: 'Grammar', count: counts.grammar || 0, icon: '📝' },
      { id: 'culture', name: 'Culture', count: counts.culture || 0, icon: '🎭' },
      { id: 'region', name: 'Regions', count: counts.region || 0, icon: '🗺️' },
      { id: 'daily-life', name: 'Daily Life', count: counts['daily-life'] || 0, icon: '🏠' },
      { id: 'modern-korea', name: 'Modern Korea', count: counts['modern-korea'] || 0, icon: '🌆' }
    ].filter(cat => cat.count > 0);
  }, [searchResults]);

  if (!searchTerm || searchTerm.length < 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-50">
        <div className="text-center">
          <Icon icon="search" className="w-12 h-12 text-gray-400 dark:text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Type at least 2 characters to search
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Search across vocabulary, phrases, grammar, culture, and more!
          </p>
        </div>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-50">
        <div className="text-center">
          <Icon icon="search" className="w-12 h-12 text-gray-400 dark:text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No results found for "{searchTerm}"
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Try different keywords or check spelling
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Search Results
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Icon icon="close" className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto">
        {filteredResults.map(result => (
          <button
            key={result.id}
            onClick={() => onItemClick?.(result)}
            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0 mt-1">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {result.title}
                  </h4>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {result.section}
                  </span>
                </div>
                {result.korean && result.romanization && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {result.romanization}
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {result.subtitle || result.content}
                </p>
                {result.category && (
                  <span className="inline-block mt-1 text-xs text-[#E4572E] dark:text-[#F07A55]">
                    {result.category}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
