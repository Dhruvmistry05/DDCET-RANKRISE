import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center text-slate-500 animate-fade-in">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
        <Hammer size={36} />
      </div>
      <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2">{title}</h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        This high-yield module is currently undergoing refinement for the upcoming DDCET session. Check back soon!
      </p>
      <Link to="/student" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl min-h-[44px] shadow-md shadow-blue-500/20 transition">
        Return to Dashboard
      </Link>
    </div>
  );
}
