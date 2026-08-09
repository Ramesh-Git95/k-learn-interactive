// Support for the writing screen: saying out loud what each stroke does, and
// showing where the letter turns up in words the learner already has.
//
// Both are DERIVED from data we already ship rather than written by hand. The
// stroke prose comes from the same paths the animation draws and the scorer
// marks against, so it cannot drift out of step with them — if a letter's
// stroke data is ever corrected, its description corrects itself.

import { getStrokes } from '../data/strokeData';
import { vocabulary } from '../data/koreanData';
import { jamoOf } from './pronunciation';

// ── Describing a stroke ───────────────────────────────────────────────────────

interface Pt { x: number; y: number }

// The paths use only M, L and C. Take the anchor points: where the pen lands,
// and where it changes direction or ends.
function anchors(d: string): { points: Pt[]; curved: boolean } {
  const points: Pt[] = [];
  let curved = false;
  const tokens: string[] = d.match(/[MLC][^MLC]*/g) ?? [];
  tokens.forEach(t => {
    const cmd = t[0];
    const n = (t.slice(1).match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    if (cmd === 'C') {
      curved = true;
      // Only the endpoint of a cubic is an anchor; the two control points are not
      // places the pen visibly turns.
      for (let i = 0; i + 5 < n.length; i += 6) points.push({ x: n[i + 4], y: n[i + 5] });
    } else {
      for (let i = 0; i + 1 < n.length; i += 2) points.push({ x: n[i], y: n[i + 1] });
    }
  });
  return { points, curved };
}

// y grows downwards in the 0-100 box, so a positive dy means the pen moves down.
//
// Length matters as much as direction. The tick on ㅏ and the full base of ㅁ
// are both horizontal, but calling the tick "along the middle" would describe a
// line right across the box — which is not what the hand should do. In the data
// a short stroke runs about 34 units against 72 or more for a full one, so 40
// separates them cleanly.
const SHORT = 40;

function describeSegment(a: Pt, b: Pt): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (ay <= ax * 0.3) {
    if (ax < SHORT) return `a short stroke to the ${dx >= 0 ? 'right' : 'left'}`;
    const where = a.y < 35 ? 'along the top' : a.y > 65 ? 'along the bottom' : 'across the middle';
    return dx >= 0 ? where : `${where}, right to left`;
  }
  if (ax <= ay * 0.3) {
    const mid = (a.x + b.x) / 2;
    if (ay < SHORT) {
      const side = mid < 40 ? ' on the left' : mid > 60 ? ' on the right' : '';
      return `a short stroke ${dy >= 0 ? 'down' : 'up'}${side}`;
    }
    const where = mid < 40 ? 'down the left side' : mid > 60 ? 'down the right side' : 'straight down';
    return dy >= 0 ? where : `${where.replace('down', 'up')}, bottom to top`;
  }
  const vertical = dy >= 0 ? 'down' : 'up';
  return `${vertical} to the ${dx >= 0 ? 'right' : 'left'}`;
}

/** One plain-English line per stroke, in writing order. */
export function describeStrokes(char: string): string[] {
  const data = getStrokes(char);
  if (!data) return [];

  return data.strokes.map(d => {
    const { points, curved } = anchors(d);
    if (points.length < 2) return 'a single mark';

    const start = points[0];
    const end = points[points.length - 1];
    const closed = curved && Math.hypot(end.x - start.x, end.y - start.y) < 6;
    if (closed) return 'one continuous circle, starting at the top';
    if (curved) return 'a curve, following the shape round';

    const parts: string[] = [];
    for (let i = 1; i < points.length; i++) {
      const seg = describeSegment(points[i - 1], points[i]);
      if (seg !== parts[parts.length - 1]) parts.push(seg);
    }
    return parts.join(', then ');
  });
}

// ── Where the letter turns up ─────────────────────────────────────────────────

export interface ExampleWord {
  korean: string;
  romanization: string;
  english: string;
}

// Built once, on first use. Every vocabulary word is decomposed to its jamo, so
// a letter's examples are genuinely words containing it — including as a final
// consonant or inside a compound vowel.
let index: Map<string, ExampleWord[]> | null = null;

function buildIndex(): Map<string, ExampleWord[]> {
  const map = new Map<string, ExampleWord[]>();
  vocabulary.forEach(cat =>
    cat.items.forEach(item => {
      const seen = new Set(jamoOf(item.korean));
      seen.forEach(j => {
        const list = map.get(j) ?? [];
        // Short words first: 엄마 teaches ㅁ better than 감사합니다 does.
        list.push({ korean: item.korean, romanization: item.romanization, english: item.english });
        map.set(j, list);
      });
    }),
  );
  map.forEach(list => list.sort((a, b) => a.korean.length - b.korean.length));
  return map;
}

export function exampleWordsFor(jamo: string, limit = 3): ExampleWord[] {
  if (!index) index = buildIndex();
  return (index.get(jamo) ?? []).slice(0, limit);
}
