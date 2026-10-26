import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  Users, TrendingUp, Target, Award, ArrowLeft, BarChart3, 
  Activity, RefreshCw, BookOpen, Layers, CheckCircle2, ChevronRight,
  LogIn, Clock, Compass, FileText, AlertTriangle, ShieldCheck, Info
} from 'lucide-react';

export default function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredBucket, setHoveredBucket] = useState(null);
  const [hoveredHour, setHoveredHour] = useState(null);

  const fetchAdminAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/admin/analytics`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAdminAnalytics();
  }, [token]);

  // Clean Zero-State Default: strictly starts from zero, no fake data
  const overview = data?.overview || {
    total_students: 0,
    total_attempts: 0,
    platform_avg_score: '0%',
    pass_ratio: '0%',
    total_questions: 2530
  };

  const activityTelemetry = data?.activity_telemetry || {
    total_logins: 0,
    daily_active_students: 0,
    weekly_active_students: 0,
    avg_session_duration_minutes: 0,
    total_actions_logged: 0,
    hourly_traffic_curve: [],
    action_breakdown: [
      { type: 'Practice Lab Sessions', count: 0, percent: 0, color: '#2563EB' },
      { type: 'Candidate Logins', count: 0, percent: 0, color: '#3B82F6' },
      { type: 'Full Mock Assessments', count: 0, percent: 0, color: '#7C3AED' },
      { type: 'Study Materials & PDFs', count: 0, percent: 0, color: '#059669' },
      { type: 'Mistake Reviews', count: 0, percent: 0, color: '#F43F5E' }
    ],
    live_activity_stream: []
  };

  const scoreBuckets = data?.score_distribution || {
    '0–35%': 0,
    '36–50%': 0,
    '51–70%': 0,
    '71–85%': 0,
    '86–100%': 0
  };

  const participationTrend = data?.participation_trend || [];
  const branchBreakdown = data?.branch_breakdown || [];

  const subjectsBreakdown = [
    { name: 'Mathematics', count: 820, percent: 32.4, color: '#2563EB' },
    { name: 'Physics', count: 780, percent: 30.8, color: '#7C3AED' },
    { name: 'Chemistry', count: 360, percent: 14.2, color: '#059669' },
    { name: 'English / Soft Skill', count: 360, percent: 14.2, color: '#D97706' },
    { name: 'Environmental Sciences', count: 120, percent: 4.7, color: '#0284C7' },
    { name: 'Computer', count: 90, percent: 3.6, color: '#4F46E5' }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Synthesizing verified platform analytics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <BarChart3 size={13} className="text-[#2563EB]" />
            <span>Administrator Platform Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Analytics & Student Activity Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time aggregate data calculated strictly from actual student registrations, test attempts, and verified portal actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => fetchAdminAnalytics(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
            title="Refresh platform telemetry"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>Refresh</span>
          </button>

          <Link 
            to="/admin" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Platform KPI Stat Cards (Real data only, zero estimates) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard 
          title="Active Students" 
          value={overview.total_students} 
          change={`${activityTelemetry.daily_active_students} active in last 24h`} 
          icon={Users} 
          color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900"
        />
        <StatCard 
          title="Student Logins" 
          value={activityTelemetry.total_logins} 
          change="Verified sessions logged" 
          icon={LogIn} 
          color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900"
        />
        <StatCard 
          title="Portal Actions" 
          value={activityTelemetry.total_actions_logged} 
          change="Tests, MCQs, & Materials" 
          icon={Activity} 
          color="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100 dark:border-purple-900"
        />
        <StatCard 
          title="Platform Mean Score" 
          value={overview.platform_avg_score} 
          change="Across all attempts" 
          icon={TrendingUp} 
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900"
        />
        <StatCard 
          title="Candidate Pass Ratio" 
          value={overview.pass_ratio} 
          change="Score >= 40% criteria" 
          icon={Award} 
          color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900"
        />
      </div>

      {/* Candidate Engagement & 24-Hour Portal Traffic Curve */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Candidate Engagement & 24-Hour Portal Traffic Curve
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hourly candidate activity distribution from 00:00 to 23:00 revealing peak study windows across Gujarat institutions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
              Avg Session: {activityTelemetry.avg_session_duration_minutes} mins
            </span>
          </div>
        </div>

        {/* 2-Column Grid: 24-Hour Hourly Histogram + Action Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 24-Hour Traffic Curve (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                24-Hour Activity Heatmap
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {activityTelemetry.total_actions_logged > 0 ? 'Live Telemetry' : 'No activity yet'}
              </span>
            </div>

            {activityTelemetry.total_actions_logged === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                <Clock size={28} className="text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Candidate activity throughout the day will appear here as students log in and take tests.</p>
              </div>
            ) : (
              <HourlyTrafficHistogram 
                curve={activityTelemetry.hourly_traffic_curve}
                hoveredHour={hoveredHour}
                setHoveredHour={setHoveredHour}
              />
            )}

            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>Low Traffic: 01:00 – 06:00</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activityTelemetry.total_actions_logged > 0 ? 'Peak usage hours update automatically' : 'Awaiting candidate actions'}
              </span>
            </div>
          </div>

          {/* Action Volume Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Action Volume by Category
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {activityTelemetry.total_actions_logged} Total Events
              </span>
            </div>

            {activityTelemetry.total_actions_logged === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                <Info size={24} className="text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Actions will be sorted by Practice Lab, Logins, Mock Tests, and Materials.</p>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {activityTelemetry.action_breakdown.map((act, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: act.color }} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{act.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{act.count}</span>
                        <span className="text-[10px] text-slate-400">({act.percent}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(0, act.percent)}%`, backgroundColor: act.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Live Candidate Action Stream Feed */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={15} className="text-blue-600" />
              <span>Live Candidate Activity Audit Log</span>
            </h3>
            <span className="text-[11px] text-slate-400">Real-time actions across all diploma colleges</span>
          </div>

          {activityTelemetry.live_activity_stream?.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Live student actions will be logged here as candidates engage with the platform.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activityTelemetry.live_activity_stream.slice(0, 9).map((act) => (
                <div 
                  key={act.id} 
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{act.student_name}</p>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{act.college}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                      {act.branch}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-medium">
                    {act.action}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <span>{act.timestamp}</span>
                    <span className="capitalize font-semibold text-slate-500">{act.type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Primary Visual Charts Area: Score Distribution + Turnout Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graph 1: Score Distribution Histogram (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={17} className="text-[#2563EB]" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Score Distribution Histogram
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of candidate performance across 5 performance brackets
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {overview.total_attempts} Submissions
            </span>
          </div>

          {overview.total_attempts === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
              <BarChart3 size={28} className="text-slate-300 dark:text-slate-600 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Score distribution will be generated once students submit assessment tests.</p>
            </div>
          ) : (
            <div className="pt-2">
              <ScoreDistributionHistogram 
                buckets={scoreBuckets} 
                totalAttempts={overview.total_attempts} 
                hoveredBucket={hoveredBucket}
                setHoveredBucket={setHoveredBucket}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px]">
              Platform Mean Score: <strong className="text-slate-800 dark:text-slate-200">{overview.platform_avg_score}</strong>
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Pass Rate: {overview.pass_ratio}
            </span>
          </div>
        </div>

        {/* Graph 2: Mock Test Participation Trend (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={17} className="text-purple-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Assessment Turnout Trend
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Weekly cumulative attempt volume
              </p>
            </div>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900">
              {overview.total_attempts > 0 ? 'Active' : 'No activity yet'}
            </span>
          </div>

          {overview.total_attempts === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
              <Activity size={28} className="text-slate-300 dark:text-slate-600 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Assessment turnout trajectory will plot weekly submissions once attempts are recorded.</p>
            </div>
          ) : (
            <div className="pt-2">
              <ParticipationTrendChart trend={participationTrend} />
            </div>
          )}

          <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
            {overview.total_attempts > 0 
              ? `Currently tracking ${overview.total_attempts} verified assessment submissions across all diploma institutions.` 
              : 'Awaiting student assessment submissions to calculate platform turnout velocity.'}
          </div>
        </div>

      </div>

      {/* Secondary Graphs: Branch-wise Performance + Syllabus Bank Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Branch-wise Performance Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Branch-wise Academic Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Average scores and candidate enrollment by diploma engineering discipline
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              {branchBreakdown.length} Disciplines
            </span>
          </div>

          {branchBreakdown.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No activity yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Branch performance comparisons will populate as students complete tests.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {branchBreakdown.map((b, idx) => {
                const scoreNum = parseFloat(b.avg_score) || 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {b.branch}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({b.students_count} candidate{b.students_count > 1 ? 's' : ''}, {b.attempts_count} tests)
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {b.avg_score}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          scoreNum >= 80 ? 'bg-emerald-500' : scoreNum >= 70 ? 'bg-blue-600' : scoreNum > 0 ? 'bg-amber-500' : 'bg-transparent'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, scoreNum))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Question Bank Coverage Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Syllabus Question Bank
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                2,530 verified MCQs across 6 subjects
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
              100% Ready
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {subjectsBreakdown.map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">{s.count} MCQs</span>
                    <span className="text-slate-400">({s.percent}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${s.percent * 2.5}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// -------------------------------------------------------------
// Component: Stat Card
// -------------------------------------------------------------
function StatCard({ title, value, change, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg border ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{title}</p>
        <span className="text-[10px] text-slate-400 block mt-1">{change}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: SVG 24-Hour Hourly Traffic Histogram
// -------------------------------------------------------------
function HourlyTrafficHistogram({ curve, hoveredHour, setHoveredHour }) {
  const width = 540;
  const height = 180;
  const padding = { top: 20, right: 15, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(5, ...(curve?.map(c => c.count) || [5]));
  const step = chartWidth / (curve?.length || 24);
  const barWidth = Math.max(3, step * 0.7);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
      {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
        const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
        return (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray={val === 0 ? undefined : "3 3"}
              className="dark:stroke-slate-800"
            />
            <text
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[9px] fill-slate-400 font-medium"
            >
              {val}
            </text>
          </g>
        );
      })}

      {curve?.map((c, idx) => {
        const barH = (c.count / maxVal) * chartHeight;
        const x = padding.left + idx * step + (step - barWidth) / 2;
        const y = padding.top + chartHeight - barH;
        const isHovered = hoveredHour === c.hour;

        return (
          <g 
            key={idx}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredHour(c.hour)}
            onMouseLeave={() => setHoveredHour(null)}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(0, barH)}
              rx="2"
              fill={isHovered ? "#1D4ED8" : c.count > 0 ? "#2563EB" : "transparent"}
              className="transition-all duration-200"
            />
            {idx % 3 === 0 && (
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-medium"
              >
                {c.hour.slice(0, 2)}h
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------
// Component: SVG Score Distribution Histogram
// -------------------------------------------------------------
function ScoreDistributionHistogram({ buckets, totalAttempts, hoveredBucket, setHoveredBucket }) {
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const bucketKeys = Object.keys(buckets);
  const maxVal = Math.max(1, ...Object.values(buckets));

  const barWidth = (chartWidth / bucketKeys.length) * 0.65;
  const step = chartWidth / bucketKeys.length;

  const barColors = {
    '0–35%': '#F43F5E',
    '36–50%': '#F59E0B',
    '51–70%': '#3B82F6',
    '71–85%': '#2563EB',
    '86–100%': '#10B981'
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
      {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
        const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
        return (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray={val === 0 ? undefined : "3 3"}
              className="dark:stroke-slate-800"
            />
            <text
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {val}
            </text>
          </g>
        );
      })}

      {bucketKeys.map((key, idx) => {
        const count = buckets[key];
        const barH = (count / maxVal) * chartHeight;
        const x = padding.left + idx * step + (step - barWidth) / 2;
        const y = padding.top + chartHeight - barH;
        const pct = totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0;
        const isHovered = hoveredBucket === key;

        return (
          <g 
            key={key} 
            className="cursor-pointer"
            onMouseEnter={() => setHoveredBucket(key)}
            onMouseLeave={() => setHoveredBucket(null)}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(0, barH)}
              rx="4"
              fill={barColors[key] || '#2563EB'}
              opacity={isHovered ? 1 : 0.85}
              className="transition-all duration-200"
            />
            {count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200"
              >
                {count} ({pct}%)
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              className={`text-[10px] font-medium ${isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'}`}
            >
              {key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------
// Component: SVG Participation Trend Line Chart
// -------------------------------------------------------------
function ParticipationTrendChart({ trend }) {
  const width = 360;
  const height = 180;
  const padding = { top: 20, right: 25, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const pointsCount = trend.length;
  const maxVal = Math.max(1, ...trend.map(t => t.attempts));

  const getX = (idx) => {
    if (pointsCount === 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (pointsCount - 1)) * chartWidth;
  };
  const getY = (val) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  const coords = trend.map((t, idx) => ({
    x: getX(idx),
    y: getY(t.attempts),
    ...t
  }));

  const linePath = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${padding.top + chartHeight} L ${coords[0].x} ${padding.top + chartHeight} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-sans">
      <defs>
        <linearGradient id="adminTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9333EA" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#9333EA" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {[0, Math.round(maxVal / 2), maxVal].map((val, idx) => {
        const y = getY(val);
        return (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray={val === 0 ? undefined : "3 3"}
              className="dark:stroke-slate-800"
            />
            <text
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[9px] fill-slate-400 font-medium"
            >
              {val}
            </text>
          </g>
        );
      })}

      {areaPath && <path d={areaPath} fill="url(#adminTrendGrad)" />}

      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#9333EA"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {coords.map((pt, idx) => (
        <g key={idx}>
          <circle
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="#9333EA"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <text
            x={pt.x}
            y={pt.y - 8}
            textAnchor="middle"
            className="text-[10px] font-bold fill-purple-700 dark:fill-purple-300"
          >
            {pt.attempts}
          </text>
          <text
            x={pt.x}
            y={padding.top + chartHeight + 16}
            textAnchor="middle"
            className="text-[9px] fill-slate-500 font-medium"
          >
            {pt.period}
          </text>
        </g>
      ))}
    </svg>
  );
}
