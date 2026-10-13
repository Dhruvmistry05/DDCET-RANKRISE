import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  PieChart, TrendingUp, Target, Clock, Trophy, 
  BookOpen, AlertTriangle, ArrowRight, CheckCircle2,
  BarChart2, Zap, HelpCircle
} from 'lucide-react';

export default function StudentAnalytics() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    tests_completed: 0,
    average_score: '0%',
    practice_time: '0 hours',
    current_rank: '-',
    questions_attempted: 0,
    syllabus_progress: '0%',
    syllabus_progress_percent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/api/student/dashboard-stats`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching analytics stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const avgNum = parseFloat(stats.average_score) || 0;
  const syllabusNum = stats.syllabus_progress_percent || 0;

  // Determine readiness status based on actual performance
  let readinessTier = 'Baseline Assessment';
  let tierColor = 'text-slate-600 bg-slate-100 border-slate-200';
  if (stats.tests_completed >= 3 && avgNum >= 75) {
    readinessTier = 'Merit Contender';
    tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  } else if (stats.tests_completed >= 1 && avgNum >= 40) {
    readinessTier = 'In Progress';
    tierColor = 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <PieChart size={13} className="text-[#2563EB]" />
            <span>Personal Performance Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Learning & Exam Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real data from your actual tests, practice sessions, and curriculum milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${tierColor}`}>
            Status: {readinessTier}
          </span>
        </div>
      </div>

      {/* 6 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Tests Completed */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <Target size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tests Taken</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.tests_completed}</p>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Average Score</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.average_score}</p>
        </div>

        {/* Practice Time */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <Clock size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Practice Time</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.practice_time}</p>
        </div>

        {/* State Rank */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <Trophy size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Current Rank</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.current_rank}</p>
        </div>

        {/* Questions Attempted */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <BarChart2 size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Questions</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.questions_attempted}</p>
        </div>

        {/* Syllabus Progress */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <BookOpen size={16} />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Syllabus</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.syllabus_progress}</p>
        </div>
      </div>

      {/* Syllabus & Preparation Progress Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curriculum Completion</h3>
            <p className="text-xs text-slate-500">Topics verified and practiced against the official DDCET syllabus</p>
          </div>
          <span className="text-sm font-bold text-[#1E3A8A] dark:text-blue-400">
            {stats.syllabus_progress}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-[#2563EB] h-full rounded-full transition-all duration-500" 
            style={{ width: `${syllabusNum}%` }}
          />
        </div>
      </div>

      {/* Diagnostic Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommendation Card */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-[#2563EB]" />
            <span>Targeted Recommendations</span>
          </h3>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            {stats.tests_completed === 0 ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Attempt Your Baseline Test</strong>
                  Take your first timed mock test to establish your starting rank and identify priority topics.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Continue Consistent Mock Practice</strong>
                  You have completed {stats.tests_completed} test{stats.tests_completed > 1 ? 's' : ''}. Aim for at least 1 mock exam weekly to improve speed.
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
              <CheckCircle2 size={16} className="text-slate-600 dark:text-slate-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block mb-0.5">Eliminate Negative Marks</strong>
                Review questions in your Mistake Notebook before each test session to reinforce formulas and cheat codes.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Diagnostic Shortcuts */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Portals</h3>

          <div className="space-y-2">
            <Link
              to="/student/mock"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Target size={16} className="text-[#2563EB]" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Take Full Mock Test</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              to="/student/practice"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-[#2563EB]" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Practice Chapter MCQs</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              to="/student/mistakes"
              className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Review Mistake Notebook</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
