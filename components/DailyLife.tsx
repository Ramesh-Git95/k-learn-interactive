import React, { useState } from 'react';
import { dailyLifeTopics } from '../data/koreanData';
import type { DailyLifeTopic, DailyLifeSection } from '../types';
import Icon from './Icon';

interface DailyLifeProps {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const DailyLife: React.FC<DailyLifeProps> = ({ progress, toggleProgress }) => {
  const [selectedTopic, setSelectedTopic] = useState<DailyLifeTopic>(dailyLifeTopics[0]);
  const [selectedSection, setSelectedSection] = useState<DailyLifeSection>(dailyLifeTopics[0].sections[0]);
  const [activeTab, setActiveTab] = useState<'content' | 'vocabulary' | 'phrases' | 'examples'>('content');

  const isTopicCompleted = (topicId: string) => {
    return progress[`daily_life_topic_${topicId}`] || false;
  };

  const isSectionCompleted = (topicId: string, sectionId: string) => {
    return progress[`daily_life_${topicId}_${sectionId}`] || false;
  };

  const handleSectionComplete = (topicId: string, sectionId: string) => {
    toggleProgress(`daily_life_${topicId}_${sectionId}`);
    
    // Check if all sections of this topic are now completed
    const topic = dailyLifeTopics.find(t => t.id === topicId);
    if (topic) {
      const allCompleted = topic.sections.every(section => 
        progress[`daily_life_${topicId}_${section.id}`] || section.id === sectionId
      );
      if (allCompleted) {
        toggleProgress(`daily_life_topic_${topicId}`);
      }
    }
  };

  const getCompletedSectionsCount = (topicId: string) => {
    const topic = dailyLifeTopics.find(t => t.id === topicId);
    if (!topic) return 0;
    return topic.sections.filter(section => 
      isSectionCompleted(topicId, section.id)
    ).length;
  };

