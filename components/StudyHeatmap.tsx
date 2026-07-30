import React from 'react';
import { getStreakData, todayISO } from '../utils/xpStreak';

// GitHub-style study activity heatmap. Fed by the streak engine's rolling
// 180-day studyDates log (localStorage), so it fills in as the user studies —
// days before the log existed simply render as empty.
const WEEKS = 26;

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type CellState = 'studied' | 'empty' | 'today' | 'future';

interface StudyHeatmapProps {
  currentStreak: number;
  longestStreak: number;
  /** Merged dashboard stats (absorbed the old 4-card stat row) */
  streakAtRisk?: boolean;
  completed?: number;
  srsDue?: number;
  bookmarks?: number;
  onReview?: () => void;
  onBookmarks?: () => void;
}

export default function StudyHeatmap({
  currentStreak, longestStreak, streakAtRisk, completed, srsDue, bookmarks, onReview, onBookmarks,
}: StudyHeatmapProps) {
  const studied = new Set(getStreakData().studyDates);
  const todayStr = todayISO();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start WEEKS back, snapped to a Sunday so columns align to calendar weeks.
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const columns: { ds: string; state: CellState }[][] = [];
  const monthLabels: string[] = [];
  const cursor = new Date(start);
  let prevMonth = -1;

  while (cursor <= today) {
    const week: { ds: string; state: CellState }[] = [];
    // Label a column with its month when the month changes at that column.
    const colMonth = cursor.getMonth();
    monthLabels.push(colMonth !== prevMonth ? cursor.toLocaleString('en', { month: 'short' }) : '');
    prevMonth = colMonth;

    for (let d = 0; d < 7; d++) {
      const ds = toISO(cursor);
      const state: CellState = cursor > today
        ? 'future'
        : studied.has(ds)
        ? 'studied'
        : ds === todayStr
        ? 'today'
        : 'empty';
      week.push({ ds, state });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(week);
  }

  const totalDays = studied.size;

  return (
    <div className="kl-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#16202F] dark:text-white">Study activity</h2>
        {streakAtRisk && (
          <span className="text-[12px] font-semibold text-[#C13F22] dark:text-[#F07A55]">
            Study today to keep your streak
          </span>
        )}
      </div>

      {/* Stat row — numbers lead, labels underneath (the mockup's data shape) */}
      <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[
          { v: currentStreak, l: currentStreak === 1 ? 'day streak' : 'days streak' },
          { v: longestStreak, l: 'longest' },
          { v: totalDays, l: 'days studied' },
          ...(typeof completed === 'number' ? [{ v: completed, l: 'items done' }] : []),
        ].map((s, i) => (
          <div key={i} className="kl-well rounded-xl px-3 py-2.5">
            <div className="text-[19px] font-bold leading-none text-[#16202F] dark:text-white">{s.v}</div>
            <div className="mt-1.5 text-[12px] text-[#4A5566] dark:text-gray-500">{s.l}</div>
          </div>
        ))}
        {typeof srsDue === 'number' && onReview && (
          <button
            onClick={onReview}
            className="rounded-xl px-3 py-2.5 text-left transition-colors"
            style={
              srsDue > 0
                ? { background: 'rgba(46,107,89,0.12)', border: '1px solid rgba(46,107,89,0.32)' }
                : { background: 'rgba(20,32,47,0.035)', border: '1px solid rgba(20,32,47,0.10)' }
            }
          >
            <div
              className="text-[19px] font-bold leading-none"
              style={{ color: srsDue > 0 ? '#2E6B59' : undefined }}
            >
              <span className={srsDue > 0 ? '' : 'text-[#16202F] dark:text-white'}>{srsDue}</span>
            </div>
            <div className="mt-1.5 text-[12px] text-[#4A5566] dark:text-gray-500">
              {srsDue > 0 ? 'due · review →' : 'due now'}
            </div>
          </button>
        )}
      </div>

      {typeof bookmarks === 'number' && onBookmarks && bookmarks > 0 && (
        <button
          onClick={onBookmarks}
          className="mb-4 text-[12.5px] font-semibold text-[#2E6B59] hover:underline dark:text-[#5FB89B]"
        >
          {bookmarks} saved {bookmarks === 1 ? 'word' : 'words'} · study as flashcards →
        </button>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div key={i} className="w-[11px] text-[10px] leading-none text-[#4A5566] dark:text-gray-500 overflow-visible whitespace-nowrap">
                {m}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] w-7 mr-1 text-[10px] leading-[11px] text-[#4A5566] dark:text-gray-500">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((l, i) => (
                <div key={i} className="h-[11px]">{l}</div>
              ))}
            </div>

            {/* Week columns */}
            {columns.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map(cell => (
                  <div
                    key={cell.ds}
                    title={cell.state === 'future' ? undefined : `${cell.ds}${cell.state === 'studied' ? ' · studied ✓' : ''}`}
                    className={`w-[11px] h-[11px] rounded-[3px] ${
                      cell.state === 'studied'
                        ? 'bg-[#C13F22]'
                        : cell.state === 'today'
                        ? 'bg-[rgba(20,32,47,0.06)] dark:bg-gray-800 ring-1 ring-[#C13F22]'
                        : cell.state === 'future'
                        ? 'invisible'
                        : 'bg-[rgba(20,32,47,0.06)] dark:bg-gray-800'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#4A5566] dark:text-gray-500">
        Every square is a day — study anything to fill today's.
      </p>
    </div>
  );
}
