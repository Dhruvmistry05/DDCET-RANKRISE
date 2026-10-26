import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTests } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { 
  Clock, BookOpen, Trophy, Target, TrendingUp, PlayCircle, 
  ArrowRight, UserCircle, HelpCircle, Book, FileText, Sparkles, PenTool
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function StudentHome() {
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    tests_completed: 0,
    average_score: '0%',
    practice_time: '0 hours',
    current_rank: '-',
    questions_attempted: 0,
    syllabus_progress: '0%',
    syllabus_progress_percent: 0
  });
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    const loadTests = () => {
      setTests(getTests().filter(t => t.status !== 'draft'));
    };
    loadTests();
    const timer = setInterval(loadTests, 60000);
    return () => clearInterval(timer);
  }, []);

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
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const quickLinks = [
    { title: 'Study Library', desc: 'Notes, Papers & Keys', icon: BookOpen, path: '/student/resources' },
    { title: 'Exam Syllabus', desc: 'Chapter-wise Topics', icon: Book, path: '/student/syllabus' },
    { title: 'Practice Lab', desc: 'Topic & Chapter MCQs', icon: PenTool, path: '/student/practice' },
    { title: 'Leaderboard', desc: 'Statewide Mock Ranks', icon: Trophy, path: '/student/leaderboard' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">
      
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.current_rank !== '-' ? `Current Rank: ${stats.current_rank}` : 'Unranked • Attempt a test to get ranked'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link 
            to="/student/quiz" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2563EB]/30 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors shadow-2xs"
          >
            <Sparkles size={14} className="text-[#2563EB]" />
            <span>Quiz Arena</span>
          </Link>
          <Link 
            to="/student/profile" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-2xs"
          >
            <UserCircle size={15} className="text-[#2563EB]" />
            <span>Profile</span>
          </Link>
          <Link 
            to="/student/leaderboard" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Trophy size={15} />
            <span>Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* 6 Required Dashboard Statistics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Performance Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Tests Completed */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
              <Target size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tests Completed
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.tests_completed}
              </p>
            </div>
          </div>

          {/* 2. Average Score */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Score
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.average_score}
              </p>
            </div>
          </div>

          {/* 3. Practice Time */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Practice Time
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {stats.practice_time}
              </p>
            </div>
          </div>

          {/* 4. Current Rank */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 border border-amber-200 dark:border-amber-900">
              <Trophy size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Current Rank
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.current_rank}
              </p>
            </div>
          </div>

          {/* 5. Questions Attempted */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
              <HelpCircle size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Questions Attempted
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.questions_attempted}
              </p>
            </div>
          </div>

          {/* 6. Syllabus Progress */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col justify-between min-h-[118px]">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Syllabus Progress
                </span>
                <span className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400">
                  {stats.syllabus_progress}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.syllabus_progress_percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Quick Study Portals
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className="group p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs transition-colors flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live Assessments Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlayCircle size={20} className="text-slate-700 dark:text-slate-300" />
            <span>Scheduled & Live Assessments</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tests.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <PlayCircle size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm mb-1">No Tests Scheduled</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Check back soon or explore chapter practice tests in the Syllabus section.
              </p>
            </div>
          )}
          
          {tests.map(test => {
            const now = new Date();
            const start = new Date(test.scheduledStartTime);
            const end = new Date(test.scheduledEndTime);
            const isLive = now >= start && now <= end;
            const isUpcoming = now < start;

            return (
              <div 
                key={test.id} 
                className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-colors shadow-xs ${
                  isLive 
                    ? 'border-[#2563EB] dark:border-blue-600' 
                    : 'border-[#E2E8F0] dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    {test.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                    isLive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                    : isUpcoming ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {isLive ? 'Live Now' : isUpcoming ? 'Upcoming' : 'Closed'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-slate-900 px-2.5 py-1 rounded-md border border-[#E2E8F0] dark:border-slate-700">
                    <Clock size={13} className="text-slate-400" /> 
                    <span>{test.durationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-slate-900 px-2.5 py-1 rounded-md border border-[#E2E8F0] dark:border-slate-700">
                    <BookOpen size={13} className="text-slate-400" /> 
                    <span>{test.questions.length} Questions</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/student/test/${test.id}`)}
                  disabled={!isLive}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
                    isLive 
                      ? 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-750 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLive ? (
                    <>
                      <span>Start Assessment</span>
                      <ArrowRight size={15} />
                    </>
                  ) : isUpcoming ? (
                    'Scheduled for Later'
                  ) : (
                    'Assessment Closed'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}