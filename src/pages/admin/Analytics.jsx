import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, Award, ArrowLeft, BarChart3, Activity } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Aggregated performance data across diploma student test attempts.
          </p>
        </div>
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Top Aggregate Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Active Students" value="1,248" change="+12% this week" icon={Users} />
        <StatCard title="Average Score" value="76.4" change="+2.4 vs last mock" icon={TrendingUp} />
        <StatCard title="Mean Accuracy" value="82%" change="Consistent rate" icon={Target} />
        <StatCard title="Pass Ratio" value="94%" change="Diploma criteria" icon={Award} />
      </div>

      {/* Visual Diagnostic Charts Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-slate-400 min-h-[240px]">
          <BarChartPlaceholder />
          <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">Score Distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5">Calculated across 12 completed assessments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-slate-400 min-h-[240px]">
          <LineChartPlaceholder />
          <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">Mock Test Participation Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Weekly student turnouts and attempt counts</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Icon size={18} />
        </div>
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</h3>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{title}</p>
        <span className="text-[11px] text-slate-400 block mt-1">{change}</span>
      </div>
    </div>
  );
}

function BarChartPlaceholder() {
  return (
    <div className="flex items-end gap-2.5 h-28">
      <div className="w-6 sm:w-8 bg-blue-100 dark:bg-blue-950/40 rounded-t h-1/4"></div>
      <div className="w-6 sm:w-8 bg-blue-200 dark:bg-blue-900/50 rounded-t h-2/4"></div>
      <div className="w-6 sm:w-8 bg-[#1E3A8A] rounded-t h-full"></div>
      <div className="w-6 sm:w-8 bg-[#2563EB] rounded-t h-3/4"></div>
      <div className="w-6 sm:w-8 bg-blue-100 dark:bg-blue-950/40 rounded-t h-1/4"></div>
    </div>
  );
}

function LineChartPlaceholder() {
  return (
    <div className="flex items-center justify-center text-slate-300 dark:text-slate-600 h-28">
      <Activity size={56} className="text-[#2563EB]/60" />
    </div>
  );
}