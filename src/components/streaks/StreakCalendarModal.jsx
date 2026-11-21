import { useState, useEffect, useMemo } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Flame, Trophy, Award, Clock, CheckCircle2, Lock, Sparkles, HelpCircle 
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const DEFAULT_MILESTONES = [
  { days: 3, id: 'streak_3', title: '3-Day Spark', icon: '🔥', description: 'Completed 3 consecutive study days! Great momentum!' },
  { days: 7, id: 'streak_7', title: '7-Day Warrior', icon: '⚡', description: 'A full week of non-stop learning! True dedication.' },
  { days: 14, id: 'streak_14', title: 'Fortnight Focus', icon: '🎯', description: '14 days of relentless preparation for DDCET!' },
  { days: 30, id: 'streak_30', title: 'Monthly Master', icon: '🏆', description: '30-day streak! You are among the most disciplined students.' },
  { days: 50, id: 'streak_50', title: '50-Day Dedication', icon: '🌟', description: '50 consecutive study days! Mastery is within reach.' },
  { days: 100, id: 'streak_100', title: 'Centurion Scholar', icon: '👑', description: '100 days of legendary academic commitment!' }
];

export default function StreakCalendarModal({ isOpen, onClose, token, initialStreakData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  // Ensure auth token is reliably available even if prop is delayed
  const effectiveToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const headers = effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {};
        const res = await fetch(`${API_BASE_URL}/api/student/streak/calendar?year=${year}&month=${month}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setCalendarData(json);
        }
      } catch (err) {
        console.warn('Notice: using client-computed calendar structure while network resolves:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCalendar();
    return () => { isMounted = false; };
  }, [isOpen, year, month, effectiveToken]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleResetToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const currentStreak = calendarData?.current_streak ?? initialStreakData?.current_streak ?? 0;
  const longestStreak = calendarData?.longest_streak ?? initialStreakData?.longest_streak ?? 0;
  const totalActiveDays = calendarData?.total_active_days ?? initialStreakData?.total_active_days ?? 0;

  // Format seconds to human readable
  const formatTime = (secs) => {
    const s = parseInt(secs) || 0;
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  };

  // Determine current day string in Asia/Kolkata
  const todayDateStr = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      return parts;
    } catch (_e) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }, []);

  // Compute month layout deterministically (never empty)
  const { displayDays, firstDayOfWeek, monthName, monthSummary } = useMemo(() => {
    const daysInMonthCount = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const mName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));

    // Map server days if provided
    const serverDaysMap = new Map();
    if (Array.isArray(calendarData?.days)) {
      calendarData.days.forEach(d => {
        if (d && d.date) serverDaysMap.set(d.date, d);
      });
    }

    let activeCount = 0;
    let totalQuestions = 0;
    let totalTime = 0;

    const days = Array.from({ length: daysInMonthCount }, (_, idx) => {
      const dayNum = idx + 1;
      const padMonth = String(month).padStart(2, '0');
      const padDay = String(dayNum).padStart(2, '0');
      const dateStr = `${year}-${padMonth}-${padDay}`;
      const serverEntry = serverDaysMap.get(dateStr);

      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;
      const isFuture = dateStr > todayDateStr;
      const active = Boolean(serverEntry?.active);

      const qCount = serverEntry ? (parseInt(serverEntry.total_questions) || 0) : 0;
      const tSpent = serverEntry ? (parseInt(serverEntry.time_spent_seconds) || 0) : 0;
      const aCount = serverEntry ? (parseInt(serverEntry.activities_count) || 1) : 0;

      if (active) {
        activeCount++;
        totalQuestions += qCount;
        totalTime += tSpent;
      }

      return {
        day_number: dayNum,
        date: dateStr,
        active,
        is_today: isToday,
        is_past: isPast,
        is_future: isFuture,
        activities_count: active ? aCount : 0,
        total_questions: qCount,
        time_spent_seconds: tSpent,
        activity_type: serverEntry?.activity_type || null
      };
    });

    const summary = calendarData?.month_summary || {
      active_days: activeCount,
      total_questions: totalQuestions,
      total_time_seconds: totalTime
    };

    return {
      displayDays: days,
      firstDayOfWeek: firstDow,
      monthName: mName,
      monthSummary: summary
    };
  }, [year, month, calendarData, todayDateStr]);

  // Merge milestones: Always ensure all 6 milestones are displayed
  const milestones = useMemo(() => {
    const rawMilestones = (calendarData?.milestones && calendarData.milestones.length > 0)
      ? calendarData.milestones
      : ((initialStreakData?.milestones && initialStreakData.milestones.length > 0)
          ? initialStreakData.milestones
          : []);

    const rawMap = new Map();
    rawMilestones.forEach(m => {
      rawMap.set(m.id, m);
      rawMap.set(`streak_${m.days}`, m);
    });

    return DEFAULT_MILESTONES.map(def => {
      const matched = rawMap.get(def.id) || rawMilestones.find(m => m.days === def.days);
      const isAchieved = Boolean(matched?.achieved || (currentStreak >= def.days) || (longestStreak >= def.days));
      return {
        ...def,
        achieved: isAchieved,
        achieved_at: matched?.achieved_at || null
      };
    });
  }, [calendarData, initialStreakData, currentStreak, longestStreak]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-900/60 shadow-2xs">
              <Flame size={20} className="fill-orange-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Study Streak Calendar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your consistency and earned milestones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">

          {/* Top Streak Stats Strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 text-center">
              <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider block">
                Current Streak
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Flame size={18} className="text-orange-500 fill-orange-500" />
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-center">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Longest Streak
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Trophy size={16} className="text-amber-500" />
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {longestStreak} {longestStreak === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-center">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                Total Active Days
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <CalendarIcon size={16} className="text-blue-500" />
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {totalActiveDays} {totalActiveDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>
          </div>

          {/* Month Navigation & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[130px] text-center">
                  {monthName} {year}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                onClick={handleResetToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Monthly Summary Pills */}
            {monthSummary && (
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                  <strong className="text-orange-600 dark:text-orange-400">{monthSummary.active_days}</strong> active days
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                  <strong className="text-blue-600 dark:text-blue-400">{monthSummary.total_questions}</strong> MCQs
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
                  <strong className="text-emerald-600 dark:text-emerald-400">{formatTime(monthSummary.total_time_seconds)}</strong> study time
                </span>
              </div>
            )}
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 p-3 sm:p-4 shadow-2xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={d} className={`text-[11px] font-bold py-1 ${i === 0 || i === 6 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid Days (Always guaranteed to render all days) */}
            <div className="relative">
              {loading && !calendarData && (
                <div className="absolute top-1 right-1 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-medium backdrop-blur-xs">
                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-orange-400 border-t-transparent" />
                  <span>Syncing...</span>
                </div>
              )}

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty prefix cells before 1st of month */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded-lg bg-transparent" />
                ))}

                {/* Days of the month */}
                {displayDays.map((day) => {
                  const isSelected = selectedDay?.date === day.date;
                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDay(day)}
                      className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                        day.active
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs hover:brightness-110 shadow-orange-500/20'
                          : day.is_today
                          ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                          : day.is_future
                          ? 'text-slate-300 dark:text-slate-650 bg-slate-50/40 dark:bg-slate-850/40 cursor-default'
                          : 'text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-850/70 hover:bg-slate-100 dark:hover:bg-slate-750'
                      } ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                    >
                      <span className="text-xs leading-none">{day.day_number}</span>

                      {/* Active indicator flame */}
                      {day.active && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Flame size={11} className="fill-white text-white drop-shadow-2xs" />
                          {day.activities_count > 1 && (
                            <span className="text-[9px] font-black opacity-90">×{day.activities_count}</span>
                          )}
                        </div>
                      )}

                      {/* Today indicator dot if not active */}
                      {!day.active && day.is_today && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Inspection Box */}
          {selectedDay && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  selectedDay.active 
                    ? 'bg-orange-500 text-white shadow-xs' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {selectedDay.day_number}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedDay.date} {selectedDay.is_today ? '(Today)' : ''}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDay.active 
                      ? `${selectedDay.activities_count} study activity recorded • ${selectedDay.total_questions} MCQs answered` 
                      : (selectedDay.is_future ? 'Upcoming day' : 'No learning activity recorded on this day')}
                  </p>
                </div>
              </div>

              {selectedDay.active && (
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <Clock size={13} className="text-slate-400" />
                  <span>Time: {formatTime(selectedDay.time_spent_seconds)}</span>
                </div>
              )}
            </div>
          )}

          {/* Streak Milestones Showcase */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award size={16} className="text-amber-500" />
                <span>Streak Milestones & Achievements</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {milestones.filter(m => m.achieved).length} of {milestones.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {milestones.map((m) => {
                const isAchieved = Boolean(m.achieved);
                const progressPct = isAchieved 
                  ? 100 
                  : Math.min(100, Math.round((currentStreak / m.days) * 100));

                return (
                  <div 
                    key={m.id}
                    className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                      isAchieved 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-2xs' 
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      isAchieved 
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 opacity-60'
                    }`}>
                      {m.icon || '🔥'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {m.title}
                        </h4>
                        {isAchieved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 size={11} />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {currentStreak}/{m.days} days
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {m.description}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAchieved ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white transition-colors cursor-pointer"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
