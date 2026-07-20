import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { getStrokes } from '../data/strokeData';
import type { Point } from '../utils/strokePath';

// The practice surface.
//
// It records strokes as POINT LISTS, not just pixels — that's what lets the
// scorer see stroke count, order and direction, none of which survive being
// flattened into an image. Pointer events cover mouse, touch and stylus with one
// code path, and pointer capture keeps a stroke alive if the finger slides off
// the edge mid-draw.

export interface WritingCanvasHandle {
  clear: () => void;
  undo: () => void;
  getStrokes: () => Point[][];
}

interface WritingCanvasProps {
  char: string;
  /** Show the letter faintly behind, for tracing practice. */
  showGuide?: boolean;
  onStrokesChange?: (count: number) => void;
  className?: string;
}

const WritingCanvas = React.forwardRef<WritingCanvasHandle, WritingCanvasProps>(
  ({ char, showGuide = false, onStrokesChange, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<Point[][]>([]);
    const current = useRef<Point[] | null>(null);
    const [, forceRender] = useState(0);
    const data = getStrokes(char);

    // Points are stored in a 0-100 space, matching the reference data, so the
    // score doesn't change with the size of the box on screen.
    const toModel = (e: React.PointerEvent): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    };

    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = Math.max(6, width * 0.055);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--ink') || '#16202F';

      const all = current.current ? [...strokes.current, current.current] : strokes.current;
      all.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        ctx.moveTo((stroke[0].x / 100) * width, (stroke[0].y / 100) * height);
        stroke.slice(1).forEach(p => ctx.lineTo((p.x / 100) * width, (p.y / 100) * height));
        ctx.stroke();
      });
    };

    // Match the backing store to the CSS size so strokes aren't blurry on
    // high-DPI screens, and repaint whatever was already drawn.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        redraw();
      };
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // A new letter means a fresh sheet.
    useEffect(() => {
      strokes.current = [];
      current.current = null;
      redraw();
      onStrokesChange?.(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [char]);

    const start = (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      current.current = [toModel(e)];
    };

    const move = (e: React.PointerEvent) => {
      if (!current.current) return;
      e.preventDefault();
      current.current.push(toModel(e));
      redraw();
    };

    const end = () => {
      if (!current.current) return;
      // A tap with no travel isn't a stroke; keeping it would show up as a
      // spurious extra stroke in the score.
      if (current.current.length > 1) strokes.current.push(current.current);
      current.current = null;
      redraw();
      onStrokesChange?.(strokes.current.length);
      forceRender(n => n + 1);
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        strokes.current = [];
        current.current = null;
        redraw();
        onStrokesChange?.(0);
        forceRender(n => n + 1);
      },
      undo: () => {
        strokes.current.pop();
        redraw();
        onStrokesChange?.(strokes.current.length);
        forceRender(n => n + 1);
      },
      getStrokes: () => strokes.current.map(s => [...s]),
    }));

    return (
      <div className={`relative ${className}`}>
        {/* Guides, and the ghost letter when tracing */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect x="2" y="2" width="96" height="96" rx="6"
            className="fill-none stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.6" />
          <line x1="50" y1="4" x2="50" y2="96"
            className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1="4" y1="50" x2="96" y2="50"
            className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" strokeDasharray="3 3" />
          {showGuide && data?.strokes.map((d, i) => (
            <path key={i} d={d} fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeWidth="9" className="stroke-gray-200/80 dark:stroke-gray-700/60" />
          ))}
        </svg>

        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          className="relative w-full h-full touch-none cursor-crosshair rounded-2xl"
          style={{ ['--ink' as string]: 'currentColor' }}
        />
      </div>
    );
  },
);

WritingCanvas.displayName = 'WritingCanvas';
export default WritingCanvas;
