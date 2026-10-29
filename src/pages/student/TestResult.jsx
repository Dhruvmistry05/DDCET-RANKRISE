import { useLocation, Link } from 'react-router-dom';
import { Trophy, Target, AlertCircle, CheckCircle, XCircle, MinusCircle, ArrowRight, Home, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Assessment Results
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Performance breakdown and provisional merit standing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/student/analytics" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <TrendingUp size={14} />
              <span>Analytics</span>
            </Link>
            <Link 
              to="/student" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Home size={14} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-[#1E3A8A] text-white rounded-xl p-6 sm:p-8 border border-blue-900 flex flex-col items-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center mb-3 border border-white/20">
            <Trophy size={24} />
          </div>
          
          <h2 className="text-xs font-bold tracking-wider text-blue-200 uppercase mb-1">
            Final Score
          </h2>
          <div className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight text-white leading-none">
            {result.score.toFixed(2)}
          </div>
          
          <div className="grid grid-cols-2 w-full max-w-sm border-t border-blue-800/80 pt-4 text-center">
            <div className="border-r border-blue-800/80 pr-3">
              <div className="text-xl sm:text-2xl font-bold text-white">{result.accuracy.toFixed(1)}%</div>
              <div className="text-blue-200 text-xs font-semibold uppercase mt-0.5">Accuracy Rate</div>
            </div>
            <div className="pl-3">
              <div className="text-xl sm:text-2xl font-bold text-amber-300">{result.rank || '-'}</div>
              <div className="text-blue-200 text-xs font-semibold uppercase mt-0.5">Mock Rank</div>
            </div>
          </div>
        </div>

        {/* Question Performance Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard 
            title="Correct" 
            value={result.correct} 
            icon={CheckCircle} 
            color="text-emerald-600 dark:text-emerald-400" 
          />
          <StatCard 
            title="Incorrect" 
            value={result.wrong} 
            icon={XCircle} 
            color="text-rose-600 dark:text-rose-400" 
          />
          <StatCard 
            title="Unattempted" 
            value={result.unattempted} 
            icon={MinusCircle} 
            color="text-slate-500 dark:text-slate-400" 
          />
        </div>

        {/* Diagnostics & Improvement */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Target size={18} className="text-[#1E3A8A] dark:text-blue-400" />
            <h3 className="text-sm font-bold">Recommended Chapter Revision</h3>
          </div>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
            Based on negative markings recorded during this assessment, prioritize revision in:
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 bg-[#F8FAFC] dark:bg-slate-900 p-3 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-slate-700">
              <AlertCircle size={15} className="text-rose-500 shrink-0" />
              <span>Applied Mathematics — Integration & Differential Equations</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 bg-[#F8FAFC] dark:bg-slate-900 p-3 rounded-lg text-xs font-semibold border border-[#E2E8F0] dark:border-slate-700">
              <AlertCircle size={15} className="text-amber-500 shrink-0" />
              <span>Basic Engineering Science — Mechanics & Unit Conversions</span>
            </div>
          </div>
          
          <Link 
            to="/student/mistakes"
            className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 mt-2 shadow-xs"
          >
            <span>Review Incorrect Questions in My Mistake</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-center shadow-xs flex flex-col items-center justify-center">
      <Icon size={20} className={`${color} mb-1.5`} />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
      <div className={`text-xl sm:text-2xl font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}