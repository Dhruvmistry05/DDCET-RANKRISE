import React from 'react';
import { EyeOff, ShieldAlert } from 'lucide-react';

/**
 * ScreenShieldOverlay:
 * Obscures the entire viewport with an opaque privacy shield whenever the student
 * leaves the tab, unfocuses the window, or switches applications.
 * Prevents OS alt-tab previews and window peek screenshots.
 */
export default function ScreenShieldOverlay({ isActive, onRefocus }) {
  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[9998] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white select-none cursor-pointer"
      onClick={onRefocus}
    >
      <div className="w-20 h-20 rounded-3xl bg-red-950/60 border-2 border-red-500/80 flex items-center justify-center text-red-400 mb-6 shadow-2xl animate-pulse">
        <EyeOff size={40} />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/40 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider mb-3">
        <ShieldAlert size={14} />
        Privacy Shield Active
      </div>

      <h2 className="text-xl sm:text-2xl font-black mb-2 max-w-md">
        Exam Content Protected
      </h2>

      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
        Test content has been temporarily concealed because this exam window lost focus or was minimized.
      </p>

      <button 
        type="button"
        onClick={onRefocus}
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all"
      >
        Click to Return to Test
      </button>
    </div>
  );
}
