// A tiny SVG-path sampler — the bridge between the stroke data and everything
// that uses it.
//
// Stroke reference data is authored as SVG path strings so the browser can
// animate it natively (stroke-dasharray/dashoffset) with no library. But scoring
// needs those same paths as POINTS, and it has to run in tests where there is no
// DOM, so `path.getPointAtLength()` isn't available. Hence this: a pure sampler
// over the small subset of path syntax the stroke data actually uses — M, L and
// C. Nothing here touches the DOM.

export interface Point { x: number; y: number; }

type Seg =
  | { kind: 'line'; a: Point; b: Point }
  | { kind: 'cubic'; a: Point; c1: Point; c2: Point; b: Point };

const dist = (p: Point, q: Point) => Math.hypot(q.x - p.x, q.y - p.y);

function cubicAt(s: Extract<Seg, { kind: 'cubic' }>, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return {
    x: w0 * s.a.x + w1 * s.c1.x + w2 * s.c2.x + w3 * s.b.x,
    y: w0 * s.a.y + w1 * s.c1.y + w2 * s.c2.y + w3 * s.b.y,
  };
}

/** Point at parameter t (0..1) along a segment. */
function segAt(s: Seg, t: number): Point {
  if (s.kind === 'line') {
    return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
  }
  return cubicAt(s, t);
}

/** Curves are measured by flattening; 16 slices is well past visually exact at our scale. */
function segLength(s: Seg): number {
  if (s.kind === 'line') return dist(s.a, s.b);
  let total = 0;
  let prev = s.a;
  for (let i = 1; i <= 16; i++) {
    const p = cubicAt(s, i / 16);
    total += dist(prev, p);
    prev = p;
  }
  return total;
}

/** Parse the M/L/C subset. Absolute commands only — that's all the data uses. */
export function parsePath(d: string): Seg[] {
  const tokens = d.match(/[MLC]|-?\d*\.?\d+/g) ?? [];
  const segs: Seg[] = [];
  let cursor: Point = { x: 0, y: 0 };
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    const num = () => parseFloat(tokens[i++]);

    if (cmd === 'M') {
      cursor = { x: num(), y: num() };
    } else if (cmd === 'L') {
      const b = { x: num(), y: num() };
      segs.push({ kind: 'line', a: cursor, b });
      cursor = b;
    } else if (cmd === 'C') {
      const c1 = { x: num(), y: num() };
      const c2 = { x: num(), y: num() };
      const b = { x: num(), y: num() };
      segs.push({ kind: 'cubic', a: cursor, c1, c2, b });
      cursor = b;
    }
    // Anything else is unsupported by design — the data never emits it.
  }
  return segs;
}

/** Total length of a path, in the path's own units. */
export function pathLength(d: string): number {
  return parsePath(d).reduce((sum, s) => sum + segLength(s), 0);
}

/**
 * Resample a path to exactly `count` points spaced evenly along its LENGTH.
 *
 * Even spacing is what makes two strokes comparable: a user's stroke and the
 * reference have different point counts and wildly different sampling rates, but
 * after this they're both N points describing the same journey, so they can be
 * compared position by position.
 */
export function samplePath(d: string, count = 32): Point[] {
  const segs = parsePath(d);
  if (segs.length === 0) return [];

  const lengths = segs.map(segLength);
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total === 0) return Array.from({ length: count }, () => segAt(segs[0], 0));

  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    let acc = 0;
    let placed = false;
    for (let s = 0; s < segs.length; s++) {
      if (acc + lengths[s] >= target || s === segs.length - 1) {
        const t = lengths[s] === 0 ? 0 : Math.min(1, (target - acc) / lengths[s]);
        out.push(segAt(segs[s], t));
        placed = true;
        break;
      }
      acc += lengths[s];
    }
    if (!placed) out.push(segAt(segs[segs.length - 1], 1));
  }
  return out;
}

/**
 * Resample a raw drawn polyline (what the canvas records) the same way, so it
 * lines up with a sampled reference path.
 */
export function resamplePoints(points: Point[], count = 32): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: count }, () => points[0]);

  const segLengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = dist(points[i - 1], points[i]);
    segLengths.push(l);
    total += l;
  }
  // A "stroke" that never moved (a tap) has no direction to compare — hand back
  // the single position rather than dividing by zero.
  if (total === 0) return Array.from({ length: count }, () => points[0]);

  const out: Point[] = [];
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    let acc = 0;
    let placed = false;
    for (let s = 0; s < segLengths.length; s++) {
      if (acc + segLengths[s] >= target) {
        const t = segLengths[s] === 0 ? 0 : (target - acc) / segLengths[s];
        out.push({
          x: points[s].x + (points[s + 1].x - points[s].x) * t,
          y: points[s].y + (points[s + 1].y - points[s].y) * t,
        });
        placed = true;
        break;
      }
      acc += segLengths[s];
    }
    if (!placed) out.push(points[points.length - 1]);
  }
  return out;
}
