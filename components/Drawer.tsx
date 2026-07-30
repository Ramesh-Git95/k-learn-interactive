import React, { useState } from 'react';

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
  children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ label, meta, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex h-14 w-full items-center justify-between gap-4 rounded-xl border border-[rgba(20,32,47,0.14)] bg-[rgba(255,252,244,0.7)] px-5 text-left transition-colors hover:bg-[#FFFCF4] dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
      >
        <span className="truncate text-[14px] font-semibold text-[#16202F] dark:text-white">{label}</span>
        <span className="flex flex-none items-center gap-1.5 text-[13px] font-medium text-[#4A5566] dark:text-gray-400">
          {meta && <span className="hidden sm:inline">{meta} ·</span>}
          {open ? 'close' : 'open drawer'}
          <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">↓</span>
        </span>
      </button>

      {open && <div className="kl-drawer-panel mt-3.5">{children}</div>}
    </div>
  );
};

export default Drawer;
