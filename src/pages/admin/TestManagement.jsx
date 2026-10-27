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

  const handleUnpublish = async (id) => {
    try {
      await fetch(`${API_URL}/api/tests/${id}/unpublish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (e) {
      console.error(e);
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assessment & Mock Test Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, schedule, publish, and manage online mock tests.
          </p>
        </div>
        <Link 
          to="/admin/tests/create" 
          className="inline-flex items-center justify-center gap-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-4 py-2 rounded-lg font-semibold text-xs transition shadow-xs active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assessments</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{tests.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Published to Students</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{tests.filter(t => t.status === 'published').length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Drafts (Hidden)</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{tests.filter(t => t.status === 'draft').length}</div>
        </div>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="block md:hidden space-y-3">
        {tests.map(test => (
          <div 
            key={test.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                {test.title}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                test.status === 'published' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                {test.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
              <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium">
                {test.type?.replace('_', ' ')}
              </span>
              {test.subject_name && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded font-medium">
                  {test.subject_name}
                </span>
              )}
              {test.chapter_name && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded font-medium">
                  {test.chapter_name}
                </span>
              )}
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium flex items-center gap-1">
                <Clock size={12} /> {test.duration_minutes} min
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium">
                {test.question_count || test.questions?.length || 0} Questions
              </span>
            </div>

            {test.type === 'scheduled_live' && (
              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Play size={12} /> Start: {new Date(test.scheduled_start_time).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={12} /> End: {new Date(test.scheduled_end_time).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {test.status === 'draft' ? (
                <button 
                  onClick={() => handlePublish(test.id)} 
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-semibold transition"
                >
                  Publish
                </button>
              ) : (
                <button 
                  onClick={() => handleUnpublish(test.id)} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition"
                  title="Unpublish test (hide from students)"
                >
                  Unpublish
                </button>
              )}
              <button 
                onClick={() => handleDelete(test.id)} 
                className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                title="Delete Test"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {tests.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No tests created yet. Tap "Create New Test" to get started.
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] dark:bg-slate-850 border-b border-[#E2E8F0] dark:border-slate-800 text-xs uppercase font-bold tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Test Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#E2E8F0] dark:divide-slate-800">
              {tests.map(test => (
                <tr key={test.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{test.title}</span>
                    {(test.subject_name || test.chapter_name) && (
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {test.subject_name}{test.chapter_name ? ` • ${test.chapter_name}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 capitalize text-xs">
                    <div>{test.type?.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{test.question_count || test.questions?.length || 0} Questions</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">
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
                        <Calendar size={13}/> Always Available
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    {test.duration_minutes} min
                  </td>
                  <td className="p-4">
                    {test.status === 'published' ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex w-fit items-center gap-1">
                        <CheckCircle size={12}/> Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex w-fit items-center gap-1">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end items-center gap-2">
                    {test.status === 'draft' ? (
                      <button 
                        onClick={() => handlePublish(test.id)} 
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-semibold transition"
                      >
                        Publish
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUnpublish(test.id)} 
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition"
                        title="Unpublish test (hide from students)"
                      >
                        Unpublish
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(test.id)} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Test"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}

              {tests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 text-xs">
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
