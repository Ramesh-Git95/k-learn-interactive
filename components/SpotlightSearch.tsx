import React, { useState, useEffect, useRef, useMemo } from 'react';
import { vocabulary, commonPhrases, grammarPatterns, cultureTips, koreanRegions, dailyLifeTopics, modernKoreaTopics } from '../data/koreanData';
import type { VocabItem, PhraseItem, GrammarPattern, CultureTip, KoreanRegion, DailyLifeTopic, Section } from '../types';
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

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: Section, result?: SearchResult) => void;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle click outside to close - improved approach
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      // Close if clicking outside the modal content
      if (!target.closest('.spotlight-modal-content')) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Use timeout to avoid closing immediately when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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
        phrase.english.toLowerCase().includes(term)
      ) {
        results.push({
          id: `phrase-${index}`,
          type: 'phrase',
          title: phrase.korean,
          subtitle: phrase.english,
          korean: phrase.korean,
          romanization: phrase.romanization,
          english: phrase.english,
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
        pattern.examples.some(example => 
          example.korean.toLowerCase().includes(term) ||
          example.english.toLowerCase().includes(term)
        )
      ) {
        results.push({
          id: `grammar-${index}`,
          type: 'grammar',
          title: pattern.pattern,
          subtitle: pattern.explanation,
          content: pattern.examples[0] ? `${pattern.examples[0].korean} - ${pattern.examples[0].english}` : '',
          icon: '📝',
          data: pattern
        });
      }
    });

    // Search culture tips
    cultureTips.forEach((tip, index) => {
      if (
        tip.title.toLowerCase().includes(term) ||
        tip.content.toLowerCase().includes(term)
      ) {
        results.push({
          id: `culture-${index}`,
          type: 'culture',
          title: tip.title,
          subtitle: tip.content.substring(0, 100) + '...',
          icon: '🎭',
          data: tip
        });
      }
    });

    // Search regions
    koreanRegions.forEach(region => {
      if (
        region.name.toLowerCase().includes(term) ||
        region.description.toLowerCase().includes(term) ||
        region.attractions.some(attraction => attraction.name.toLowerCase().includes(term)) ||
        region.specialFoods.some(food => food.name.toLowerCase().includes(term))
      ) {
        results.push({
          id: `region-${region.id}`,
          type: 'region',
          title: region.name,
          subtitle: region.description,
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
          section.title.toLowerCase().includes(term) ||
          section.content.toLowerCase().includes(term)
        ) {
          results.push({
            id: `daily-life-${topic.id}-${section.id}`,
            type: 'daily-life',
            title: section.title,
            subtitle: `Daily Life: ${topic.title}`,
            content: section.content.substring(0, 100) + '...',
            category: topic.title,
            section: section.title,
            icon: '🏠',
            data: { topic, section }
          });
        }
      });
    });

    // Search modern Korea topics
    modernKoreaTopics.forEach(topic => {
      topic.sections.forEach(section => {
        if (
          topic.title.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term) ||
          section.content.toLowerCase().includes(term)
        ) {
          results.push({
            id: `modern-korea-${topic.id}-${section.id}`,
            type: 'modern-korea',
            title: section.title,
            subtitle: `Modern Korea: ${topic.title}`,
            content: section.content.substring(0, 100) + '...',
            category: topic.title,
            section: section.title,
            icon: '🎌',
            data: { topic, section }
          });
        }
      });
    });

    return results.slice(0, 10); // Limit to 10 results for performance
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement && selectedElement.scrollIntoView) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate section based on result type
    switch (result.type) {
      case 'vocabulary':
        onNavigate('vocabulary', result);
        break;
      case 'phrase':
        onNavigate('phrases', result);
        break;
      case 'grammar':
        onNavigate('grammar', result);
        break;
      case 'culture':
      case 'region':
      case 'daily-life':
      case 'modern-korea':
        onNavigate('culture', result);
        break;
      default:
        break;
    }
    onClose();
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-600/50 rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      />
      
      {/* Spotlight Modal */}
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl animate-in slide-in-from-top-4 fade-in duration-300 spotlight-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <Icon icon="search" className="w-6 h-6 text-gray-400 dark:text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Korean content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
          />
          <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-400">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-950 rounded border">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-950 rounded border">↵</kbd>
            <span>select</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-950 rounded border">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Search Results */}
        <div 
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto"
        >
          {searchTerm.length < 2 ? (
            <div className="p-8 text-center">
              <Icon icon="search" className="w-12 h-12 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                Search Korean Content
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Type at least 2 characters to search vocabulary, phrases, grammar, and culture content
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <Icon icon="search" className="w-12 h-12 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No results found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors flex items-center space-x-3 ${
                    index === selectedIndex ? 'bg-[#FDEEE6]/10 dark:bg-[#E4572E]/10 border-r-2 border-[#E4572E] dark:border-[#E4572E]' : ''
                  }`}
                >
                  <div className="text-xl">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {highlightText(result.title, searchTerm)}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-950 rounded-full text-gray-600 dark:text-gray-400 capitalize ml-2 flex-shrink-0">
                        {result.type === 'daily-life' ? 'Daily Life' : result.type === 'modern-korea' ? 'Modern Korea' : result.type}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {highlightText(result.subtitle, searchTerm)}
                      </p>
                    )}
                    {result.romanization && (
                      <p className="text-xs text-gray-500 dark:text-gray-400/70 truncate">
                        {highlightText(result.romanization, searchTerm)}
                      </p>
                    )}
                    {result.category && (
                      <p className="text-xs text-[#E4572E] dark:text-[#F07A55] truncate">
                        {result.category}
                      </p>
                    )}
                  </div>
                  <Icon icon="arrow-right" className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotlightSearch;
