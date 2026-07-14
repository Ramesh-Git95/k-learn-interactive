import React from 'react';
import { hangulCharacters } from '../data/koreanData';
import HangulCard from './HangulCard';
import type { HangulCharacter } from '../types';

interface HangulSectionProps {
  progress?: { [key: string]: boolean };
  toggleProgress?: (key: string) => void;
}

const HangulSection: React.FC<HangulSectionProps> = ({ progress = {}, toggleProgress }) => {
  const consonants = hangulCharacters.filter(c => c.type === 'consonant');
  const vowels = hangulCharacters.filter(c => c.type === 'vowel');

  const markCharacterAsStudied = (char: HangulCharacter) => {
    const key = `hangul_char_${char.char}`;
    if (toggleProgress && !progress[key]) toggleProgress(key);
  };

  const getGroupProgress = (chars: HangulCharacter[]) => {
    const studied = chars.filter(c => progress[`hangul_char_${c.char}`]).length;
    return { studied, total: chars.length, percentage: chars.length > 0 ? (studied / chars.length) * 100 : 0 };
  };

  const consonantProgress = getGroupProgress(consonants);
  const vowelProgress = getGroupProgress(vowels);
  const totalStudied = consonantProgress.studied + vowelProgress.studied;
  const totalChars = consonantProgress.total + vowelProgress.total;
  const overallPct = totalChars > 0 ? Math.round((totalStudied / totalChars) * 100) : 0;

  function SectionGrid({ title, subtitle, chars, progressData, showFirstHint = false }: {
    title: string;
    subtitle: string;
    chars: HangulCharacter[];
    progressData: { studied: number; total: number; percentage: number };
    showFirstHint?: boolean;
  }) {
    return (
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 sm:min-w-[160px]">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressData.percentage}%`,
                  background: progressData.percentage === 100
                    ? 'linear-gradient(90deg, #22C55E, #059669)'
                    : 'var(--brand-gradient-h)',
                }}
              />
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${
              progressData.percentage === 100 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {progressData.studied}/{progressData.total}
              {progressData.percentage === 100 && ' ✓'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 sm:gap-3">
          {chars.map((char, idx) => (
            <HangulCard
              key={char.char}
              char={char}
              onStudy={() => markCharacterAsStudied(char)}
              isStudied={!!progress[`hangul_char_${char.char}`]}
              showHint={showFirstHint && idx === 0}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-6 sm:p-8" style={{ background: 'var(--brand-gradient-hero)' }}>
        {/* decorative floaters */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {['ㄱ','ㄴ','ㄷ','아','이','오','가','나','한'].map((c, i) => (
            <span
              key={i}
              className="absolute font-black text-white/10"
              style={{ fontSize: `${2 + (i % 3)}rem`, top: `${(i * 23) % 90}%`, left: `${(i * 31) % 90}%` }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl font-black text-white" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>한</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">The Korean Alphabet</h1>
              <p className="text-[#FBDCCB] font-semibold text-sm">한글 · Hangul</p>
            </div>
          </div>
          <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
            Click any character to hear its pronunciation and mark it as studied. Hangul is scientifically designed — one of the easiest alphabets to learn!
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Consonants Learned', value: `${consonantProgress.studied}/${consonantProgress.total}`, pct: consonantProgress.percentage, color: '#E4572E', emoji: '🔷' },
          { label: 'Vowels Learned', value: `${vowelProgress.studied}/${vowelProgress.total}`, pct: vowelProgress.percentage, color: '#3F8571', emoji: '🔶' },
          { label: 'Overall Progress', value: `${overallPct}%`, pct: overallPct, color: '#2F5D8A', emoji: '🏆' },
        ].map(({ label, value, pct, color, emoji }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-2xl font-black mb-2" style={{ color }}>{value}</div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#22C55E,#059669)' : `linear-gradient(90deg, ${color}, ${color}99)` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Syllable Blocks explainer */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, #2F5D8A, #3F8571)' }}>📦</div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Syllable Blocks <span className="text-gray-400 dark:text-gray-500 font-semibold">(음절)</span></h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Korean is written in syllable blocks. Each block has at least one consonant and one vowel stacked together.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FDEEE6] dark:bg-[#5F2010]/10 border border-[#FBDCCB] dark:border-[#5F2010]/30">
            <span className="text-2xl font-black" style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>가</span>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Consonant + Vowel</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ㄱ + ㅏ = 가 (ga) — the simplest block</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#EEF5F1] dark:bg-[#153327]/10 border border-[#DDEBE4] dark:border-[#153327]/30">
            <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #3F8571, #2F5D8A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>각</span>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Consonant + Vowel + 받침 (Batchim)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ㄱ + ㅏ + ㄱ = 각 (gak) — a final consonant at the bottom</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
          The sound of a consonant can change depending on its position in the block. Understanding this structure is key to reading Korean!
        </p>
      </div>

      {/* Character Grids */}
      <SectionGrid
        title="Consonants (자음)"
        subtitle={`${consonants.length} basic consonants — the building blocks of Korean`}
        chars={consonants}
        progressData={consonantProgress}
        showFirstHint
      />
      <SectionGrid
        title="Vowels (모음)"
        subtitle={`${vowels.length} vowels — combine with consonants to form syllables`}
        chars={vowels}
        progressData={vowelProgress}
      />
    </div>
  );
};

export default HangulSection;
