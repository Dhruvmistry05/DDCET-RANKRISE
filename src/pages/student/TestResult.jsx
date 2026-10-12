import { useLocation, Link } from 'react-router-dom';
import { Trophy, Target, AlertCircle, CheckCircle, XCircle, MinusCircle, ArrowRight, Home } from 'lucide-react';

export default function TestResult() {
  const location = useLocation();
  const { result } = location.state || {};

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-amber-500 mb-3" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Test Result Found</h1>
        <p className="text-slate-500 text-sm mb-6">Complete a live test from your dashboard to view performance analytics.</p>
        <Link to="/student" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm min-h-[44px] flex items-center justify-center">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3.5 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Assessment Results
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed performance breakdown and ranking
            </p>
          </div>
          <Link 
            to="/student" 
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 transition-colors min-h-[40px]"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Score Hero Banner */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20">
            <Trophy size={36} className="text-amber-300 sm:w-10 sm:h-10" />
          </div>
          
          <h2 className="text-xs sm:text-sm font-bold tracking-widest text-blue-200 uppercase mb-1">
            Your Final Score
          </h2>
          <div className="text-5xl sm:text-7xl font-black mb-6 tracking-tight leading-none">
            {result.score.toFixed(2)}
          </div>
          
          <div className="grid grid-cols-2 w-full max-w-sm border-t border-white/15 pt-6 text-center">
            <div className="border-r border-white/15 pr-4">
              <div className="text-2xl sm:text-3xl font-black">{result.accuracy.toFixed(1)}%</div>
              <div className="text-blue-200 text-xs font-semibold uppercase mt-0.5">Accuracy Rate</div>
            </div>
            <div className="pl-4">
              <div className="text-2xl sm:text-3xl font-black text-amber-300">#42</div>
              <div className="text-blue-200 text-xs font-semibold uppercase mt-0.5">State Mock Rank</div>
            </div>
          </div>
        </div>

        {/* Question Performance Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <StatCard 
            title="Correct Questions" 
            value={result.correct} 
            icon={CheckCircle} 
            color="text-emerald-600 dark:text-emerald-400" 
            bgColor="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" 
          />
          <StatCard 
            title="Incorrect Questions" 
            value={result.wrong} 
            icon={XCircle} 
            color="text-rose-600 dark:text-rose-400" 
            bgColor="bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50" 
          />
          <StatCard 
            title="Unattempted" 
            value={result.unattempted} 
            icon={MinusCircle} 
            color="text-slate-600 dark:text-slate-400" 
            bgColor="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
          />
        </div>

        {/* AI Mentor Insights */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400">
            <Target size={24} />
            <h3 className="text-lg sm:text-xl font-bold">AI Diagnostics & Improvement Areas</h3>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
            Based on negative markings, focus your revision on these high-weightage chapters:
          </p>
          
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-semibold border border-rose-100 dark:border-rose-900/40">
              <AlertCircle size={18} className="shrink-0" />
              <span>Applied Mathematics — Integration & Differential Equations</span>
            </div>
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-semibold border border-amber-100 dark:border-amber-900/40">
              <AlertCircle size={18} className="shrink-0" />
              <span>Basic Engineering Science — Mechanics & Unit Conversions</span>
            </div>
          </div>
          
          <Link 
            to="/student/mistakes"
            className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>Review Wrong Answers in Mistake Book</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <div className={`p-4 sm:p-6 rounded-2xl ${bgColor} border flex items-center sm:flex-col justify-between sm:justify-center text-left sm:text-center shadow-xs`}>
      <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
        <Icon size={26} className={`${color} shrink-0`} />
        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <div className={`text-2xl sm:text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}