  const getTotalProgressPercentage = () => {
    const totalSections = dailyLifeTopics.reduce((acc, topic) => acc + topic.sections.length, 0);
    const completedSections = dailyLifeTopics.reduce((acc, topic) => 
      acc + getCompletedSectionsCount(topic.id), 0
    );
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#E4572E] dark:text-[#F07A55] mb-2">
            🏠 Korean Daily Life
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Discover how Koreans live, work, and socialize in everyday life
          </p>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4 mt-4 sm:mt-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg px-3 sm:px-4 py-2 shadow-sm">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Progress: </span>
            <span className="font-semibold text-[#E4572E] dark:text-[#F07A55] text-sm sm:text-base">
              {Math.round(getTotalProgressPercentage())}%
            </span>
          </div>
          <div className="w-16 sm:w-20 lg:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-[#E4572E] dark:bg-[#E4572E] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getTotalProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Topic Sidebar */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Life Topics
          </h2>
          <div className="space-y-3">
            {dailyLifeTopics.map((topic) => {
              const completedSections = getCompletedSectionsCount(topic.id);
              const totalSections = topic.sections.length;
              const isCompleted = isTopicCompleted(topic.id);
              
              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setSelectedSection(topic.sections[0]);
                    setActiveTab('content');
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                    selectedTopic.id === topic.id
                      ? 'bg-[#E4572E] text-white dark:bg-[#E4572E] shadow-lg'
                      : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{topic.icon}</span>
                    {isCompleted && (
                      <Icon icon="check" className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mb-1">{topic.title}</h3>
                  <p className="text-xs opacity-80 mb-2">{topic.titleKorean}</p>
                  <div className={`text-xs ${
                    selectedTopic.id === topic.id 
                      ? 'text-white/80' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {completedSections}/{totalSections} sections
                  </div>
                  <div className="w-full bg-white/20 dark:bg-gray-700/30 rounded-full h-1.5 mt-2">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        selectedTopic.id === topic.id 
                          ? 'bg-white/60' 
                          : 'bg-[#E4572E]/60 dark:bg-[#E4572E]/60'
                      }`}
                      style={{ width: `${(completedSections / totalSections) * 100}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {/* Section Navigation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedTopic.title} - {selectedTopic.titleKorean}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedTopic.description}
            </p>
            
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTopic.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSection(section);
                    setActiveTab('content');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedSection.id === section.id
                      ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {section.title}
                  {isSectionCompleted(selectedTopic.id, section.id) && (
                    <Icon icon="check" className="w-4 h-4 ml-2 inline" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-800 pb-4">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'content'
                    ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                📖 Content
              </button>
              {selectedSection.vocabulary && selectedSection.vocabulary.length > 0 && (
                <button
                  onClick={() => setActiveTab('vocabulary')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'vocabulary'
                      ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  📚 Vocabulary ({selectedSection.vocabulary.length})
                </button>
              )}
              {selectedSection.phrases && selectedSection.phrases.length > 0 && (
                <button
                  onClick={() => setActiveTab('phrases')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'phrases'
                      ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  💬 Phrases ({selectedSection.phrases.length})
                </button>
              )}
              {selectedSection.examples && selectedSection.examples.length > 0 && (
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'examples'
                      ? 'bg-[#E4572E] text-white dark:bg-[#E4572E]'
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  🎭 Examples ({selectedSection.examples.length})
                </button>
              )}
            </div>

            {/* Content Display */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-white leading-relaxed">
                    {selectedSection.content}
                  </p>
                </div>

                {/* Tips */}
                {selectedSection.tips && selectedSection.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      💡 Essential Tips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedSection.tips.map((tip, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-gray-700/30 rounded-lg p-3">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural Notes */}
                {selectedSection.culturalNotes && selectedSection.culturalNotes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      🎭 Cultural Context
                    </h3>
                    <div className="space-y-2">
                      {selectedSection.culturalNotes.map((note, index) => (
                        <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-600 p-3">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mark as Complete Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => handleSectionComplete(selectedTopic.id, selectedSection.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isSectionCompleted(selectedTopic.id, selectedSection.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-[#E4572E] text-white hover:bg-[#E4572E]/80 dark:bg-[#E4572E] dark:hover:bg-[#C13F22]'
                    }`}
                  >
                    <Icon 
                      icon={isSectionCompleted(selectedTopic.id, selectedSection.id) ? 'check' : 'bookmark'} 
                      className="w-4 h-4 mr-2 inline" 
                    />
                    {isSectionCompleted(selectedTopic.id, selectedSection.id) ? 'Completed!' : 'Mark as Complete'}
                  </button>
                </div>
              </div>
            )}

            {/* Vocabulary Tab */}
            {activeTab === 'vocabulary' && selectedSection.vocabulary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSection.vocabulary.map((vocab, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-[#EEF5F1] dark:from-gray-700/30 dark:to-gray-700/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {vocab.korean}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {vocab.romanization}
                    </div>
                    <div className="text-base text-[#E4572E] dark:text-[#F07A55] font-medium">
                      {vocab.english}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Phrases Tab */}
            {activeTab === 'phrases' && selectedSection.phrases && (
              <div className="space-y-4">
                {selectedSection.phrases.map((phrase, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {phrase.korean}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {phrase.romanization}
                    </div>
                    <div className="text-base text-[#E4572E] dark:text-[#F07A55] font-medium mb-2">
                      {phrase.english}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {phrase.context}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        phrase.formality === 'formal' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        phrase.formality === 'polite' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {phrase.formality}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Examples Tab */}
            {activeTab === 'examples' && selectedSection.examples && (
              <div className="space-y-4">
                {selectedSection.examples.map((example, index) => (
                  <div key={index} className="bg-gradient-to-r from-[#EEF5F1] to-[#FDEEE6] dark:from-[#153327]/20 dark:to-[#5F2010]/20 rounded-lg p-4 border border-[#BFDACD] dark:border-[#1D4436]">
                    <div className="text-sm font-medium text-[#265847] dark:text-[#93C2AE] mb-3">
                      💼 {example.situation}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {example.korean}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {example.romanization}
                    </div>
                    <div className="text-base text-[#E4572E] dark:text-[#F07A55] font-medium">
                      {example.english}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLife;
