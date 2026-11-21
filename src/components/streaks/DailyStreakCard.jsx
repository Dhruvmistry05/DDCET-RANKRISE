import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Calendar, ArrowRight, CheckCircle2, Sparkles, Award, Zap } from 'lucide-react';

export default function DailyStreakCard({ streak, onOpenCalendar }) {
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const studiedToday = Boolean(streak?.studied_today);
  const totalActiveDays = streak?.total_active_days ?? 0;
  const weeklyActivity = streak?.weekly_activity || [];
  const milestones = streak?.milestones || [];

  // Find next upcoming milestone
  const nextMilestone = milestones.find(m => !m.achieved && currentStreak < m.days);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-6 shadow-xs transition-colors">
      
      {/* Decorative gradient orb in background */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-amber-400/15 to-orange-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-750">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
            <Flame size={22} className="fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Daily Study Streak
              </h2>
              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  <Zap size={11} className="fill-orange-500" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Duolingo-style daily learning consistency for DDCET
            </p>
          </div>
        </div>

        {/* Action button to open Monthly Calendar */}
        <button
          onClick={onOpenCalendar}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 bg-slate-50 dark:bg-slate-750 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <Calendar size={14} className="text-orange-500" />
          <span>Activity Calendar</span>
        </button>
      </div>

      {/* Middle Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 py-4 items-center">
        
        {/* Left Column: Big Streak Counter */}
        <div className="md:col-span-5 flex items-center gap-4">
          <div className="relative">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg transition-transform ${
              studiedToday 
                ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-orange-500/30 text-white' 
                : currentStreak > 0
                ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-orange-500/20 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
            }`}>
              🔥
            </div>
            {studiedToday && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs">
                <CheckCircle2 size={13} strokeWidth={3} />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentStreak}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">
                {currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded-md">
                <Trophy size={12} className="text-amber-500" />
                <span>Best: <strong>{longestStreak}</strong> {longestStreak === 1 ? 'day' : 'days'}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded-md">
                <Calendar size={12} className="text-blue-500" />
                <span>Total: <strong>{totalActiveDays}</strong> {totalActiveDays === 1 ? 'day' : 'days'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Activity Indicator (Mon-Sun) */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Week’s Consistency (Mon – Sun)
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {weeklyActivity.filter(w => w.completed).length} of 7 Days Active
            </span>
          </div>

          {/* Monday to Sunday Day Bubbles */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weeklyActivity.map((day) => {
              const isCompleted = day.completed;
              const isToday = day.is_today;
              const isFuture = day.is_future;

              return (
                <div 
                  key={day.date}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-tr from-amber-500/15 to-orange-500/15 border border-orange-300/60 dark:border-orange-800/60'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/30'
                      : isFuture
                      ? 'bg-slate-50/50 dark:bg-slate-850/30 border border-slate-100 dark:border-slate-800'
                      : 'bg-slate-100/70 dark:bg-slate-750/50 border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                  title={`${day.day_name} (${day.date}): ${isCompleted ? 'Completed study activity' : (isToday ? 'Today (pending)' : (isFuture ? 'Upcoming' : 'Missed'))}`}
                >
                  <span className={`text-[10px] font-bold ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {day.day_name}
                  </span>

                  {/* Bubble Status Icon */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center my-1 text-xs font-bold transition-transform ${
                    isCompleted
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs shadow-orange-500/30 scale-105'
                      : isToday
                      ? 'border-2 border-dashed border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800 animate-pulse'
                      : isFuture
                      ? 'border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <Flame size={14} className="fill-white" />
                    ) : isToday ? (
                      <span className="text-[10px] font-black">!</span>
                    ) : (
                      <span className="text-[10px] opacity-40">{day.day_letter}</span>
                    )}
                  </div>

                  <span className={`text-[9px] font-medium leading-none ${
                    isCompleted 
                      ? 'text-orange-600 dark:text-orange-400 font-bold' 
                      : isToday 
                      ? 'text-blue-600 dark:text-blue-400 font-bold' 
                      : 'text-slate-400'
                  }`}>
                    {day.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Status Banner & Quick Action */}
      <div className={`mt-2 p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        studiedToday
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
          : 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            studiedToday 
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' 
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
          }`}>
            {studiedToday ? <CheckCircle2 size={18} /> : <Flame size={18} className="fill-amber-500" />}
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm">
              {studiedToday 
                ? 'Streak Protected for Today! 🎉' 
                : (currentStreak > 0 ? 'Study Today to Extend Your Streak!' : 'Start Your Streak Today!')}
            </h4>
            <p className="text-[11px] opacity-90 mt-0.5">
              {studiedToday 
                ? 'You completed a valid learning session today. Come back tomorrow to keep the flame burning.' 
                : 'Complete at least 1 MCQ practice session, test, or mock paper to count today.'}
            </p>
          </div>
        </div>

        {/* Quick Launch Button */}
        {!studiedToday ? (
          <Link
            to="/student/practice"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
          >
            <span>Practice MCQs Now</span>
            <ArrowRight size={13} />
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 self-end sm:self-center">
            <Sparkles size={14} className="text-emerald-500" />
            <span>Ready for Tomorrow</span>
          </div>
        )}
      </div>

      {/* Upcoming Milestone Progress Snippet */}
      {nextMilestone && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" />
            <span>Next Milestone: <strong>{nextMilestone.title}</strong> ({nextMilestone.days} days)</span>
          </div>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            {nextMilestone.days - currentStreak} {nextMilestone.days - currentStreak === 1 ? 'day' : 'days'} to go
          </span>
        </div>
      )}

    </div>
  );
}
