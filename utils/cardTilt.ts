import type React from 'react';

// Pointer-driven 3D tilt + spotlight for cards. Both effects are written as CSS
// custom properties on the element, so a hover updates variables rather than
// React state — no re-render, no library. Pair with the `kl-tilt` / `kl-spotlight`
// classes in index.css, which read these variables.

const TILT_MAX = 7; // degrees of lean at the card's edge

export function trackCard(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;   // 0..1 across
  const py = (e.clientY - r.top) / r.height;   // 0..1 down
  el.style.setProperty('--kl-ry', `${(px - 0.5) * 2 * TILT_MAX}deg`);
  el.style.setProperty('--kl-rx', `${(0.5 - py) * 2 * TILT_MAX}deg`);
  el.style.setProperty('--kl-spot-x', `${e.clientX - r.left}px`);
  el.style.setProperty('--kl-spot-y', `${e.clientY - r.top}px`);
}

export function resetCard(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty('--kl-rx', '0deg');
  el.style.setProperty('--kl-ry', '0deg');
}
