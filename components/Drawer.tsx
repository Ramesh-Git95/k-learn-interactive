import React, { useRef, useState } from 'react';
import { smoothScrollToElement } from '../utils/smoothScroll';

// The clarity redesign's drawer row: reference material (module lists, the full
// path, stats) collapses behind a labelled row that carries its count on the
// outside, so the page stays "focus → support → drawer" instead of one long
// scroll. Content is only mounted while open.

interface DrawerProps {
  /** Row label — what is inside. */
  label: string;
  /** Count/summary printed on the right, before the open/close affordance. */
  meta?: string;
  defaultOpen?: boolean;
  /** Optional control rendered beside the trigger row (e.g. "Next letter"). */
  action?: React.ReactNode;
  /** Children may be a function, so content can close the drawer itself. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}

const Drawer: React.FC<DrawerProps> = ({ label, meta, defaultOpen = false, action, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rowRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  // Opening a drawer below the fold left the page sitting still while content
  // appeared off-screen. Ease the row up to just under the header so what just
  // opened is what you are looking at — gently, so the movement stays legible
  // and the reader keeps their bearings.
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    requestAnimationFrame(() => {
      if (rowRef.current) smoothScrollToElement(rowRef.current, { offset: 96 });
    });
  };

  return (
    <div ref={rowRef}>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          onClick={toggle}
          aria-expanded={open}
          className={`flex h-14 flex-1 items-center justify-between gap-4 rounded-xl border px-5 text-left transition-colors ${
            open
              ? 'border-[rgba(20,32,47,0.22)] bg-[#FFFCF4] dark:border-gray-700 dark:bg-gray-900'
              : 'border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] hover:bg-[#FFFCF4] dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900'
          }`}
        >
          <span className="truncate text-[14px] font-semibold text-[#16202F] dark:text-white">{label}</span>
          <span className="flex flex-none items-center gap-1.5 text-[13px] font-medium text-[#4A5566] dark:text-gray-400">
            {meta && <span className="hidden sm:inline">{meta} ·</span>}
            {open ? 'close' : 'open drawer'}
            <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">↓</span>
          </span>
        </button>
        {action}
      </div>

      {open && (
        <div className="kl-drawer-panel mt-3.5">
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
};

export default Drawer;
