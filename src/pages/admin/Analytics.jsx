import { Link } from 'react-router-dom';
import { Users, TrendingUp, Target, Award } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Platform Analytics</h1>
          <Link to="/admin" className="text-primary hover:underline font-medium">Back to Dashboard</Link>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Students" value="1,248" change="+12% this month" icon={Users} color="text-blue-600" />
          <StatCard title="Average Score" value="76.4" change="+2.4 from last test" icon={TrendingUp} color="text-green-600" />
          <StatCard title="Avg Accuracy" value="82%" change="Steady" icon={Target} color="text-orange-600" />
          <StatCard title="Pass Rate" value="94%" change="-1% this month" icon={Award} color="text-purple-600" />
        </div>

        {/* Charts Mock Area */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
            <BarChartPlaceholder />
            <p className="mt-4 font-medium">Score Distribution (Coming Soon)</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
            <LineChartPlaceholder />
            <p className="mt-4 font-medium">Participation Over Time (Coming Soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 bg-slate-50 dark:bg-slate-900 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
      <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">{title}</p>
      <p className="text-sm text-slate-400">{change}</p>
    </div>
  );
}

function BarChartPlaceholder() {
  return (
    <div className="flex items-end gap-2 h-32">
      <div className="w-8 bg-blue-100 rounded-t h-1/4"></div>
      <div className="w-8 bg-blue-200 rounded-t h-2/4"></div>
      <div className="w-8 bg-blue-400 rounded-t h-full"></div>
      <div className="w-8 bg-blue-300 rounded-t h-3/4"></div>
      <div className="w-8 bg-blue-100 rounded-t h-1/4"></div>
    </div>
  );
}

function LineChartPlaceholder() {
  return (
    <svg className="w-48 h-32 text-green-300" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 0 50 L 20 40 L 40 45 L 60 20 L 80 25 L 100 0" />
    </svg>
  );
}