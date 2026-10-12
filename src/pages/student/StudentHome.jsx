import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTests } from '../../store/mockData';
import { 
  Clock, BookOpen, Trophy, Target, TrendingUp, PlayCircle, 
  ArrowRight, UserCircle, Sparkles, Book, FileText, Globe
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function StudentHome() {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const load = () => {
      setTests(getTests().filter(t => t.status !== 'draft'));
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const isFirstLogin = user?.first_login_at === user?.last_login_at;

  const quickLinks = [
    { title: 'Study Library', desc: 'Notes, Papers & Keys', icon: BookOpen, path: '/student/resources', color: 'from-blue-600 to-indigo-600' },
    { title: 'Exam Syllabus', desc: 'Chapter-wise Topics', icon: Book, path: '/student/syllabus', color: 'from-indigo-600 to-purple-600' },
    { title: 'Past Papers', desc: 'Archive with Solutions', icon: FileText, path: '/student/resources/papers', color: 'from-emerald-600 to-teal-600' },
    { title: 'Leaderboard', desc: 'Statewide Mock Ranks', icon: Trophy, path: '/student/leaderboard', color: 'from-amber-500 to-orange-600' }
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-5 sm:p-8 shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200">
              <Sparkles size={13} className="text-yellow-300" />
              <span>DDCET Engineering Portal</span>
              {user?.branch && <span className="opacity-75">• {user.branch}</span>}
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {isFirstLogin ? `Welcome, ${firstName}!` : `Welcome back, ${firstName}!`} 👋
            </h1>
            
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {isFirstLogin 
                ? "Your preparation journey starts now. Practice chapter questions and attempt mock exams." 
                : "Keep up the momentum. Consistency in mock exams is the key to top engineering merit rank."}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0 pt-2 md:pt-0">
            <Link 
              to="/complete-profile" 
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 min-h-[44px]"
            >
              <UserCircle size={18} />
              <span>Profile</span>
            </Link>
            <Link 
              to="/student/leaderboard" 
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/30 hover:brightness-105 transition-all active:scale-95 min-h-[44px]"
            >
              <Trophy size={18} />
              <span>Rankings</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-6">
        {[
          { label: 'Tests Done', fullLabel: 'Tests Completed', value: '12', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Avg Score', fullLabel: 'Average Score', value: '85%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Time Spent', fullLabel: 'Total Practice Time', value: '24h', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-2xl shadow-xs border border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-left transition-all hover:shadow-sm"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5 truncate">
                {stat.fullLabel}
              </span>
              <span className="block sm:hidden text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-tight truncate">
                {stat.label}
              </span>
              <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launch Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white">
            Quick Study Portals
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {quickLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className="group p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
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
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PlayCircle size={22} className="text-blue-600 dark:text-blue-400" />
            <span>Scheduled & Live Assessments</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {tests.length === 0 && (
            <div className="col-span-full p-8 sm:p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <PlayCircle size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-base mb-1">No Tests Scheduled</p>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
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
                className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border transition-all ${
                  isLive 
                    ? 'border-blue-500/50 dark:border-blue-500/40 shadow-lg shadow-blue-500/10' 
                    : 'border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {test.title}
                  </h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black tracking-wider ${
                    isLive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 animate-pulse' 
                    : isUpcoming ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {isLive ? '• LIVE NOW' : isUpcoming ? 'UPCOMING' : 'CLOSED'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-5">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <Clock size={14} className="text-blue-500" /> 
                    <span>{test.durationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <BookOpen size={14} className="text-purple-500" /> 
                    <span>{test.questions.length} Questions</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/student/test/${test.id}`)}
                  disabled={!isLive}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                    isLive 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.99]' 
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLive ? (
                    <>
                      <span>Start Assessment Now</span>
                      <ArrowRight size={16} />
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