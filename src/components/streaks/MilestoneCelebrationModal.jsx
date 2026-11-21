import React from 'react';
import { Trophy, Sparkles, X, Award, Flame } from 'lucide-react';

export default function MilestoneCelebrationModal({ milestone, onClose }) {
  if (!milestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-800/60 p-6 sm:p-8 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Milestone Icon with Animated Fire Ring */}
        <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 animate-pulse opacity-20 blur-md" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 text-4xl">
            {milestone.icon || '🔥'}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 border border-amber-300 dark:border-amber-700 shadow-xs">
            <Sparkles size={16} className="text-amber-500 fill-amber-500" />
          </div>
        </div>

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Award size={14} />
          <span>New Streak Milestone Unlocked</span>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {milestone.title}
        </h2>

        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
          {milestone.days} Consecutive Days of Learning!
        </p>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          {milestone.description || `Incredible dedication! You have studied consistently for ${milestone.days} days in a row.`}
        </p>

        {/* Motivational Quote */}
        <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
          "Consistency is the foundation of excellence. Every single day brings you closer to your DDCET top rank."
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/25 transition-all transform active:scale-[0.98] cursor-pointer"
        >
          Keep The Momentum Going! 🔥
        </button>
      </div>
    </div>
  );
}
