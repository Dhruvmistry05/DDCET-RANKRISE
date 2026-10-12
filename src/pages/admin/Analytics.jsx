import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, Award, ArrowLeft, BarChart3, Activity } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Platform Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time aggregate data across all test takers and cohorts.
          </p>
        </div>
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors min-h-[40px]"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Top Aggregate Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
        <StatCard title="Active Students" value="1,248" change="+12% this week" icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <StatCard title="Average Score" value="76.4" change="+2.4 vs last mock" icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <StatCard title="Mean Accuracy" value="82%" change="Consistent rate" icon={Target} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <StatCard title="Pass Ratio" value="94%" change="Diploma criteria" icon={Award} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-950/30" />
      </div>

      {/* Visual Diagnostic Charts Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col items-center justify-center text-slate-400 min-h-[260px]">
          <BarChartPlaceholder />
          <h3 className="mt-4 font-bold text-slate-700 dark:text-slate-300 text-sm">State Score Distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5">Calculated across 12 completed assessments</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col items-center justify-center text-slate-400 min-h-[260px]">
          <LineChartPlaceholder />
          <h3 className="mt-4 font-bold text-slate-700 dark:text-slate-300 text-sm">Mock Test Participation Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Weekly student turnouts and attempt counts</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color, bg }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-2">
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{value}</h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{title}</p>
        <span className="text-[11px] text-slate-400 block mt-1">{change}</span>
      </div>
    </div>
  );
}

function BarChartPlaceholder() {
  return (
    <div className="flex items-end gap-2.5 h-28">
      <div className="w-6 sm:w-8 bg-blue-200 dark:bg-blue-900/40 rounded-t h-1/4"></div>
      <div className="w-6 sm:w-8 bg-blue-300 dark:bg-blue-800/50 rounded-t h-2/4"></div>
      <div className="w-6 sm:w-8 bg-blue-500 rounded-t h-full"></div>
      <div className="w-6 sm:w-8 bg-blue-400 rounded-t h-3/4"></div>
      <div className="w-6 sm:w-8 bg-blue-200 dark:bg-blue-900/40 rounded-t h-1/4"></div>
    </div>
  );
}

function LineChartPlaceholder() {
  return (
    <div className="flex items-center justify-center text-slate-300 dark:text-slate-600 h-28">
      <Activity size={64} className="opacity-40 animate-pulse text-indigo-500" />
    </div>
  );
}