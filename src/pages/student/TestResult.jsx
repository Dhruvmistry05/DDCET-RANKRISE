import { useLocation, Link } from 'react-router-dom';
import { Trophy, Target, AlertCircle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

export default function TestResult() {
  const location = useLocation();
  const { result } = location.state || {};

  if (!result) return <div className="p-8 text-center text-xl">Result data not available.</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Test Results</h1>
          <Link to="/student" className="text-primary hover:underline font-medium">Back to Home</Link>
        </div>

        {/* Score Header */}
        <div className="bg-gradient-to-br from-primary to-blue-900 rounded-3xl p-10 text-white shadow-xl mb-8 flex flex-col items-center text-center">
          <Trophy size={64} className="text-accent mb-6" />
          <h2 className="text-xl font-medium text-blue-200 mb-2">YOUR FINAL SCORE</h2>
          <div className="text-7xl font-extrabold mb-8">{result.score.toFixed(2)}</div>
          
          <div className="flex w-full justify-around border-t border-blue-700 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{result.accuracy.toFixed(1)}%</div>
              <div className="text-blue-200 text-sm mt-1">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">#42</div>
              <div className="text-blue-200 text-sm mt-1">Mock Rank</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard title="Correct" value={result.correct} icon={CheckCircle} color="text-green-600" bgColor="bg-green-50" />
          <StatCard title="Wrong" value={result.wrong} icon={XCircle} color="text-red-600" bgColor="bg-red-50" />
          <StatCard title="Unattempted" value={result.unattempted} icon={MinusCircle} color="text-slate-500" bgColor="bg-slate-100 dark:bg-slate-800/50" />
        </div>

        {/* AI Mentor Insights */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6 text-purple-700">
            <Target size={28} />
            <h3 className="text-2xl font-bold">AI Mentor Insights</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">Based on your performance, you are struggling with:</p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl font-medium">
              <AlertCircle size={20} /> Mathematics - Algebra
            </li>
            <li className="flex items-center gap-3 text-orange-600 bg-orange-50 p-4 rounded-xl font-medium">
              <AlertCircle size={20} /> Biology - Cell Structure
            </li>
          </ul>
          
          <button className="w-full py-4 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            View Detailed Solutions (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <div className={`p-6 rounded-2xl ${bgColor} border flex flex-col items-center justify-center text-center shadow-sm`}>
      <Icon size={32} className={`${color} mb-3`} />
      <div className={`text-4xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-slate-600 dark:text-slate-400 font-medium">{title}</div>
    </div>
  );
}