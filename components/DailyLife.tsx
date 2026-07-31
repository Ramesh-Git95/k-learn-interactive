import React from 'react';
import { dailyLifeTopics } from '../data/koreanData';
import TopicExplorer from './TopicExplorer';

// Daily life — the shared topic reader, pointed at the daily-life topics.
// The layout lives in TopicExplorer so this and ModernKorea cannot drift apart.

interface Props {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const DailyLife: React.FC<Props> = ({ progress, toggleProgress }) => (
  <TopicExplorer
    topics={dailyLifeTopics}
    keyPrefix="daily_life"
    progress={progress}
    toggleProgress={toggleProgress}
  />
);

export default DailyLife;
