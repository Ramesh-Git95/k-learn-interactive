import { useEffect } from 'react';

// Fades elements up as they scroll into view.
//
// Add `kl-reveal` to anything that should reveal, then call this once in the
// page. Done as a hook over a class name rather than a wrapper component
// because the targets here are full-bleed <section> elements — wrapping those
// in extra divs risks disturbing their backgrounds and spacing, while a class
// is a one-word change that can't.
//
// IntersectionObserver rather than a scroll listener, so the browser does the
// work and nothing runs while the page sits still.

export function useScrollReveal(): void {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.kl-reveal'));
    if (targets.length === 0) return;

    // If the API is missing, show everything rather than leaving the page
    // blank — the animation is decoration, the content is the point.
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          // Reveal once — re-animating on every scroll past is noise.
          observer.unobserve(entry.target);
        });
      },
      // Fires slightly before the block is fully on screen, so it has finished
      // arriving by the time it's being read.
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' },
    );

    targets.forEach(el => observer.observe(el));

    // Anything already on screen at mount (short viewports, a restored scroll
    // position) reveals immediately rather than waiting for a scroll that may
    // never come.
    requestAnimationFrame(() => {
      targets.forEach(el => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    });

    return () => observer.disconnect();
  }, []);
}

export default useScrollReveal;
