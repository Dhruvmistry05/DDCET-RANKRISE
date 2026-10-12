import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Play, CheckCircle, Trash2, Clock, Calendar, Plus, RefreshCw, FileText } from 'lucide-react';

export default function TestManagement() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tests`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data.sort((a,b) => b.id - a.id));
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await fetch(`${API_URL}/api/tests/${id}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test? All student attempts will be removed.")) return;
    try {
      await fetch(`${API_URL}/api/tests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading tests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assessment & Mock Test Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, schedule, publish, and manage online mock tests.
          </p>
        </div>
        <Link 
          to="/admin/tests/create" 
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 min-h-[44px]"
        >
          <Plus size={18} />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="block md:hidden space-y-3">
        {tests.map(test => (
          <div 
            key={test.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                {test.title}
              </h3>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                test.status === 'published' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                {test.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md font-medium">
                {test.type?.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md font-medium flex items-center gap-1">
                <Clock size={12} /> {test.duration_minutes} min
              </span>
            </div>

            {test.type === 'scheduled_live' && (
              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Play size={12} /> Start: {new Date(test.scheduled_start_time).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={12} /> End: {new Date(test.scheduled_end_time).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              {test.status === 'draft' && (
                <button 
                  onClick={() => handlePublish(test.id)} 
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors min-h-[40px]"
                >
                  Publish Live
                </button>
              )}
              <button 
                onClick={() => handleDelete(test.id)} 
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Delete Test"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
            No tests created yet. Tap "Create New Test" to get started.
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-bold tracking-wider text-slate-400">
              <tr>
                <th className="p-4 sm:p-5">Test Title</th>
                <th className="p-4 sm:p-5">Type</th>
                <th className="p-4 sm:p-5">Schedule</th>
                <th className="p-4 sm:p-5">Duration</th>
                <th className="p-4 sm:p-5">Status</th>
                <th className="p-4 sm:p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-750">
              {tests.map(test => (
                <tr key={test.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/40 transition-colors">
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">{test.title}</td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-300 capitalize text-xs">
                    {test.type?.replace('_', ' ')}
                  </td>
                  <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                    {test.type === 'scheduled_live' ? (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <Play size={12}/> {new Date(test.scheduled_start_time).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock size={12}/> {new Date(test.scheduled_end_time).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 text-xs">
                        <Calendar size={14}/> Always Available
                      </span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    {test.duration_minutes} min
                  </td>
                  <td className="p-4 sm:p-5">
                    {test.status === 'published' ? (
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex w-fit items-center gap-1">
                        <CheckCircle size={13}/> Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex w-fit items-center gap-1">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-right flex justify-end items-center gap-2">
                    {test.status === 'draft' && (
                      <button 
                        onClick={() => handlePublish(test.id)} 
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors"
                      >
                        Publish
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(test.id)} 
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Test"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}

              {tests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No tests created yet. Click "Create New Test" to build one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
