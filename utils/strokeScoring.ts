// Grading handwritten Hangul, locally.
//
// The naive build sends a canvas image to an AI and asks "is this right?". That
// throws away the two things that actually matter: a ㄱ drawn bottom-up is
// pixel-identical to a correct one but wrong, and an image can't show stroke
// ORDER at all. So the canvas records strokes as point lists, and this compares
// them against the reference stroke-for-stroke.
//
// Everything here is pure maths: instant, free, offline, and — unlike a vision
// model on a rough sketch — it can't cheerfully approve a scribble.

import { samplePath, resamplePoints, type Point } from './strokePath';
import { getStrokes } from '../data/strokeData';

const SAMPLES = 32; // points each stroke is resampled to before comparing

export interface StrokeMark {
  index: number;
  /** Shape agreement after alignment, 0-1. */
  shape: number;
  /** True when the stroke was drawn the right way along its path. */
  directionOk: boolean;
}

export interface WritingResult {
  score: number;              // 0-100 overall
  verdict: 'excellent' | 'good' | 'close' | 'try-again';
  strokeCountOk: boolean;
  expectedStrokes: number;
  actualStrokes: number;
  marks: StrokeMark[];
  /** Ordered, human feedback — the most useful correction first. */
  notes: string[];
}

/** Bounding box of every point, used to normalise size and position out. */
function bounds(points: Point[]) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * Scale a drawing into the same 0-100 box the reference lives in.
 *
 * Normalising the WHOLE character rather than each stroke is deliberate: it
 * keeps the strokes' relative positions and sizes meaningful, so writing ㅏ's
 * short stroke far too long is still penalised. The aspect ratio is preserved
 * for the same reason — squashing each stroke to fit would forgive real errors.
 */
function normalise(strokes: Point[][]): Point[][] {
  const all = strokes.flat();
  if (all.length === 0) return strokes;

  const b = bounds(all);
  const w = b.maxX - b.minX, h = b.maxY - b.minY;
  const span = Math.max(w, h);
  if (span === 0) return strokes;

  // Centre the drawing in the box, then scale by the longer side.
  const scale = 84 / span;
  const offX = (100 - w * scale) / 2, offY = (100 - h * scale) / 2;
  return strokes.map(s => s.map(p => ({
    x: (p.x - b.minX) * scale + offX,
    y: (p.y - b.minY) * scale + offY,
  })));
}

/** Mean point distance between two equal-length point lists, as a 0-1 score. */
function similarity(a: Point[], b: Point[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  const avg = sum / a.length;
  // ~30 units of average drift is a total miss; 0 is perfect.
  return Math.max(0, 1 - avg / 30);
}

/**
 * Grade a drawing.
 *
 * @param char     the character being practised
 * @param drawn    strokes as recorded by the canvas, in drawing order
 */
export function scoreWriting(char: string, drawn: Point[][]): WritingResult | null {
  const ref = getStrokes(char);
  if (!ref) return null;

  // Taps and accidental dots aren't strokes; dropping them stops a stray finger
  // press from being marked as a wrong extra stroke.
  const strokes = drawn.filter(s => s.length > 1);

  const expectedStrokes = ref.strokes.length;
  const actualStrokes = strokes.length;
  const strokeCountOk = expectedStrokes === actualStrokes;

  if (actualStrokes === 0) {
    return {
      score: 0, verdict: 'try-again', strokeCountOk: false,
      expectedStrokes, actualStrokes: 0, marks: [],
      notes: ['Nothing drawn yet — trace the letter in the box.'],
    };
  }

  // BOTH sides go through the same normalisation. Comparing a normalised
  // drawing against the raw reference would misalign every stroke, because the
  // authored paths don't fill the 0-100 box — a flawless trace would score ~50.
  const refSampled = normalise(ref.strokes.map(d => samplePath(d, SAMPLES)));
  const userSampled = normalise(strokes).map(s => resamplePoints(s, SAMPLES));

  // Compare only as many strokes as both have; extras are handled by the
  // stroke-count penalty rather than being silently ignored.
  const pairs = Math.min(refSampled.length, userSampled.length);
  const marks: StrokeMark[] = [];

  for (let i = 0; i < pairs; i++) {
    const forward = similarity(userSampled[i], refSampled[i]);
    // The same stroke drawn backwards matches the REVERSED reference. Comparing
    // both tells shape apart from direction: a good shape drawn the wrong way
    // scores well reversed, which is precisely the mistake worth naming.
    const backward = similarity([...userSampled[i]].reverse(), refSampled[i]);
    marks.push({
      index: i,
      shape: Math.max(forward, backward),
      directionOk: forward >= backward,
    });
  }

  const shapeAvg = marks.reduce((s, m) => s + m.shape, 0) / marks.length;
  const wrongWay = marks.filter(m => !m.directionOk).length;

  // Shape carries the grade; direction and stroke count are correctness gates
  // that pull it down, because they're the things a picture-based check misses.
  let score = shapeAvg * 100;
  if (!strokeCountOk) score *= 0.6;
  score *= 1 - 0.2 * (wrongWay / marks.length);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const notes: string[] = [];
  if (!strokeCountOk) {
    notes.push(actualStrokes > expectedStrokes
      ? `That's ${actualStrokes} strokes — ${char} takes ${expectedStrokes}. Try not to lift the pen mid-stroke.`
      : `That's ${actualStrokes} stroke${actualStrokes === 1 ? '' : 's'} — ${char} takes ${expectedStrokes}.`);
  }
  marks.filter(m => !m.directionOk).forEach(m => {
    notes.push(`Stroke ${m.index + 1} was drawn backwards — Korean goes left-to-right and top-to-bottom.`);
  });
  const worst = [...marks].sort((a, b) => a.shape - b.shape)[0];
  if (worst && worst.shape < 0.6 && marks.length > 1) {
    notes.push(`Stroke ${worst.index + 1} is the one to work on — watch where it starts and ends.`);
  }

  const verdict: WritingResult['verdict'] =
    score >= 88 ? 'excellent' : score >= 72 ? 'good' : score >= 50 ? 'close' : 'try-again';

  if (notes.length === 0) {
    notes.push(verdict === 'excellent' ? '완벽해요! Stroke order, direction and shape all correct.'
                                       : 'Right order and direction — keep tightening the shape.');
  }

  return { score, verdict, strokeCountOk, expectedStrokes, actualStrokes, marks, notes };
}
