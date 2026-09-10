import React, { useEffect, useRef, useState } from 'react';

/**
 * The writing section, shown working.
 *
 * A claim with the proof beside it, rather than a video dropped on the page.
 * The steps are driven by the video's own playback, so the words explain the
 * frame you are actually looking at.
 *
 * The recording is 26s and opens with someone using the top navigation to reach
 * the Writing section. That part is cut — a visitor with no account learns
 * nothing from watching a menu, and a menu is the first thing a redesign dates.
 * What is left is the whole argument: a letter is drawn, and the app says what
 * was wrong with it.
 *
 * Trimmed by playback rather than re-encoding, so the original file is intact
 * and the window can be changed by editing two numbers.
 */

/** Seconds into public/demo/writing.mp4. Drawing starts here. */
const CLIP_START = 9;
/** …and the result has finished appearing here. */
const CLIP_END = 23;

/**
 * When the score appears, roughly — this is what moves the highlight from
 * "draw" to "get told". Nudge it if the second step lights up early or late;
 * it is the one value in this file tuned by eye rather than measured.
 */
const RESULT_AT = 19;

/**
 * Fraction of the frame trimmed from the top.
 *
 * The recording carries Supademo's own window bar, which sat inside this
 * component's frame and made two sets of window chrome around one screenshot —
 * wasting height and, worse, shrinking the app itself. Cropping it means the
 * product fills the frame.
 *
 * Measured off the frame by eye, so nudge it if a grey sliver survives at the
 * top or the app's own header gets clipped.
 */
const CROP_TOP = 0.062;

const STEPS = [
  {
    n: '01',
    title: 'Draw the letter',
    body: 'Stroke by stroke, in the order Korean is actually written.',
  },
  {
    n: '02',
    title: 'Find out what you got wrong',
    body: 'Every stroke is checked — order, direction and where it starts.',
  },
];

const WritingDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  }, []);

  // Start at the clip, not at 0 — this also gives the frame something to show
  // before playback, so no poster image is needed.
  const seekToStart = () => {
    const v = videoRef.current;
    if (v) v.currentTime = CLIP_START;
  };

  // Loop the window rather than the file.
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= CLIP_END || v.currentTime < CLIP_START - 0.5) {
      v.currentTime = CLIP_START;
      setActiveStep(0);
      return;
    }
    setActiveStep(v.currentTime >= RESULT_AT ? 1 : 0);
  };

  // Only play while it is on screen. A landing page that plays video the
  // visitor has scrolled past is spending their battery on nothing.
  useEffect(() => {
    if (reduceMotion) return;
    const el = frameRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().then(() => setPlaying(true)).catch(() => {
            // Autoplay can still be refused (data saver, iOS low power). The
            // control below stays available, so this is not an error state.
            setPlaying(false);
          });
        } else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      v.pause();
      setPlaying(false);
    }
  };

  // A desktop screen recording is never going to be legible on a phone, however
  // it is laid out. Fullscreen is the honest answer there — one tap, the app at
  // the size it was recorded.
  const openFullscreen = () => {
    const v = videoRef.current as (HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    }) | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS Safari
  };

  return (
    // The recording is a full 2096px desktop screen. In a side-by-side column
    // it rendered at about 30% scale, where the app's own text — and the tour
    // note inside the recording — stopped being readable. The video takes the
    // full width now and the words sit underneath: nearly twice the scale, for
    // a layout that is no less considered.
    <div className="mt-16">
      {/* ── The claim, first — the recording is the evidence for it ── */}
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#3F8571]">
          Writing, for real
        </span>
        <h3 className="mt-3 text-2xl font-black leading-[1.15] text-gray-900 sm:text-3xl dark:text-white">
          Draw it, and find out what you got wrong.
        </h3>
      </div>

      {/* ── The recording, in a frame so it reads as the product ── */}
      <div
        ref={frameRef}
        className="relative rounded-[18px] border border-[rgba(20,32,47,0.12)] bg-[#FFFCF4] p-2 shadow-[0_18px_50px_-24px_rgba(20,32,47,0.45)] dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Window bar — enough to say "this is the app", not a fake browser. */}
        <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4573F]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#D9A441]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2E6B59]/60" />
          <span className="ml-2 truncate text-[11px] font-medium text-[#4A5566] dark:text-gray-500">
            korean-learn.com — Writing
          </span>
        </div>

        {/* The crop is done by over-sizing the video inside a shorter window,
            so no re-encoding is involved and CROP_TOP stays adjustable. */}
        <div
          className="relative overflow-hidden rounded-[12px] bg-black/5 dark:bg-black/30"
          style={{ aspectRatio: `2096 / ${1080 * (1 - CROP_TOP)}` }}
        >
          <video
            ref={videoRef}
            src="/demo/writing.mp4"
            muted
            playsInline
            preload="metadata"
            controls={reduceMotion}
            onLoadedMetadata={seekToStart}
            onTimeUpdate={onTimeUpdate}
            aria-label="Drawing a Korean letter in K-Learn, and the app scoring each stroke"
            className="absolute left-0 block w-full"
            style={{ top: `${(-CROP_TOP / (1 - CROP_TOP)) * 100}%` }}
          />

          {!reduceMotion && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={openFullscreen}
                aria-label="Open the demo full screen"
                className="flex h-9 items-center rounded-full bg-black/55 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                ⤢ Full screen
              </button>
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pause the demo' : 'Play the demo'}
                className="flex h-9 items-center rounded-full bg-black/55 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                {playing ? '❚❚ Pause' : '▶ Play'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── The steps, still lit by the video's own playback ── */}
      <div className="min-w-0">
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {STEPS.map((step, i) => {
            const on = activeStep === i;
            return (
              <div
                key={step.n}
                className="flex gap-3.5 rounded-[14px] border p-4 transition-colors duration-500"
                style={{
                  borderColor: on ? 'rgba(228,87,63,0.45)' : 'rgba(20,32,47,0.10)',
                  background: on ? 'rgba(228,87,63,0.05)' : 'transparent',
                }}
              >
                <span
                  className="mt-0.5 text-[12px] font-black tabular-nums transition-colors duration-500"
                  style={{ color: on ? '#C13F22' : '#9AA4B2' }}
                >
                  {step.n}
                </span>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-bold text-gray-900 dark:text-white">{step.title}</div>
                  <p className="mt-0.5 text-[13px] leading-[1.55] text-gray-500 dark:text-gray-400">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* The honest detail, and the one worth making: the scoring is real
            geometry, not a model guessing at a picture. */}
        <p className="mx-auto mt-5 max-w-2xl text-center text-[12.5px] leading-[1.6] text-gray-500 dark:text-gray-500">
          Scored on the strokes themselves — their order, direction and starting point — not by
          an AI guessing at a photo. All 40 letters; the 14 basic consonants are free.
        </p>
      </div>
    </div>
  );
};

export default WritingDemo;
