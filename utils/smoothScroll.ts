// A calmer scroll than the browser's native `behavior: 'smooth'`.
//
// The native one is quick and lands abruptly, which reads as a jump-cut: the
// content you were reading vanishes and something else is suddenly there. This
// eases in and out over a duration that scales with the distance travelled, so
// the eye can follow the page moving and keep its bearings.

interface Options {
  /** Pixels to leave above the element (clears the sticky header). */
  offset?: number;
}

// Slow start, slow finish — the movement is legible at both ends.
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function smoothScrollToElement(el: HTMLElement, { offset = 96 }: Options = {}): void {
  const startY = window.scrollY;
  const targetY = Math.max(0, startY + el.getBoundingClientRect().top - offset);
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  // Motion here is orientation, not decoration — but if the user has asked for
  // less of it, jump rather than animate.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, targetY);
    return;
  }

  // Longer journeys take longer, within reason — a fixed duration feels rushed
  // across a long page and sluggish across a short hop.
  const duration = Math.min(1100, Math.max(450, Math.abs(distance) * 1.1));
  const start = performance.now();
  let cancelled = false;

  // If the user takes over, stop immediately — never fight their scrolling.
  const cancel = () => { cancelled = true; };
  const opts = { passive: true, once: true } as const;
  window.addEventListener('wheel', cancel, opts);
  window.addEventListener('touchstart', cancel, opts);
  window.addEventListener('keydown', cancel, opts);

  const step = (now: number) => {
    if (cancelled) return;
    const p = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + distance * easeInOutCubic(p));
    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    }
  };
  requestAnimationFrame(step);
}
