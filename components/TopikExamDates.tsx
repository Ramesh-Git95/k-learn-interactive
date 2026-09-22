import React from 'react';
import {
  upcomingSittings,
  scheduleIsExhausted,
  koreaRegistrationOpen,
  daysUntil,
  localDate,
  SCHEDULE_VERIFIED_ON,
  OFFICIAL_URL,
  type TopikSitting,
} from '../data/topikSchedule';

// The real exam dates, next one first.
//
// Preparation without a date is open-ended, and open-ended study is what people
// abandon. A visible countdown turns "I should get to level 3 eventually" into
// "there is a paper on 15 November".
//
// The honesty rules this screen follows:
//   · the verification date is printed, so nobody has to trust it blindly
//   · registration windows say "in Korea", because overseas centres set their own
//   · when the listed sittings run out it says so and points at the official
//     site, rather than quietly showing nothing or, worse, last year's dates
// A wrong date here costs someone a real exam fee and months of planning.

const KIND_LABEL: Record<TopikSitting['kind'], string> = {
  PBT: 'Paper',
  IBT: 'Online',
  Speaking: 'Speaking',
};

const KIND_COLOR: Record<TopikSitting['kind'], string> = {
  PBT: '#2F5D8A',
  IBT: '#2E6B59',
  Speaking: '#8E3B54',
};

const fmt = (iso: string) =>
  localDate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const fmtLong = (iso: string) =>
  localDate(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

const countdown = (days: number) =>
  days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;

interface Props {
  /** Show only the next N sittings. Omit for all of them. */
  limit?: number;
  /**
   * 'compact' is one line naming the next sitting — for the landing page, where
   * a table of exam rounds reads as homework to someone who came for K-drama.
   * It renders nothing at all once the schedule runs out: a marketing page is
   * the wrong place to explain that we are between published schedules.
   */
  variant?: 'full' | 'compact';
  className?: string;
}

const TopikExamDates: React.FC<Props> = ({ limit, variant = 'full', className = '' }) => {
  const now = new Date();
  const all = upcomingSittings(now);
  const sittings = limit ? all.slice(0, limit) : all;

  if (variant === 'compact') {
    const next = all[0];
    if (!next) return null;
    const days = daysUntil(next.testDate, now);

    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center ${className}`}>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white"
          style={{ background: KIND_COLOR[next.kind] }}
        >
          {KIND_LABEL[next.kind]}
        </span>
        <span className="text-[13.5px] font-semibold text-gray-900 dark:text-white">
          Next TOPIK: {fmtLong(next.testDate)}
        </span>
        <span className="text-[13px] text-gray-500 dark:text-gray-400">
          {days > 0 ? `${days} days away` : countdown(days)}
        </span>
        <a
          href={OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12.5px] font-semibold text-[#C13F22] transition-opacity hover:opacity-70 dark:text-[#F5825E]"
        >
          official site →
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[#16202F] dark:text-white">Upcoming TOPIK dates</h3>
        <a
          href={OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold text-[#C13F22] transition-opacity hover:opacity-70 dark:text-[#F5825E]"
        >
          topik.go.kr →
        </a>
      </div>

      {scheduleIsExhausted(now) ? (
        // Not an error state — the schedule is published a year at a time, so
        // running out is expected. Saying nothing, or leaving last year's dates
        // on screen, is what would mislead.
        <div className="rounded-[14px] border border-[rgba(20,32,47,0.14)] bg-[#FFFCF4] px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[13.5px] leading-[1.55] text-[#3E4A5A] dark:text-gray-400">
            We do not have confirmed dates beyond this point. The schedule is published a year at a
            time — check the official site for the next one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sittings.map(s => {
            const days = daysUntil(s.testDate, now);
            const regOpen = koreaRegistrationOpen(s, now);
            const regClosed =
              s.koreaRegistration && daysUntil(s.koreaRegistration.to, now) < 0;

            return (
              <div
                key={`${s.kind}-${s.round}`}
                className="flex items-center gap-3.5 rounded-[14px] border border-[rgba(20,32,47,0.12)] bg-[#FFFCF4] px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex-none text-center" style={{ minWidth: 54 }}>
                  <div className="text-[17px] font-bold leading-none text-[#16202F] dark:text-white">
                    {localDate(s.testDate).getDate()}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#4A5566] dark:text-gray-500">
                    {localDate(s.testDate).toLocaleDateString(undefined, { month: 'short' })}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white"
                      style={{ background: KIND_COLOR[s.kind] }}
                    >
                      {KIND_LABEL[s.kind]}
                    </span>
                    <span className="text-[13.5px] font-semibold text-[#16202F] dark:text-white">
                      Round {s.round}
                    </span>
                    <span className="text-[12.5px] text-[#4A5566] dark:text-gray-500">
                      {countdown(days)}
                    </span>
                  </div>

                  <div className="mt-1 text-[12.5px] text-[#4A5566] dark:text-gray-500">
                    {s.testDateEnd ? `${fmt(s.testDate)} – ${fmtLong(s.testDateEnd)}` : fmtLong(s.testDate)}
                  </div>

                  {s.koreaRegistration && (
                    <div className="mt-1 text-[12px] text-[#4A5566] dark:text-gray-500">
                      {regOpen ? (
                        <span className="font-semibold" style={{ color: '#2E6B59' }}>
                          Registration open in Korea until {fmt(s.koreaRegistration.to)}
                        </span>
                      ) : regClosed ? (
                        <span>Registration in Korea closed {fmt(s.koreaRegistration.to)}</span>
                      ) : (
                        <span>
                          Registration in Korea {fmt(s.koreaRegistration.from)} – {fmt(s.koreaRegistration.to)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-2.5 text-[11.5px] leading-[1.5] text-[#4A5566] dark:text-gray-500">
        Registration dates shown are for tests taken in Korea; overseas centres set their own, so
        check yours. Checked {localDate(SCHEDULE_VERIFIED_ON).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} — always confirm on the official site before you plan around it.
      </p>
    </div>
  );
};

export default TopikExamDates;
