import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center text-slate-500">
      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
        <Hammer size={24} />
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-md">
        This module is currently being finalized with syllabus questions and materials. It will become active in the upcoming release.
      </p>
      <Link to="/student" className="inline-flex items-center justify-center px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-xs rounded-lg transition shadow-xs">
        Back to Dashboard
      </Link>
    </div>
  );
}
