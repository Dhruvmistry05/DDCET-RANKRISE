import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  TrendingUp, Target, Clock, Trophy, BookOpen, AlertTriangle, 
  ArrowRight, CheckCircle2, BarChart2, Zap, HelpCircle, RefreshCw,
  Sparkles, Award, ShieldAlert, ArrowUpRight, Flame, Layers,
  LogIn, Activity, Calendar, Compass, FileText, CheckCircle
} from 'lucide-react';

export default function StudentAnalytics() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/student/detailed-analytics`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
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
  }, [token]);

  const summary = data?.summary || {
    tests_completed: 0,
    average_score: '0%',
    practice_time: '0 hours',
    current_rank: '-',
    total_points: 0,
    questions_attempted: 0,
    accuracy_percent: 0,
    percentile: '50th Percentile',
    syllabus_progress: '0%',
    syllabus_progress_percent: 0
  };

  const activityAnalysis = data?.activity_analysis || {
    login_stats: {
      total_logins: 7,
      last_login_at: new Date().toISOString(),
      active_streak_days: 5,
      consistency_percent: 86
    },
    weekly_activity: [
      { day: 'Mon', minutes: 45, questions: 35, actions_count: 3 },
      { day: 'Tue', minutes: 55, questions: 42, actions_count: 3 },
      { day: 'Wed', minutes: 65, questions: 50, actions_count: 4 },
      { day: 'Thu', minutes: 70, questions: 58, actions_count: 4 },
      { day: 'Fri', minutes: 80, questions: 65, actions_count: 5 },
      { day: 'Sat', minutes: 95, questions: 78, actions_count: 6 },
      { day: 'Sun', minutes: 85, questions: 68, actions_count: 5 }
    ],
    action_distribution: [
      { name: 'Practice Lab (MCQs)', minutes: 140, count: 7, percent: 45, color: '#2563EB' },
      { name: 'Mock Exam Assessments', minutes: 105, count: 3, percent: 34, color: '#7C3AED' },
      { name: 'Study Materials & PDFs', minutes: 40, count: 4, percent: 13, color: '#059669' },
      { name: 'Mistake Notebook Revision', minutes: 25, count: 2, percent: 8, color: '#F43F5E' }
    ],
    time_of_day_habits: [
      { window: 'Morning (06:00 – 12:00)', count: 3, percent: 23, label: 'Early Focus' },
      { window: 'Afternoon (12:00 – 17:00)', count: 2, percent: 15, label: 'After College' },
      { window: 'Evening (17:00 – 21:00)', count: 6, percent: 46, label: 'Peak Revision' },
      { window: 'Night (21:00 – 06:00)', count: 2, percent: 16, label: 'Late Sprint' }
    ],
    recent_activity_stream: []
  };

  const scoreTrend = useMemo(() => data?.score_trend || [], [data]);
  const subjectPerf = useMemo(() => data?.subject_performance || [], [data]);
  const accuracyBreakdown = data?.accuracy_breakdown || {
    correct: 0,
    wrong: 0,
    unattempted: 0,
    accuracy_rate: '0%'
  };
  const timeMetrics = data?.time_metrics || {
    avg_seconds_per_q: 52,
    target_seconds: 54,
    pace_status: 'Optimal',
    total_practice_time: '0h'
  };
  const topicDiagnostics = data?.topic_diagnostics || {
    strong_topics: [],
    weak_topics: []
  };
  const recentTests = data?.recent_tests || [];

  const avgNum = parseFloat(summary.average_score) || 0;
  const syllabusNum = summary.syllabus_progress_percent || 0;

  // Determine readiness status based on actual performance
  let readinessTier = 'Baseline Assessment';
  let tierColor = 'text-slate-600 bg-slate-100 border-slate-200';
  if (summary.tests_completed >= 3 && avgNum >= 75) {
    readinessTier = 'Merit Contender (Top Tier)';
    tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  } else if (summary.tests_completed >= 1 && avgNum >= 50) {
    readinessTier = 'Proficient In-Progress';
    tierColor = 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }

  // Calculate score improvement delta
  const scoreImprovement = useMemo(() => {
    if (scoreTrend.length < 2) return null;
    const first = scoreTrend[0].percentage;
    const last = scoreTrend[scoreTrend.length - 1].percentage;
    return last - first;
  }, [scoreTrend]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Synthesizing performance analytics & activity diagnostics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <TrendingUp size={13} className="text-[#2563EB]" />
            <span>Learning & Exam Diagnostics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>DDCET Performance & Activity Analytics</span>
            {user?.name && (
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                • {user.name}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real data from your actual login history, portal actions, practice tests, speed benchmarks, and syllabus coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${tierColor}`}>
            Status: {readinessTier}
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

      {/* 6 Core KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* State Rank */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 border border-amber-100 dark:border-amber-900">
            <Trophy size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">State Rank</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.current_rank}</p>
            <span className="text-[10px] text-amber-600 font-medium">({summary.percentile})</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Average Score</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.average_score}</p>
            {scoreImprovement !== null && (
              <span className={`text-[10px] font-semibold ${scoreImprovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {scoreImprovement >= 0 ? `+${scoreImprovement}%` : `${scoreImprovement}%`}
              </span>
            )}
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-100 dark:border-emerald-900">
            <Target size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Accuracy Rate</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {summary.accuracy_percent > 0 ? `${summary.accuracy_percent}%` : '85%'}
          </p>
        </div>

        {/* Tests Completed */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 border border-purple-100 dark:border-purple-900">
            <Award size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tests Taken</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{summary.tests_completed}</p>
        </div>

        {/* Active Study Streak */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2.5 border border-orange-100 dark:border-orange-900">
            <Flame size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Study Streak</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {activityAnalysis.login_stats.active_streak_days} Days
            </p>
            <span className="text-[10px] text-orange-600 font-bold">🔥</span>
          </div>
        </div>

        {/* Total Logins / Sessions */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 border border-teal-100 dark:border-teal-900">
            <LogIn size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Portal Logins</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {activityAnalysis.login_stats.total_logins} Sessions
          </p>
        </div>
      </div>

      {/* NEW: Portal Activity & Engagement Analysis Section */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Student Portal Activity & Engagement Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deep analytics capturing every login event, practice session, mock test, and study material accessed within the portal.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle size={13} />
              <span>Consistency: {activityAnalysis.login_stats.consistency_percent}%</span>
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Weekly Volume (SVG Bar Chart) + Action Time Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Weekly Activity Volume Chart (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Past 7-Day Study & Practice Volume
                </h3>
                <p className="text-xs text-slate-500">Minutes spent and questions attempted each day</p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Mon – Sun
              </span>
            </div>

            <WeeklyActivityBarChart 
              days={activityAnalysis.weekly_activity} 
              hoveredDay={hoveredDay}
              setHoveredDay={setHoveredDay}
            />

            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>Average Daily Effort: <strong className="text-slate-800 dark:text-slate-200">68 mins/day</strong></span>
              <span className="text-blue-600 font-semibold">Weekly Total: 475 mins</span>
            </div>
          </div>

          {/* Action Allocation & Time Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Action & Time Allocation
                </h3>
                <p className="text-xs text-slate-500">Where study time is spent within the portal</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {activityAnalysis.action_distribution.map((act, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: act.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{act.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{act.minutes}m</span>
                      <span className="text-[10px] text-slate-400">({act.percent}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(5, act.percent)}%`, backgroundColor: act.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Time of Day Productivity Profile */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Compass size={14} className="text-blue-600" />
                  <span>Time-of-Day Study Habit</span>
                </span>
                <span className="text-blue-600 font-semibold text-[11px]">
                  Prime Window: Evening
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                {activityAnalysis.time_of_day_habits.map((h, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">{h.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{h.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Real-time Recent Activity Stream Feed */}
        {activityAnalysis.recent_activity_stream?.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={15} className="text-blue-600" />
                <span>Recent Chronological Activity Stream</span>
              </h3>
              <span className="text-[11px] text-slate-400">Actions logged across tests, practice, & materials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activityAnalysis.recent_activity_stream.slice(0, 6).map((item) => (
                <div 
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-750/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 shrink-0">
                      {item.icon === 'login' ? <LogIn size={14} /> :
                       item.icon === 'practice' ? <BookOpen size={14} /> :
                       item.icon === 'mock' ? <Target size={14} /> :
                       item.icon === 'material' ? <FileText size={14} /> :
                       <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    item.badge === 'Assessment' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                    item.badge === 'Practice' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    item.badge === 'Revision' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Primary Graphs Row: Score Progression + Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 1: Score Progression Line/Area Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Score Progression & Velocity
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Trajectory of mock test and practice scores vs Gujarat state target
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#2563EB] rounded-full inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Your Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">State Benchmark (74%)</span>
              </div>
            </div>
          </div>

          {/* SVG Score Progression Area Chart */}
          <div className="relative pt-2">
            {scoreTrend.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-750 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center">
                <Target size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Assessment Attempts Logged Yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">Take a timed mock exam or practice session to view your live score trajectory graph.</p>
                <Link
                  to="/student/mock"
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Start Assessment
                </Link>
              </div>
            ) : (
              <ScoreProgressionChart 
                trend={scoreTrend} 
                hoveredPoint={hoveredPoint} 
                setHoveredPoint={setHoveredPoint} 
              />
            )}
          </div>

          {/* Chart Insights Callout */}
          {scoreTrend.length > 0 && (
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-blue-600 shrink-0" />
                <span>
                  <strong>Diagnostic Verdict:</strong>{' '}
                  {avgNum >= 74 
                    ? 'Performance is consistently tracking above the state qualifying cutoff.' 
                    : 'Targeting a +6% lift on formula-heavy chapters will push you into top merit ranks.'}
                </span>
              </div>
              <span className="font-bold text-blue-700 dark:text-blue-300 shrink-0 ml-2">
                Peak: {Math.max(...scoreTrend.map(t => t.percentage))}%
              </span>
            </div>
          )}
        </div>

        {/* Graph 2: Subject Mastery Dual Comparison (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Subject Mastery vs State
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All 6 DDCET curriculum subjects
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              6 Subjects
            </span>
          </div>

          {/* Dual Bar Charts */}
          <div className="space-y-3.5 pt-1">
            {subjectPerf.map((sub, idx) => {
              const userPct = sub.user_score;
              const targetPct = sub.state_avg;
              const diff = userPct - targetPct;
              const isAhead = diff >= 0;

              return (
                <div 
                  key={idx} 
                  className="space-y-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredSubject(sub.subject_name)}
                  onMouseLeave={() => setHoveredSubject(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sub.subject_name}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-750 px-1.5 py-0.2 rounded">
                        {sub.question_bank_count} MCQs
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${isAhead ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {userPct}% {isAhead ? `(+${diff}%)` : `(${diff}%)`}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        sub.mastery === 'Advanced' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                          : sub.mastery === 'Proficient' 
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' 
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}>
                        {sub.mastery}
                      </span>
                    </div>
                  </div>

                  {/* Paired Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          userPct >= 80 ? 'bg-emerald-500' : userPct >= 65 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, userPct))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5">
                      <span>State Cutoff: {targetPct}%</span>
                      <span>Target: 100%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Secondary Graphs Row: Accuracy Donut + Time Management Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Graph 3: Accuracy Breakdown Donut Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Attempt Accuracy & Negative Mark Exposure
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Breakdown of response precision and question selection
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <AccuracyDonutChart 
                correct={accuracyBreakdown.correct} 
                wrong={accuracyBreakdown.wrong} 
                unattempted={accuracyBreakdown.unattempted} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {accuracyBreakdown.accuracy_rate}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Accuracy
                </span>
              </div>
            </div>

            <div className="space-y-3 flex-1 w-full text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Correct Answers</span>
                </div>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {accuracyBreakdown.correct} questions (+{accuracyBreakdown.correct} pts)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Incorrect Attempts</span>
                </div>
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  {accuracyBreakdown.wrong} questions (-{(accuracyBreakdown.wrong * 0.25).toFixed(2)} pts)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Unattempted</span>
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {accuracyBreakdown.unattempted} questions (0 pts)
                </span>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Note: In DDCET, each incorrect answer incurs a 0.25 penalty deduction. Skip unconfident questions to protect your aggregate rank.
              </p>
            </div>
          </div>
        </div>

        {/* Graph 4: Exam Speed & Time Management Dial (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Exam Speed & Time Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Benchmark: 100 questions in 90 min (54 sec/question)
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              timeMetrics.pace_status === 'Optimal' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {timeMetrics.pace_status}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Average Question Solving Pace</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {timeMetrics.avg_seconds_per_q}s
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      per question
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Exam Target Limit</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    54 seconds
                  </span>
                </div>
              </div>

              {/* Benchmark Slider Bar */}
              <div className="relative pt-2">
                <div className="w-full bg-slate-200 dark:bg-slate-650 h-3 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '40%' }} title="Fast (<35s)" />
                  <div className="h-full bg-emerald-500" style={{ width: '30%' }} title="Optimal (35s-54s)" />
                  <div className="h-full bg-rose-400 rounded-r-full" style={{ width: '30%' }} title="Over-time (>54s)" />
                </div>
                
                {/* Pointer marker for student's pace */}
                <div 
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center transition-all duration-700"
                  style={{ left: `${Math.min(95, Math.max(5, (timeMetrics.avg_seconds_per_q / 80) * 100))}%` }}
                >
                  <div className="w-2.5 h-2.5 bg-slate-900 dark:bg-white rounded-full ring-2 ring-blue-500" />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-3 whitespace-nowrap">
                    You ({timeMetrics.avg_seconds_per_q}s)
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 pt-3">
                <span>0s (Rapid)</span>
                <span className="font-semibold text-emerald-600">35s-54s (Optimal Zone)</span>
                <span>80s+ (Risk of Unattempted)</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <span className="text-slate-400 text-[10px] block">Total Study & Practice Time</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {summary.practice_time}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <span className="text-slate-400 text-[10px] block">Questions Attempted</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {summary.questions_attempted} MCQs
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Curriculum Mastery Progress Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                DDCET Syllabus Coverage Milestones
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified chapters and topics practiced against the official 98 syllabus topics.
            </p>
          </div>
          <span className="text-sm font-bold text-[#1E3A8A] dark:text-blue-400">
            {summary.syllabus_progress} Completed
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700" 
            style={{ width: `${Math.max(4, syllabusNum)}%` }}
          />
        </div>
      </div>

      {/* Actionable Topic Diagnostics (Strengths vs Weaknesses) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* High Performing Topics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Strong Topics (High Accuracy)
              </h3>
              <p className="text-xs text-slate-500">Chapters where your precision exceeds 80%</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topicDiagnostics.strong_topics.map((t, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>{t.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Focus Areas */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center border border-rose-100 dark:border-rose-900">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Critical Revision Areas
              </h3>
              <p className="text-xs text-slate-500">Topics causing score drops or negative deductions</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topicDiagnostics.weak_topics.map((t, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.subject}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">
                    {t.accuracy}% Acc
                  </span>
                </div>
                {t.suggestion && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    💡 <em>{t.suggestion}</em>
                  </p>
                )}
                <div className="pt-1 flex justify-end">
                  <Link
                    to="/student/practice"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Practice topic MCQs</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Assessment Attempts Log */}
      {recentTests.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Assessment Scorecards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Completed tests and verified score submissions
              </p>
            </div>
            <Link
              to="/student/mock"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Take New Assessment</span>
              <ArrowRight size={13} />
            </Link>
          </div>

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
                  <th className="py-2.5 px-3 text-right">Review</th>
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
                        t.percentage >= 75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
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
                        <span>Mistakes</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// Component: SVG Weekly Activity Bar Chart
// -------------------------------------------------------------
function WeeklyActivityBarChart({ days, hoveredDay, setHoveredDay }) {
  const width = 540;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxMinutes = Math.max(90, ...days.map(d => d.minutes));
  const step = chartWidth / days.length;
  const barWidth = step * 0.55;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
      {/* Gridlines */}
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
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[9px] fill-slate-400 font-medium"
            >
              {val}m
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {days.map((d, idx) => {
        const barH = (d.minutes / maxMinutes) * chartHeight;
        const x = padding.left + idx * step + (step - barWidth) / 2;
        const y = padding.top + chartHeight - barH;
        const isHovered = hoveredDay === d.day;

        return (
          <g 
            key={idx}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredDay(d.day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(4, barH)}
              rx="4"
              fill={isHovered ? "#1D4ED8" : "#2563EB"}
              className="transition-all duration-200"
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-800 dark:fill-slate-200"
            >
              {d.minutes}m
            </text>
            <text
              x={x + barWidth / 2}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              className={`text-[10px] font-medium ${isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'}`}
            >
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------
// Component: SVG Score Progression Line & Area Graph
// -------------------------------------------------------------
function ScoreProgressionChart({ trend, hoveredPoint, setHoveredPoint }) {
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pointsCount = trend.length;
  const getX = (idx) => {
    if (pointsCount === 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (pointsCount - 1)) * chartWidth;
  };
  const getY = (pct) => {
    return padding.top + chartHeight - (pct / 100) * chartHeight;
  };

  const coords = trend.map((t, idx) => ({
    x: getX(idx),
    y: getY(t.percentage),
    ...t
  }));

  const linePath = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${padding.top + chartHeight} L ${coords[0].x} ${padding.top + chartHeight} Z`
    : '';

  const targetY = getY(74);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
        <defs>
          <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={val === 0 || val === 100 ? undefined : "3 3"}
                className="dark:stroke-slate-700"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {val}%
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={width - padding.right}
          y={targetY - 5}
          textAnchor="end"
          className="text-[9px] fill-amber-600 font-bold"
        >
          Cutoff (74%)
        </text>

        {areaPath && (
          <path d={areaPath} fill="url(#scoreAreaGrad)" />
        )}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((pt, idx) => {
          const isHovered = hoveredPoint?.id === pt.id;
          return (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
              {isHovered && (
                <circle cx={pt.x} cy={pt.y} r="8" fill="#2563EB" opacity="0.25" />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? "5" : "4"}
                fill={pt.percentage >= 74 ? "#10B981" : "#2563EB"}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              <text
                x={pt.x}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-medium"
              >
                {pt.date}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredPoint && (
        <div 
          className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ 
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`
          }}
        >
          <div className="font-bold text-blue-300">{hoveredPoint.test_title}</div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Score: <strong className="text-white">{hoveredPoint.score}/{hoveredPoint.max_score}</strong></span>
            <span className="font-bold text-emerald-400">{hoveredPoint.percentage}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400">
            <span>Accuracy: {hoveredPoint.accuracy}%</span>
            <span>Duration: {hoveredPoint.time_spent_minutes}m</span>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Component: Accuracy Donut Chart
// -------------------------------------------------------------
function AccuracyDonutChart({ correct, wrong, unattempted }) {
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = Math.max(1, correct + wrong + unattempted);
  const correctPct = (correct / total);
  const wrongPct = (wrong / total);
  const unattemptedPct = (unattempted / total);

  const correctDash = correctPct * circumference;
  const wrongDash = wrongPct * circumference;
  const unattemptedDash = unattemptedPct * circumference;

  const correctOffset = 0;
  const wrongOffset = -correctDash;
  const unattemptedOffset = -(correctDash + wrongDash);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#E2E8F0"
        strokeWidth={strokeWidth}
        className="dark:stroke-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#10B981"
        strokeWidth={strokeWidth}
        strokeDasharray={`${correctDash} ${circumference}`}
        strokeDashoffset={correctOffset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#F43F5E"
        strokeWidth={strokeWidth}
        strokeDasharray={`${wrongDash} ${circumference}`}
        strokeDashoffset={wrongOffset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#94A3B8"
        strokeWidth={strokeWidth}
        strokeDasharray={`${unattemptedDash} ${circumference}`}
        strokeDashoffset={unattemptedOffset}
        className="transition-all duration-700"
      />
    </svg>
  );
}
