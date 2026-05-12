import { useState, useEffect } from 'react';
import { getXPData, getStreakData, getLevelInfo, todayISO } from '../utils/xpStreak';

export interface WeekDay {
  dateStr: string;
  label: string;
  studied: boolean;
  isToday: boolean;
}

export function useXPStreak() {
  const [totalXP, setTotalXP]     = useState(() => getXPData().total);
  const [streakData, setStreakData] = useState(getStreakData);

  useEffect(() => {
    const onXP     = () => setTotalXP(getXPData().total);
    const onStreak = () => setStreakData(getStreakData());
    window.addEventListener('klearn-xp-updated',     onXP);
    window.addEventListener('klearn-streak-updated', onStreak);
    return () => {
      window.removeEventListener('klearn-xp-updated',     onXP);
      window.removeEventListener('klearn-streak-updated', onStreak);
    };
  }, []);

  const { level, xpInLevel, xpForLevel } = getLevelInfo(totalXP);
  const today = todayISO();
  const studiedToday = streakData.lastStudyDate === today;
  const streakAtRisk = streakData.currentStreak > 0 && !studiedToday;

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekHeatmap: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      dateStr: ds,
      label:   i === 6 ? 'Today' : DAY_LABELS[d.getDay()],
      studied: streakData.studyDates.includes(ds),
      isToday: ds === today,
    };
  });

  return {
    totalXP,
    level,
    xpInLevel,
    xpForLevel,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    studiedToday,
    streakAtRisk,
    weekHeatmap,
  };
}
