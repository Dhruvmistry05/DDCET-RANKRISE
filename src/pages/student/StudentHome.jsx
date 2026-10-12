import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTests } from '../../store/mockData';
import { Clock, BookOpen, Trophy, Target, TrendingUp, PlayCircle, ArrowRight, UserCircle } from 'lucide-react';
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

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const isFirstLogin = user?.first_login_at === user?.last_login_at;

  return (
    <div className="p-6 lg:p-10 w-full max-w-7xl mx-auto space-y-10">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {isFirstLogin ? `Welcome, ${firstName}!` : `Welcome Back, ${firstName}!`} 👋
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            {isFirstLogin ? "We're excited to have you on board." : "You're doing great. Keep up the momentum!"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/complete-profile" 
            className="inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <UserCircle size={20} />
            Edit Profile
          </Link>
          <Link 
            to="/student/leaderboard" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
          >
            <Trophy size={20} />
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tests Completed', value: '12', icon: Target, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
          { label: 'Average Score', value: '85%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10' },
          { label: 'Time Spent', value: '24h', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tests Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PlayCircle className="text-blue-600 dark:text-blue-400" />
            Your Assessments
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tests.length === 0 && (
            <div className="col-span-full p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 text-lg">No tests available at the moment. Check back later!</p>
            </div>
          )}
          
          {tests.map(test => {
            const now = new Date();
            const start = new Date(test.scheduledStartTime);
            const end = new Date(test.scheduledEndTime);
            const isLive = now >= start && now <= end;
            const isUpcoming = now < start;
            const isClosed = now > end;

            return (
              <div 
                key={test.id} 
                className={`bg-white dark:bg-slate-800 p-7 rounded-3xl border transition-all ${
                  isLive 
                    ? 'border-blue-500/30 shadow-xl shadow-blue-500/10 hover:border-blue-500/60' 
                    : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight pr-4">
                    {test.title}
                  </h3>
                  <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-black tracking-wider ${
                    isLive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 animate-pulse' 
                    : isUpcoming ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {isLive ? '• LIVE NOW' : isUpcoming ? 'UPCOMING' : 'CLOSED'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-400 mb-8">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <Clock size={16} className="text-blue-500" /> {test.durationMinutes} Mins
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <BookOpen size={16} className="text-purple-500" /> {test.questions.length} Qs
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/student/test/${test.id}`)}
                  disabled={!isLive}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isLive 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLive ? (
                    <>Start Assessment <ArrowRight size={18} /></>
                  ) : isUpcoming ? (
                    'Starts Later'
                  ) : (
                    'Test Closed'
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