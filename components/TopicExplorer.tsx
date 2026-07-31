import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { DailyLifeTopic, DailyLifeSection } from '../types';
import { accentFor } from '../utils/moduleAccent';

// The reader behind both "Daily life" and "Modern Korea".
//
// Those two were near-identical 370-line files — same state, same tabs, same
// layout, differing only in which topics they read and which progress key they
// write. They are now one component used twice, so a change to how a topic reads
// happens once and neither can drift away from the other.
//
// Shape follows the rest of the clarity pass: the topics in a column, the one
// you are reading in the middle, and its extras (words, phrases, examples)
// behind tabs rather than stacked into an endless page.

const ACC = accentFor('culture');

interface Props {
  topics: DailyLifeTopic[];
  /** Progress key namespace, e.g. 'daily_life' or 'modern_korea'. */
  keyPrefix: string;
  progress: { [key: string]: boolean };
  toggleProgress: (key: string) => void;
}

type Tab = 'content' | 'vocabulary' | 'phrases' | 'examples';

const TopicExplorer: React.FC<Props> = ({ topics, keyPrefix, progress, toggleProgress }) => {
  const [topic, setTopic] = useState<DailyLifeTopic>(topics[0]);
  const [section, setSection] = useState<DailyLifeSection>(topics[0].sections[0]);
  const [tab, setTab] = useState<Tab>('content');

  const sectionKey = (topicId: string, sectionId: string) => `${keyPrefix}_${topicId}_${sectionId}`;
  const isSectionDone = (topicId: string, sectionId: string) => !!progress[sectionKey(topicId, sectionId)];

  const doneIn = (t: DailyLifeTopic) => t.sections.filter(s => isSectionDone(t.id, s.id)).length;

  // Marking the last section of a topic completes the topic itself.
  const completeSection = (topicId: string, sectionId: string) => {
    toggleProgress(sectionKey(topicId, sectionId));
    const t = topics.find(x => x.id === topicId);
    if (!t) return;
    const allDone = t.sections.every(s => progress[sectionKey(topicId, s.id)] || s.id === sectionId);
    if (allDone) toggleProgress(`${keyPrefix}_topic_${topicId}`);
  };

  const totalSections = topics.reduce((a, t) => a + t.sections.length, 0);
  const totalDone = topics.reduce((a, t) => a + doneIn(t), 0);
  const done = isSectionDone(topic.id, section.id);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'content', label: 'Read' },
    ...(section.vocabulary?.length ? [{ id: 'vocabulary' as Tab, label: 'Words', count: section.vocabulary.length }] : []),
    ...(section.phrases?.length ? [{ id: 'phrases' as Tab, label: 'Phrases', count: section.phrases.length }] : []),
    ...(section.examples?.length ? [{ id: 'examples' as Tab, label: 'In context', count: section.examples.length }] : []),
  ];

  return (
    <div>
      {/* Overall progress */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 max-w-[220px] flex-1 overflow-hidden rounded-full bg-[rgba(20,32,47,0.10)] dark:bg-gray-800">
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${totalSections ? (totalDone / totalSections) * 100 : 0}%`, background: ACC.light }} />
        </div>
        <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
          {totalDone} of {totalSections} sections read
        </span>
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ── Topics ── */}
        <div className="order-2 w-full flex-none lg:order-1 lg:w-[250px]">
          <div className="mb-2.5 text-[13px] font-semibold text-[#4A5566] dark:text-gray-400">TOPICS</div>
          <div className="flex flex-col gap-0.5">
            {topics.map(t => {
              const on = t.id === topic.id;
              const count = doneIn(t);
              const complete = count === t.sections.length;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTopic(t); setSection(t.sections[0]); setTab('content'); }}
                  className={`w-full rounded-[10px] px-3 py-2.5 text-left transition-colors ${
                    on ? '' : 'hover:bg-[rgba(20,32,47,0.04)] dark:hover:bg-white/5'
                  }`}
                  style={on ? { background: `${ACC.light}1A`, borderLeft: `3px solid ${ACC.light}`, paddingLeft: 9 } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className={`min-w-0 flex-1 truncate text-[14px] ${
                      on ? 'font-semibold text-[#16202F] dark:text-white' : 'font-medium text-[#16202F] dark:text-gray-200'
                    }`}>
                      {t.title}
                    </span>
                    {complete
                      ? <Check className="h-3.5 w-3.5 flex-none" style={{ color: ACC.light }} />
                      : <span className="flex-none text-[12px] text-[#4A5566] dark:text-gray-500">{count}/{t.sections.length}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── The topic being read ── */}
        <div className="order-1 w-full min-w-0 flex-1 lg:order-2">
          <div className="mb-4">
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#16202F] sm:text-[24px] dark:text-white">
              {topic.title}
              {topic.titleKorean && (
                <span className="ml-2.5 font-korean text-[17px] font-medium text-[#4A5566] dark:text-gray-500">
                  {topic.titleKorean}
                </span>
              )}
            </h2>
            {topic.description && (
              <p className="mt-1.5 max-w-[64ch] text-[14.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-400">
                {topic.description}
              </p>
            )}
          </div>

          {/* Sections within the topic */}
          <div className="mb-4 flex flex-wrap gap-2">
            {topic.sections.map(s => {
              const on = s.id === section.id;
              const sDone = isSectionDone(topic.id, s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => { setSection(s); setTab('content'); }}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
                    on ? 'text-white'
                      : 'border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] text-[#4A5566] hover:border-[rgba(20,32,47,0.28)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                  }`}
                  style={on ? { background: ACC.light } : undefined}
                >
                  {s.title}
                  {sDone && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="kl-card p-5 sm:p-6">
            {/* What kind of material */}
            <div className="mb-5 flex flex-wrap gap-2 border-b border-[rgba(20,32,47,0.12)] pb-4 dark:border-gray-800">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold leading-none transition-colors ${
                    tab === t.id
                      ? 'text-white'
                      : 'text-[#4A5566] hover:text-[#16202F] dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  style={tab === t.id ? { background: ACC.light } : undefined}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className={tab === t.id ? 'text-white/70' : 'text-[#4A5566] dark:text-gray-500'}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'content' && (
              <div>
                <p className="max-w-[64ch] text-[15.5px] leading-[1.7] text-[#3E4A5A] dark:text-gray-300">
                  {section.content}
                </p>

                {!!section.tips?.length && (
                  <div className="mt-6">
                    <div className="mb-3 text-[14px] font-semibold text-[#16202F] dark:text-white">Worth knowing</div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {section.tips.map((tip, i) => (
                        <div key={i} className="kl-well rounded-xl p-3.5 text-[13.5px] leading-relaxed text-[#3E4A5A] dark:text-gray-300">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!!section.culturalNotes?.length && (
                  <div className="mt-6">
                    <div className="mb-3 text-[14px] font-semibold text-[#16202F] dark:text-white">Cultural context</div>
                    <div className="flex flex-col gap-2.5">
                      {section.culturalNotes.map((note, i) => (
                        <div
                          key={i}
                          className="rounded-r-lg border-l-[3px] px-4 py-3 text-[13.5px] leading-relaxed text-[#16202F] dark:text-gray-200"
                          style={{ borderColor: ACC.light, background: `${ACC.light}12` }}
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => completeSection(topic.id, section.id)}
                  className={`mt-6 flex h-12 items-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors ${
                    done ? 'text-white' : 'border-[1.5px] border-[rgba(20,32,47,0.22)] text-[#16202F] hover:border-[#16202F] dark:border-gray-700 dark:text-gray-200'
                  }`}
                  style={done ? { background: ACC.light } : undefined}
                >
                  {done ? <><Check className="h-4 w-4" /> Read</> : 'Mark as read'}
                </button>
              </div>
            )}

            {tab === 'vocabulary' && section.vocabulary && (
              <div className="grid gap-3 sm:grid-cols-2">
                {section.vocabulary.map((v, i) => (
                  <div key={i} className="kl-well rounded-xl p-4">
                    <div className="font-korean text-[20px] font-bold text-[#16202F] dark:text-white">{v.korean}</div>
                    <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{v.romanization}</div>
                    <div className="mt-1.5 text-[14px] text-[#3E4A5A] dark:text-gray-300">{v.english}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'phrases' && section.phrases && (
              <div className="flex flex-col gap-3">
                {section.phrases.map((p, i) => (
                  <div key={i} className="kl-well rounded-xl p-4">
                    <div className="font-korean text-[19px] font-bold text-[#16202F] dark:text-white">{p.korean}</div>
                    <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{p.romanization}</div>
                    <div className="mt-1.5 text-[14px] text-[#3E4A5A] dark:text-gray-300">{p.english}</div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-[#4A5566] dark:text-gray-500">
                      {p.context && <span>{p.context}</span>}
                      {p.formality && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span style={{ color: ACC.light }}>{p.formality}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'examples' && section.examples && (
              <div className="flex flex-col gap-3">
                {section.examples.map((ex, i) => (
                  <div key={i} className="kl-well rounded-xl p-4">
                    <div className="mb-2 text-[12.5px] font-semibold" style={{ color: ACC.light }}>
                      {ex.situation}
                    </div>
                    <div className="font-korean text-[18px] font-bold text-[#16202F] dark:text-white">{ex.korean}</div>
                    <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">{ex.romanization}</div>
                    <div className="mt-1.5 text-[14px] text-[#3E4A5A] dark:text-gray-300">{ex.english}</div>
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

export default TopicExplorer;
