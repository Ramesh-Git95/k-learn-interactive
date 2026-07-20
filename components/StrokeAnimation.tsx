import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getStrokes } from '../data/strokeData';
import { pathLength } from '../utils/strokePath';

// Watches a letter write itself, one stroke at a time.
//
// Each stroke is an SVG path revealed by animating stroke-dashoffset from its
// full length down to zero — the whole effect is native, so there's no library
// and nothing to load. Timing is driven by requestAnimationFrame rather than CSS
// transitions: the sequence needs to know exactly which stroke is mid-draw so
// the numbered badge can appear with it, and chained CSS transitions make that
// racy.

interface StrokeAnimationProps {
  char: string;
  /** Faint reference underneath, for tracing. */
  showGhost?: boolean;
  showNumbers?: boolean;
  className?: string;
}

const MS_PER_UNIT = 7;    // draw speed, per unit of path length
const MIN_STROKE_MS = 380;
const GAP_MS = 260;       // pause between strokes — where the eye catches up

export interface StrokeAnimationHandle {
  play: (slow?: boolean) => void;
}

const StrokeAnimation = React.forwardRef<StrokeAnimationHandle, StrokeAnimationProps>(
  ({ char, showGhost = true, showNumbers = true, className = '' }, ref) => {
    const data = useMemo(() => getStrokes(char), [char]);
    const lengths = useMemo(() => data?.strokes.map(pathLength) ?? [], [data]);

    // How much of each stroke is drawn, 0..1.
    const [drawn, setDrawn] = useState<number[]>([]);
    const [activeStroke, setActiveStroke] = useState<number | null>(null);
    const raf = useRef<number | null>(null);

    const stop = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    const play = (slow = false) => {
      if (!data) return;
      stop();
      const rate = slow ? 2.2 : 1;
      const durations = lengths.map(l => Math.max(MIN_STROKE_MS, l * MS_PER_UNIT) * rate);
      const gap = GAP_MS * rate;
      const start = performance.now();

      setDrawn(new Array(data.strokes.length).fill(0));
      setActiveStroke(0);

      const tick = (now: number) => {
        const elapsed = now - start;
        const next = new Array(data.strokes.length).fill(0);
        let cursor = 0;
        let current: number | null = null;

        for (let i = 0; i < durations.length; i++) {
          const strokeStart = cursor;
          const strokeEnd = cursor + durations[i];
          if (elapsed >= strokeEnd) next[i] = 1;
          else if (elapsed >= strokeStart) {
            next[i] = (elapsed - strokeStart) / durations[i];
            current = i;
          } else next[i] = 0;
          cursor = strokeEnd + gap;
        }

        setDrawn(next);
        setActiveStroke(current);

        if (elapsed < cursor) raf.current = requestAnimationFrame(tick);
        else { raf.current = null; setActiveStroke(null); }
      };

      raf.current = requestAnimationFrame(tick);
    };

    React.useImperativeHandle(ref, () => ({ play }));

    // Autoplay on mount and whenever the letter changes.
    useEffect(() => {
      const t = setTimeout(() => play(), 180);
      return () => { clearTimeout(t); stop(); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [char]);

    if (!data) {
      return (
        <div className={`flex items-center justify-center text-gray-400 text-sm ${className}`}>
          No stroke guide for this letter yet.
        </div>
      );
    }

    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`How to write ${char}`}>
        {/* Writing guides — the quartered box Korean is practised in */}
        <rect x="2" y="2" width="96" height="96" rx="6"
          className="fill-none stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.6" />
        <line x1="50" y1="4" x2="50" y2="96"
          className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1="4" y1="50" x2="96" y2="50"
          className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Ghost of the finished letter */}
        {showGhost && data.strokes.map((d, i) => (
          <path key={`ghost-${i}`} d={d} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeWidth="9" className="stroke-gray-100 dark:stroke-gray-800" />
        ))}

        {/* The strokes as they're drawn */}
        {data.strokes.map((d, i) => {
          const len = lengths[i] || 1;
          const amount = drawn[i] ?? 0;
          return (
            <path
              key={i} d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9"
              stroke={i === activeStroke ? '#E4572E' : '#16202F'}
              className={i === activeStroke ? '' : 'dark:stroke-white'}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - amount)}
            />
          );
        })}

        {/* Numbered start markers, revealed as each stroke begins */}
        {showNumbers && data.strokes.map((d, i) => {
          if ((drawn[i] ?? 0) <= 0) return null;
          const m = d.match(/M\s*(-?[\d.]+)\s+(-?[\d.]+)/);
          if (!m) return null;
          const cx = parseFloat(m[1]), cy = parseFloat(m[2]);
          return (
            <g key={`n-${i}`} className="pointer-events-none">
              <circle cx={cx} cy={cy} r="7" fill={i === activeStroke ? '#E4572E' : '#D9A441'} opacity="0.95" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize="8" fontWeight="900" fill="white">{i + 1}</text>
            </g>
          );
        })}
      </svg>
    );
  },
);

StrokeAnimation.displayName = 'StrokeAnimation';
export default StrokeAnimation;
