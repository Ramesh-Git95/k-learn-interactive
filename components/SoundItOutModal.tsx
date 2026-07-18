import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import SyllablePlayer from './SyllablePlayer';

// "Sound it out" — the pronunciation teaching view for a Korean word/phrase.
// Hosts the SyllablePlayer (big karaoke blocks + natural/slow playback) with
// the word's meaning for context. Free: this is core learning, not practice.
interface SoundItOutModalProps {
  korean: string;
  english: string;
  romanization?: string;
  onClose: () => void;
}

export default function SoundItOutModal({ korean, english, romanization, onClose }: SoundItOutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#C13F22] dark:text-[#F07A55]">Sound it out</div>
            <div className="text-lg font-black text-gray-900 dark:text-white">{english}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <SyllablePlayer text={korean} romanization={romanization} autoPlay />
      </div>
    </div>
  );
}
