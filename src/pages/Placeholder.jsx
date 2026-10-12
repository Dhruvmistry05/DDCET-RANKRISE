import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
      <Hammer size={64} className="mb-4 text-slate-300" />
      <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h1>
      <p className="mb-8">This feature is currently under development.</p>
      <Link to="/student" className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-800">
        Return Home
      </Link>
    </div>
  );
}
