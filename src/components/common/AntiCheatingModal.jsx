import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle, ShieldCheck, Clock } from 'lucide-react';

/**
 * AntiCheatingModal:
 * Displays critical proctoring alerts whenever an anti-cheating violation occurs.
 * Does NOT pause the test timer (unlike native browser alerts).
 */
export default function AntiCheatingModal({
  isOpen,
  warning,
  onDismiss,
  testTitle = 'Examination'
}) {
  if (!isOpen || !warning) return null;

  const { title, reason, count, max, time, isTerminal } = warning;
  const isLastWarning = count === max - 1 && !isTerminal;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 flex flex-col text-center ${
          isTerminal
            ? 'bg-red-50 dark:bg-slate-900 border-red-300 dark:border-red-800'
            : isLastWarning
            ? 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-amber-700'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Violation Icon */}
        <div className="mx-auto mb-4">
          {isTerminal ? (
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center border-2 border-red-300 dark:border-red-800 animate-bounce">
              <XCircle size={36} />
            </div>
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
              isLastWarning
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 border-amber-300 dark:border-amber-700'
                : 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 border-orange-300 dark:border-orange-800'
            }`}>
              <ShieldAlert size={36} />
            </div>
          )}
        </div>

        {/* Violation Counter Badge */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isTerminal
              ? 'bg-red-600 text-white'
              : isLastWarning
              ? 'bg-amber-600 text-white'
              : 'bg-orange-500 text-white'
          }`}>
            Violation {count} of {max}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            at {time}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
          {isTerminal ? 'Test Automatically Submitted' : title}
        </h3>

        {/* Reason Box */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
          Detected: <span className="text-red-600 dark:text-red-400 font-bold">{reason}</span>
        </div>

        {/* Warning Body Text */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          {isTerminal ? (
            <>
              You have exceeded the maximum permitted violations (<strong>{max}/{max}</strong>). 
              In accordance with examination policy, this test has been locked and automatically submitted for evaluation.
            </>
          ) : isLastWarning ? (
            <>
              <strong className="text-red-600 dark:text-red-400">CRITICAL FINAL WARNING:</strong> 
              {' '}Any further navigation, tab switch, screenshot attempt, or focus loss will 
              <strong> immediately auto-submit</strong> your examination.
            </>
          ) : (
            <>
              Tab switching, minimizing, taking screenshots, copying test questions, and opening developer tools are 
              strictly prohibited during active examinations.
            </>
          )}
        </p>

        {/* Continuous Timer Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-5">
          <Clock size={13} className="text-blue-500" />
          <span>Notice: The exam timer continues running in the background.</span>
        </div>

        {/* Action Button */}
        {isTerminal ? (
          <div className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs">
            Test Submitting...
          </div>
        ) : (
          <button
            onClick={onDismiss}
            className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
              isLastWarning
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            I Understand & Resume Exam
          </button>
        )}
      </div>
    </div>
  );
}
