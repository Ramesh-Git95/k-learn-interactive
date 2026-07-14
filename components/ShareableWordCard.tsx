import React, { useEffect, useRef, useState } from 'react';
import { X, Share2, Download } from 'lucide-react';

// Shareable "Word of the Day" card — draws a branded 1080x1350 (4:5, Instagram
// friendly) image on a canvas with the app's ink/dancheong identity, then
// shares it via the native share sheet (mobile) or downloads a PNG (desktop).
// Pure canvas: no html2canvas or other dependencies.

interface ShareableWord {
  korean: string;
  romanization: string;
  english: string;
  category: string;
}

interface ShareableWordCardProps {
  word: ShareableWord;
  onClose: () => void;
}

const W = 1080;
const H = 1350;

export default function ShareableWordCard({ word, onClose }: ShareableWordCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Make sure the webfonts are usable on the canvas before drawing.
      try {
        await Promise.all([
          document.fonts.load('900 180px "Pretendard Variable"'),
          document.fonts.load('700 58px "General Sans"'),
          document.fonts.load('500 44px "General Sans"'),
        ]);
      } catch { /* fall back to system fonts */ }
      if (cancelled) return;

      // ── Background: ink navy with dancheong glows ──
      ctx.fillStyle = '#0D141F';
      ctx.fillRect(0, 0, W, H);

      const glow = (x: number, y: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(13,20,31,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      };
      glow(W * 0.88, H * 0.10, 520, 'rgba(228,87,46,0.28)');
      glow(W * 0.08, H * 0.92, 560, 'rgba(63,133,113,0.24)');
      glow(W * 0.15, H * 0.15, 380, 'rgba(47,93,138,0.18)');

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // ── Label ──
      try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '12px'; } catch { /* older browsers */ }
      ctx.fillStyle = '#D9A441';
      ctx.font = '800 34px "General Sans", sans-serif';
      ctx.fillText('WORD OF THE DAY', W / 2, 215);
      try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'; } catch { /* noop */ }

      // ── Korean word (fitted, gradient fill) ──
      let size = 190;
      ctx.font = `900 ${size}px "Pretendard Variable", "Noto Sans KR", sans-serif`;
      while (ctx.measureText(word.korean).width > W * 0.86 && size > 64) {
        size -= 10;
        ctx.font = `900 ${size}px "Pretendard Variable", "Noto Sans KR", sans-serif`;
      }
      const grad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
      grad.addColorStop(0, '#F07A55');
      grad.addColorStop(0.55, '#E4572E');
      grad.addColorStop(1, '#D9A441');
      ctx.fillStyle = grad;
      ctx.fillText(word.korean, W / 2, 590);

      // ── Romanization ──
      ctx.fillStyle = '#8B94A3';
      ctx.font = 'italic 500 46px "General Sans", sans-serif';
      ctx.fillText(`/ ${word.romanization} /`, W / 2, 690);

      // ── English meaning ──
      ctx.fillStyle = '#FAF5EB';
      ctx.font = '700 60px "General Sans", sans-serif';
      ctx.fillText(word.english, W / 2, 810);

      // ── Category chip ──
      ctx.font = '700 30px "General Sans", sans-serif';
      const chipText = word.category.toUpperCase();
      const chipW = ctx.measureText(chipText).width + 72;
      const chipH = 62;
      const chipX = (W - chipW) / 2;
      const chipY = 866;
      ctx.fillStyle = 'rgba(63,133,113,0.20)';
      ctx.strokeStyle = 'rgba(63,133,113,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(chipX, chipY, chipW, chipH, 31);
      else ctx.rect(chipX, chipY, chipW, chipH);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7FC0AC';
      ctx.fillText(chipText, W / 2, chipY + 42);

      // ── Divider ──
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.34, 1090);
      ctx.lineTo(W * 0.66, 1090);
      ctx.stroke();

      // ── Footer branding: 한 tile + wordmark ──
      const tile = 84;
      const tileX = (W - tile) / 2;
      const tileY = 1130;
      const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX + tile, tileY + tile);
      tileGrad.addColorStop(0, '#E4572E');
      tileGrad.addColorStop(1, '#8E3B54');
      ctx.fillStyle = tileGrad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(tileX, tileY, tile, tile, 22);
      else ctx.rect(tileX, tileY, tile, tile);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 46px "Pretendard Variable", "Noto Sans KR", sans-serif';
      ctx.fillText('한', W / 2, tileY + 60);

      ctx.fillStyle = '#8B94A3';
      ctx.font = '600 32px "General Sans", sans-serif';
      ctx.fillText('Learn Korean · korean-learn.com', W / 2, 1288);

      if (!cancelled) setReady(true);
    };

    draw();
    return () => { cancelled = true; };
  }, [word]);

  const toBlob = () =>
    new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/png'));

  const handleDownload = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k-learn-word-of-the-day.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], 'k-learn-word-of-the-day.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Korean Word of the Day',
          text: `${word.korean} — ${word.english} · Learn Korean at korean-learn.com 🇰🇷`,
        });
      } catch { /* user dismissed the share sheet */ }
    } else {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900 dark:text-white">📤 Share today's word</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`w-full h-auto rounded-2xl shadow-lg transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
          aria-label={`Word of the day card: ${word.korean} — ${word.english}`}
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleShare}
            disabled={!ready}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black btn-brand disabled:opacity-40"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={handleDownload}
            disabled={!ready}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#E4572E] hover:text-[#E4572E] transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3">
          Perfect for Instagram stories · tag your study buddy 🇰🇷
        </p>
      </div>
    </div>
  );
}
