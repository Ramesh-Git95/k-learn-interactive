import React from 'react';
import { modernKoreaTopics } from '../data/koreanData';
import TopicExplorer from './TopicExplorer';

// Modern Korea — the shared topic reader, pointed at the modern-Korea topics.

interface Props {
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

const ModernKorea: React.FC<Props> = ({ progress, toggleProgress }) => (
  <TopicExplorer
    topics={modernKoreaTopics}
    keyPrefix="modern_korea"
    progress={progress}
    toggleProgress={toggleProgress}
  />
);

export default ModernKorea;
