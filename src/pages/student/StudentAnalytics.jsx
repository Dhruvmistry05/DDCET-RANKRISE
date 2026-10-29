import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  TrendingUp, Target, Clock, Trophy, BookOpen, AlertTriangle, 
  ArrowRight, CheckCircle2, BarChart2, Zap, HelpCircle, RefreshCw,
  Sparkles, Award, ShieldAlert, ArrowUpRight, Flame, Layers,
  Activity, Calendar, Compass, FileText, CheckCircle, Info,
  AlertCircle, XCircle, ChevronRight, Play, BookCheck, Timer
} from 'lucide-react';

export default function StudentAnalytics() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityWindow, setActivityWindow] = useState('7d'); // '7d' or '30d'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const headers = {};
      const authToken = token || localStorage.getItem('token');
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API_BASE_URL}/api/student/detailed-analytics`, { 
        headers,
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching detailed analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const handleUpdate = () => fetchAnalytics();

    // Auto-refresh on window focus & test submission events
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('rankrise_test_submitted', handleUpdate);

    // Cross-tab real-time sync
    const handleStorage = (e) => {
      if (e.key === 'rankrise_last_activity' || e.key === 'token') {
        fetchAnalytics();
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('rankrise_analytics_channel');
        bc.onmessage = () => fetchAnalytics();
      } catch (e) {}
    }

    // Real-time automatic polling every 5 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('rankrise_test_submitted', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, [token]);

  // Clean Zero-State Default: strictly starts from zero, no fake data
  const summary = data?.summary || {
    tests_completed: 0,
    average_score: '0%',
    average_score_num: 0,
    practice_time: '0h 0m',
    total_seconds: 0,
    current_rank: '-',
    total_points: 0,
    questions_attempted: 0,
    accuracy_percent: 0,
    percentile: '-',
    total_students: 0,
    syllabus_progress: '0%',
    syllabus_progress_percent: 0
  };

  const examReadiness = data?.exam_readiness || {
    readiness_score: 0,
    tier: 'Not Started',
    guidance: 'Take your first diagnostic practice test to calculate your initial DDCET readiness score.',
    benchmarks: [
      { label: 'Syllabus Coverage', current: '0%', target: '>= 75%', status: 'Pending' },
      { label: 'Practice Accuracy', current: '0%', target: '>= 75%', status: 'Pending' },
      { label: 'Assessment Score', current: '0%', target: '>= 70%', status: 'Pending' },
      { label: 'Solving Pace', current: '0s / Q', target: '<= 54s / Q', status: 'Pending' }
    ]
  };

  const dailyGoal = data?.daily_goal || {
    target_minutes: 45,
    target_questions: 30,
    today_minutes: 0,
    today_questions: 0,
    minutes_progress_pct: 0,
    questions_progress_pct: 0,
    completed: false
  };

  const syllabusTracker = data?.syllabus_tracker || {
    total_topics: 99,
    completed_topics: 0,
    pending_topics: 99,
    completion_percentage: 0,
    total_chapters: 24,
    completed_chapters: 0,
    pending_chapters: 24,
    subject_progress: []
  };

  const subjectAnalysis = data?.subject_analysis || {
    performance: data?.subject_performance || [],
    strong_subjects: [],
    weak_subjects: [],
    unattempted_subjects: []
  };

  const subjectPerf = useMemo(() => {
    return subjectAnalysis.performance?.length > 0 ? subjectAnalysis.performance : (data?.subject_performance || []);
  }, [subjectAnalysis, data]);

  const diagnostics = data?.diagnostics || {
    weak_topics: data?.topic_diagnostics?.weak_topics || [],
    strong_topics: data?.topic_diagnostics?.strong_topics || [],
    weak_chapters: data?.chapter_diagnostics?.weak_chapters || [],
    strong_chapters: data?.chapter_diagnostics?.strong_chapters || []
  };

  const mistakeAnalysis = data?.mistake_analysis || {
    total_mistakes: 0,
    marks_deducted: 0,
    mistake_rate: 0
  };

  const speedAnalysis = data?.speed_analysis || data?.time_metrics || {
    avg_seconds_per_q: 0,
    target_seconds: 54,
    pace_status: 'No data yet',
    total_practice_time: '0h 0m'
  };

  const accuracyBreakdown = data?.accuracy_breakdown || {
    correct: 0,
    wrong: 0,
    unattempted: 0,
    accuracy_rate: '0%'
  };

  const smartRecommendations = data?.smart_recommendations || [];
  const revisionPlanner = data?.revision_planner || [];
  const scoreTrend = useMemo(() => data?.score_trend || [], [data]);
  const recentTests = data?.recent_tests || [];

  const activityAnalysis = data?.activity_analysis || {
    login_stats: {
      total_logins: 0,
      last_login_at: null,
      active_streak_days: 0,
      consistency_percent: 0
    },
    weekly_activity: [],
    action_distribution: [],
    time_of_day_habits: [],
    recent_activity_stream: []
  };

  const progressTimeline = data?.progress_timeline || {
    past7Days: activityAnalysis.weekly_activity || [],
    past30Days: []
  };

  // Determine active timeline data based on selected window
  const activeTimelineDays = useMemo(() => {
    if (activityWindow === '30d' && progressTimeline.past30Days?.length > 0) {
      return progressTimeline.past30Days;
    }
    return progressTimeline.past7Days?.length > 0 ? progressTimeline.past7Days : (activityAnalysis.weekly_activity || []);
  }, [activityWindow, progressTimeline, activityAnalysis.weekly_activity]);

  // Check if student has performed any portal actions
  const totalTimelineMinutes = useMemo(() => {
    return activeTimelineDays.reduce((acc, d) => acc + (d.minutes || 0), 0);
  }, [activeTimelineDays]);

  const hasAnyActivity = activityAnalysis.login_stats.total_logins > 0 || 
                         summary.tests_completed > 0 || 
                         summary.questions_attempted > 0 ||
                         totalTimelineMinutes > 0 ||
                         syllabusTracker.completed_topics > 0;

  // Score improvement calculation
  const scoreImprovement = useMemo(() => {
    if (scoreTrend.length < 2) return null;
    const first = scoreTrend[0].percentage;
    const last = scoreTrend[scoreTrend.length - 1].percentage;
    return last - first;
  }, [scoreTrend]);

  // Color helper for exam readiness tiers
  const getReadinessTheme = (tier) => {
    switch (tier) {
      case 'Exam Ready':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
          accent: 'text-emerald-600',
          ring: '#059669'
        };
      case 'Merit Contender':
        return {
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
          accent: 'text-indigo-600',
          ring: '#4F46E5'
        };
      case 'Proficient In-Progress':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
          accent: 'text-blue-600',
          ring: '#2563EB'
        };
      case 'Baseline Assessment':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
          accent: 'text-amber-600',
          ring: '#D97706'
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          accent: 'text-slate-500',
          ring: '#94A3B8'
        };
    }
  };

  const readinessTheme = getReadinessTheme(examReadiness.tier);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Fetching verified student analytics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header & Quick Interactive Action Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
              <TrendingUp size={13} className="text-[#2563EB]" />
              <span>Real Performance Diagnostics & Readiness</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>DDCET Student Performance Dashboard</span>
              {user?.name && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  • {user.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Accurate analytics calculated strictly from real practice tests, timed mock exams, mistakes, and syllabus progress.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${readinessTheme.pill}`}>
              Status: {examReadiness.tier}
            </span>
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-650 transition cursor-pointer"
              title="Refresh analytics data"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Primary Interactive Action Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-750 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            to="/student/practice"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Play size={14} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Practice Now</span>
            </div>
            <ArrowRight size={13} className="text-blue-200" />
          </Link>

          <Link
            to="/student/mistakes"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-xs font-bold transition group"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>Review My Mistake</span>
            </div>
            <ArrowRight size={13} className="text-rose-400" />
          </Link>

          <Link
            to="/student/syllabus"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 text-xs font-bold transition group"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={14} />
              <span>Continue Learning</span>
            </div>
            <ArrowRight size={13} className="text-slate-400" />
          </Link>

          <Link
            to="/student/mock"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900 text-xs font-bold transition group"
          >
            <div className="flex items-center gap-2">
              <Timer size={14} />
              <span>Take Mock Test</span>
            </div>
            <ArrowRight size={13} className="text-indigo-400" />
          </Link>
        </div>
      </div>

      {/* 2. DDCET Exam Readiness Indicator & Hall Benchmarks */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Readiness Score Dial & Tier */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-slate-100 dark:text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke={readinessTheme.ring}
                  strokeWidth="7"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * (examReadiness.readiness_score || 0)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  {examReadiness.readiness_score}%
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                  Ready
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  DDCET Exam Readiness Indicator
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${readinessTheme.pill}`}>
                  {examReadiness.tier}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {examReadiness.guidance}
              </p>
            </div>
          </div>

          {/* Action quick links */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <Link
              to="/student/mock"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition"
            >
              <span>Test Readiness</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* 4 DDCET Exam Hall Benchmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-750">
          {(examReadiness.benchmarks || []).map((b, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{b.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  b.status === 'Met' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : (b.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400')
                }`}>
                  {b.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{b.current}</span>
                <span className="text-[10px] text-slate-400">Target: {b.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 6 Core Performance KPIs (Real metrics only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* State Rank */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 border border-amber-100 dark:border-amber-900">
            <Trophy size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Current Rank</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.current_rank}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.percentile !== '-' ? summary.percentile : (summary.tests_completed > 0 ? 'Ranked' : 'Unranked')}
          </span>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <Target size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Average Score</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.average_score}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.tests_completed} {summary.tests_completed === 1 ? 'test' : 'tests'} submitted
          </span>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-100 dark:border-emerald-900">
            <Zap size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Accuracy Rate</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.accuracy_percent}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.questions_attempted} MCQs attempted
          </span>
        </div>

        {/* Active Study Streak */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 border border-rose-100 dark:border-rose-900">
            <Flame size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Study Streak</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {activityAnalysis.login_stats.active_streak_days}
            </span>
            <span className="text-xs text-slate-400 font-medium">days</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {activityAnalysis.login_stats.active_streak_days > 0 ? 'Consecutive streak' : 'Start streak today'}
          </span>
        </div>

        {/* Total Study Time */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 border border-purple-100 dark:border-purple-900">
            <Clock size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Total Practice</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.practice_time}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Actual time spent
          </span>
        </div>

        {/* Net Points */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 border border-teal-100 dark:border-teal-900">
            <Award size={16} />
          </div>
          <p className="text-[11px] font-medium text-slate-400">Net Points</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.total_points}
            </span>
            <span className="text-xs text-slate-400 font-medium">pts</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Leaderboard score
          </span>
        </div>
      </div>

      {/* 4. Daily Study Goals Card & Progress Tracker */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Study Goals (Today's Real Activity)
              </h3>
              {dailyGoal.completed ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Daily Goal Achieved! 🎉
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  In Progress
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily target: 45 minutes of practice and 30 questions solved today.
            </p>
          </div>
          <Link
            to="/student/practice"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition self-start sm:self-center"
          >
            <span>Practice Today's Goal</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Target 1: Study Time */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" />
                <span>Today's Study Time</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {dailyGoal.today_minutes} / {dailyGoal.target_minutes} mins ({dailyGoal.minutes_progress_pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoal.minutes_progress_pct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {dailyGoal.today_minutes >= dailyGoal.target_minutes 
                ? 'Time target achieved for today!' 
                : `${dailyGoal.target_minutes - dailyGoal.today_minutes} minutes remaining to reach your goal.`}
            </p>
          </div>

          {/* Target 2: Questions Solved */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target size={14} className="text-emerald-600" />
                <span>Today's MCQs Solved</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {dailyGoal.today_questions} / {dailyGoal.target_questions} MCQs ({dailyGoal.questions_progress_pct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoal.questions_progress_pct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {dailyGoal.today_questions >= dailyGoal.target_questions 
                ? 'Question target achieved for today!' 
                : `${dailyGoal.target_questions - dailyGoal.today_questions} questions remaining to reach your goal.`}
            </p>
          </div>
        </div>
      </div>

      {/* 5. 7-Day & 30-Day Activity Progress Chart */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span>Study Time & Activity Progress</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily minutes studied and questions attempted across your selected timeline
            </p>
          </div>

          {/* Toggle 7d / 30d */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 self-start sm:self-center">
            <button
              onClick={() => setActivityWindow('7d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activityWindow === '7d'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setActivityWindow('30d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activityWindow === '30d'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full">
          <ActivityTimelineChart 
            days={activeTimelineDays}
            windowType={activityWindow}
            hoveredDay={hoveredDay}
            setHoveredDay={setHoveredDay}
          />
        </div>

        {/* Hovered day details indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-750 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              <span>Study Minutes</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
              <span>Questions Solved</span>
            </span>
          </div>

          {hoveredDay ? (
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              <span className="font-bold">{hoveredDay.display_date || hoveredDay.day}: </span>
              <span>{hoveredDay.minutes} mins • {hoveredDay.questions} questions</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">Hover over bars for daily breakdown</span>
          )}
        </div>
      </div>

      {/* 6. Completed / Pending Syllabus Tracker Card */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookCheck size={16} className="text-blue-600" />
                <span>Completed vs Pending Syllabus Tracker</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {syllabusTracker.completion_percentage}% Covered
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracks individual topic completions across all 6 DDCET subjects. (Chapters are marked complete only when all topics are done).
            </p>
          </div>
          <Link
            to="/student/syllabus"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition self-start sm:self-center"
          >
            <span>Continue Learning</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Global Summary Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500">Completed Topics</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {syllabusTracker.completed_topics} / {syllabusTracker.total_topics}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500">Pending Topics</span>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {syllabusTracker.pending_topics} Topics
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500">Completed Chapters</span>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {syllabusTracker.completed_chapters} / {syllabusTracker.total_chapters}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500">Pending Chapters</span>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {syllabusTracker.pending_chapters} Chapters
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300">Overall DDCET Syllabus Progress</span>
            <span className="text-blue-600 dark:text-blue-400">{syllabusTracker.completion_percentage}% Completed</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${syllabusTracker.completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Per-Subject Syllabus Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {(syllabusTracker.subject_progress || []).map((sp, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {sp.subject_name}
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {sp.completion_percent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${sp.completion_percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{sp.completed_topics} of {sp.total_topics} topics done</span>
                <span>{sp.completed_chapters} / {sp.total_chapters} chapters done</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Subject Mastery Matrix & Weak vs Strong Subjects */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-600" />
              <span>Subject-wise Accuracy & Mastery Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strictly derived from your question answers. Unattempted subjects remain labeled "Not Attempted" (0%) and are never counted as weak.
            </p>
          </div>
          <Link
            to="/student/practice"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition self-start sm:self-center"
          >
            <span>Practice Subject MCQs</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Strong vs Weak Subjects Callout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strong Subjects */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Strong Subjects (Accuracy ≥ 70%)</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {subjectAnalysis.strong_subjects?.length || 0} Identified
              </span>
            </div>

            {subjectAnalysis.strong_subjects?.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {subjectAnalysis.strong_subjects.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                    <span className="font-semibold text-slate-900 dark:text-white">{s.subject_name}</span>
                    <span className="font-bold text-emerald-600">{s.accuracy}% Accuracy ({s.attempts} MCQs)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                {summary.tests_completed > 0 
                  ? 'Keep practicing! Score 70% or higher in a subject to mark it as strong.' 
                  : 'No subjects attempted yet. Take practice tests to unlock your strong subject analysis.'}
              </p>
            )}
          </div>

          {/* Weak Subjects */}
          <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle size={15} className="text-rose-600" />
                <span>Weak Subjects (Accuracy &lt; 60% with attempts)</span>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                {subjectAnalysis.weak_subjects?.length || 0} Areas
              </span>
            </div>

            {subjectAnalysis.weak_subjects?.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {subjectAnalysis.weak_subjects.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40">
                    <span className="font-semibold text-slate-900 dark:text-white">{s.subject_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-600">{s.accuracy}% Accuracy</span>
                      <Link
                        to="/student/practice"
                        className="text-[11px] text-blue-600 hover:underline font-bold"
                      >
                        Practice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                {summary.tests_completed > 0 
                  ? 'No weak subjects detected! All your practiced subjects are performing at or above 60%.' 
                  : 'No weak subjects yet. Unattempted subjects are never labeled as weak.'}
              </p>
            )}
          </div>
        </div>

        {/* All 6 Subjects Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3">Accuracy / Score</th>
                <th className="py-2.5 px-3">DDCET Benchmark</th>
                <th className="py-2.5 px-3">Questions Solved</th>
                <th className="py-2.5 px-3">Mastery Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
              {subjectPerf.map((sub, idx) => {
                const isAttempted = (sub.attempts_count || 0) > 0;
                let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-750 dark:text-slate-400';
                if (sub.mastery === 'Strong') badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                else if (sub.mastery === 'Moderate') badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                else if (sub.mastery === 'Weak') badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {sub.subject_name}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white w-10">
                          {isAttempted ? `${sub.user_score}%` : '0%'}
                        </span>
                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              sub.user_score >= 70 ? 'bg-emerald-600' : (sub.user_score >= 50 ? 'bg-blue-600' : 'bg-rose-500')
                            }`}
                            style={{ width: `${sub.user_score || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {sub.state_avg}% Target
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {sub.attempts_count || 0} MCQs
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                        {sub.mastery || (isAttempted ? 'Practiced' : 'Not Attempted')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/student/practice"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        <span>Practice</span>
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Weak & Strong Chapters / Topics Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Focus Areas (Weak Topics & Chapters) */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-500" />
                <span>Weak Chapters & Topics Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Topics where your accuracy is under 60% with actual question attempts
              </p>
            </div>
            <Link
              to="/student/practice"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Practice Now</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {diagnostics.weak_topics?.length === 0 && diagnostics.weak_chapters?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-750/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <CheckCircle size={28} className="text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No weak topics recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.tests_completed > 0 
                  ? 'All attempted topics are performing above 60% accuracy!' 
                  : 'Start practicing to identify and diagnose weak areas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {diagnostics.weak_topics.slice(0, 4).map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.topic_name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {t.subject_name} • {t.chapter_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-rose-600 dark:text-rose-400 font-semibold pt-0.5">
                      <span>{t.accuracy}% Accuracy</span>
                      <span>•</span>
                      <span>{t.attempts} MCQs attempted ({t.wrong} mistakes)</span>
                    </div>
                  </div>
                  <Link
                    to="/student/practice"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition shrink-0"
                  >
                    <span>Practice Now</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Performing Topics & Chapters */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>Strong Mastery Topics (≥ 80% Accuracy)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Concepts where you consistently score high accuracy
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {diagnostics.strong_topics?.length || 0} Strong Topics
            </span>
          </div>

          {diagnostics.strong_topics?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-750/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <Sparkles size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No strong topics recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Score 80% or higher on topic practice sessions to validate strong mastery.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {diagnostics.strong_topics.slice(0, 4).map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.topic_name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {t.subject_name} • {t.chapter_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                      <span>{t.accuracy}% Accuracy</span>
                      <span>•</span>
                      <span>{t.attempts} MCQs solved</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    Strong
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 9. Accuracy & Speed Analysis (Dual Visualizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Breakdown & Negative Marking Penalty */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Accuracy Breakdown & Mistake Penalty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Includes -0.25 negative marking penalty calculation
              </p>
            </div>
            <Link
              to="/student/mistakes"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Review My Mistake</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-36 h-36 shrink-0">
              <AccuracyDonutChart 
                correct={accuracyBreakdown.correct}
                wrong={accuracyBreakdown.wrong}
                unattempted={accuracyBreakdown.unattempted}
              />
            </div>

            <div className="flex-1 space-y-2.5 w-full text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Correct Answers</span>
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {accuracyBreakdown.correct} MCQs
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
                <span className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Wrong Answers (Mistakes)</span>
                </span>
                <span className="font-bold text-rose-700 dark:text-rose-300">
                  {accuracyBreakdown.wrong} MCQs
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  <span>Skipped / Unattempted</span>
                </span>
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {accuracyBreakdown.unattempted} MCQs
                </span>
              </div>
            </div>
          </div>

          {/* Negative Marking Callout Banner */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                DDCET Negative Marking Impact: -{mistakeAnalysis.marks_deducted} Marks Lost
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Each wrong answer incurs a -0.25 mark penalty. Reviewing your My Mistake section regularly eliminates recurring mistakes and guards your state rank.
              </p>
            </div>
          </div>
        </div>

        {/* Exam Hall Speed & Time Management Dial */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Exam Speed & Time Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official DDCET benchmark: 54 seconds per question (100 Qs / 90 mins)
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {speedAnalysis.pace_status}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/70 dark:border-slate-700 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {speedAnalysis.avg_seconds_per_q}s
                </span>
                <span className="text-xs text-slate-400 ml-1.5">per question average</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Target: {speedAnalysis.target_seconds}s
              </span>
            </div>

            {/* Benchmark Slider Bar */}
            <div className="space-y-1">
              <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    speedAnalysis.avg_seconds_per_q === 0 
                      ? 'bg-slate-300' 
                      : (speedAnalysis.avg_seconds_per_q <= 54 ? 'bg-emerald-500' : 'bg-rose-500')
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (speedAnalysis.avg_seconds_per_q / 90) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Fast (&lt;35s)</span>
                <span className="font-bold text-blue-600">54s Target</span>
                <span>Slow (&gt;75s)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {speedAnalysis.avg_seconds_per_q === 0 
                ? 'Solve practice questions to calculate your average solving pace.'
                : (speedAnalysis.avg_seconds_per_q <= 54 
                    ? 'Excellent pace! You are working well within the DDCET 90-minute time allocation.' 
                    : 'Pacing alert: Consider practicing timed topic tests to trim your solving time down to 54 seconds per question.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px]">Total Time Invested</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {speedAnalysis.total_practice_time || summary.practice_time}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px]">Avg Speed Efficiency</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {speedAnalysis.avg_seconds_per_q > 0 ? `${Math.round((54 / speedAnalysis.avg_seconds_per_q) * 100)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Smart Study Recommendations & Revision Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Study Recommendations */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Smart Study Recommendations</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Personalized study guidance driven by your real test results
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {smartRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/80 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {rec.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    rec.priority === 'high' 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {rec.priority === 'high' ? 'High Priority' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {rec.description}
                </p>
                {rec.action_url && (
                  <Link
                    to={rec.action_url}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
                  >
                    <span>{rec.action_text || 'Take Action'}</span>
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revision Planner (Spaced Repetition & Priority Topics) */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass size={16} className="text-blue-600" />
                <span>Revision Planner</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prioritizes topics by low accuracy, spaced retention interval, and pending syllabus
              </p>
            </div>
            <Link
              to="/student/practice"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Practice All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {revisionPlanner.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.topic_name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      {item.badge || 'Revision'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.subject_name} • {item.chapter_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {item.reason}
                  </p>
                </div>

                <Link
                  to="/student/practice"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shrink-0"
                >
                  <span>Practice</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 11. Recent Mock Test Performance Scorecards */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span>Mock Test & Assessment Performance Scorecards</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified submissions recorded with question breakdowns and test duration
            </p>
          </div>
          <Link
            to="/student/mock"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
          >
            <span>Take Mock Test</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentTests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-750/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Target size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Assessments you complete will be recorded with full score breakdowns and mistake reviews.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Assessment Title</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Percentage</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Time Spent</th>
                  <th className="py-2.5 px-3 text-right">My Mistake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {recentTests.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {t.test_title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{t.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {t.score} / {t.max_score}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        t.percentage >= 75 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {t.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {t.accuracy}%
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {t.time_spent_minutes} mins
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/student/mistakes"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        <span>My Mistake</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// Component: Activity Timeline Bar Chart (7-Day & 30-Day Support)
// -------------------------------------------------------------
function ActivityTimelineChart({ days, windowType, hoveredDay, setHoveredDay }) {
  if (!days || days.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No activity recorded in this period
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 15, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxMinutes = Math.max(30, ...days.map(d => d.minutes || 0));
  const step = chartWidth / days.length;
  const barWidth = Math.max(4, step * (windowType === '30d' ? 0.65 : 0.55));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
      {/* Background Grid Lines */}
      {[0, Math.round(maxMinutes / 2), maxMinutes].map((val, idx) => {
        const y = padding.top + chartHeight - (val / maxMinutes) * chartHeight;
        return (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray={val === 0 ? undefined : "3 3"}
              className="dark:stroke-slate-700"
            />
            <text
              x={padding.left - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="#94A3B8"
              className="select-none font-medium"
            >
              {val}m
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {days.map((d, idx) => {
        const barHeight = Math.max(0, (d.minutes / maxMinutes) * chartHeight);
        const x = padding.left + idx * step + (step - barWidth) / 2;
        const y = padding.top + chartHeight - barHeight;
        const isHovered = hoveredDay?.date === d.date;

        // Display label: for 30d show every 5th or 6th day
        const showLabel = windowType === '7d' || idx % 5 === 0 || idx === days.length - 1;
        const labelText = windowType === '7d' ? d.day : (d.display_date || d.day);

        return (
          <g 
            key={idx}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredDay(d)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {/* Background Hover hit area */}
            <rect
              x={padding.left + idx * step}
              y={padding.top}
              width={step}
              height={chartHeight}
              fill="transparent"
            />

            {/* Empty bar baseline */}
            <rect
              x={x}
              y={padding.top}
              width={barWidth}
              height={chartHeight}
              rx={barWidth / 2}
              fill="#F1F5F9"
              className="dark:fill-slate-750 opacity-40"
            />

            {/* Filled bar */}
            {d.minutes > 0 && (
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={isHovered ? "#1D4ED8" : "#2563EB"}
                className="transition-all duration-300"
              />
            )}

            {/* X-axis Label */}
            {showLabel && (
              <text
                x={padding.left + idx * step + step / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize={windowType === '30d' ? "8" : "10"}
                fill={isHovered ? "#2563EB" : "#64748B"}
                fontWeight={isHovered ? "bold" : "normal"}
                className="select-none"
              >
                {labelText}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------
// Component: Accuracy Donut Chart
// -------------------------------------------------------------
function AccuracyDonutChart({ correct, wrong, unattempted }) {
  const total = (correct || 0) + (wrong || 0) + (unattempted || 0);
  
  if (total === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <span className="text-[10px] text-slate-400 font-medium">No activity</span>
        </div>
      </div>
    );
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const correctPct = (correct / total);
  const wrongPct = (wrong / total);
  const unattemptedPct = (unattempted / total);

  const correctStroke = circumference * correctPct;
  const wrongStroke = circumference * wrongPct;
  const unattemptedStroke = circumference * unattemptedPct;

  const accRate = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90">
        {/* Unattempted segment */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="#94A3B8"
          strokeWidth="12"
          strokeDasharray={`${unattemptedStroke} ${circumference}`}
          strokeDashoffset={0}
          fill="transparent"
          className="transition-all duration-700"
        />
        {/* Wrong segment */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="#F43F5E"
          strokeWidth="12"
          strokeDasharray={`${wrongStroke} ${circumference}`}
          strokeDashoffset={-unattemptedStroke}
          fill="transparent"
          className="transition-all duration-700"
        />
        {/* Correct segment */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="#10B981"
          strokeWidth="12"
          strokeDasharray={`${correctStroke} ${circumference}`}
          strokeDashoffset={-(unattemptedStroke + wrongStroke)}
          fill="transparent"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
          {accRate}%
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
          Accuracy
        </span>
      </div>
    </div>
  );
}
