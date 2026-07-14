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
}

export default function StudyHeatmap({ currentStreak, longestStreak }: StudyHeatmapProps) {
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-base font-black text-gray-900 dark:text-white">📈 Study Activity</h2>
        <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
          <span>🔥 {currentStreak} day streak</span>
          <span>🏆 {longestStreak} best</span>
          <span className="hidden sm:inline">✅ {totalDays} days studied</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div key={i} className="w-[11px] text-[9px] leading-none text-gray-400 dark:text-gray-600 overflow-visible whitespace-nowrap">
                {m}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] w-7 mr-1 text-[9px] leading-[11px] text-gray-400 dark:text-gray-600">
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
                        ? 'bg-[#E4572E]'
                        : cell.state === 'today'
                        ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-[#E4572E]'
                        : cell.state === 'future'
                        ? 'invisible'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
        Every square is a day — study anything to fill today's square. 조금씩 나아가요! 🌱
      </p>
    </div>
  );
}
