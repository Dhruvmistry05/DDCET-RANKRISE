import React from 'react';
import { ShieldCheck, ShieldAlert, Maximize2, Minimize2, Info } from 'lucide-react';

/**
 * AntiCheatingBanner:
 * Subtle security strip displayed in the header of proctored tests.
 */
export default function AntiCheatingBanner({
  violationsCount = 0,
  maxViolations = 3,
  isFullscreen = false,
  onRequestFullscreen,
  onExitFullscreen
}) {
  const isHighRisk = violationsCount >= maxViolations - 1;
  const isModerateRisk = violationsCount > 0 && !isHighRisk;

  return (
    <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-colors ${
      isHighRisk
        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
        : isModerateRisk
        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
    }`}>
      <div className="flex items-center gap-2">
        {violationsCount > 0 ? (
          <ShieldAlert size={14} className={isHighRisk ? 'text-red-600' : 'text-amber-600'} />
        ) : (
          <ShieldCheck size={14} className="text-emerald-600" />
        )}
        <span className="font-bold">
          Anti-Cheating Active
        </span>
        <span className="hidden sm:inline-block opacity-75">|</span>
        <span className="font-semibold">
          Violations: <strong className={violationsCount > 0 ? (isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400') : 'text-emerald-600 dark:text-emerald-400'}>{violationsCount}</strong>/{maxViolations}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRequestFullscreen && (
          <button
            type="button"
            onClick={isFullscreen ? onExitFullscreen : onRequestFullscreen}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen Exam Mode'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={12} />
                <span className="hidden md:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} />
                <span className="hidden md:inline">Fullscreen Mode</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
