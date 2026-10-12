import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Play, CheckCircle, Trash2, Clock, Calendar } from 'lucide-react';

export default function TestManagement() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/tests', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      // Sort descending by id (newest first)
      setTests(data.sort((a,b) => b.id - a.id));
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublish = async (id) => {
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/tests/${id}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/tests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTests();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Tests...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Live Test Management</h1>
          <Link to="/admin/tests/create" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Create New Test
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-5">Test Title</th>
                <th className="p-5">Type</th>
                <th className="p-5">Schedule</th>
                <th className="p-5">Duration</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tests.map(test => (
                <tr key={test.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-5 font-bold text-slate-800 dark:text-white">{test.title}</td>
                  <td className="p-5 text-slate-600 dark:text-slate-400 capitalize">
                    {test.type.replace('_', ' ')}
                  </td>
                  <td className="p-5 text-slate-600 dark:text-slate-400">
                    {test.type === 'scheduled_live' ? (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1"><Play size={12} className="text-green-500"/> {new Date(test.scheduled_start_time).toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-slate-400"><Clock size={12}/> {new Date(test.scheduled_end_time).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400"><Calendar size={14}/> Always Available</span>
                    )}
                  </td>
                  <td className="p-5 text-slate-600 dark:text-slate-400 font-medium">
                    {test.duration_minutes} min
                  </td>
                  <td className="p-5">
                    {test.status === 'published' ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 flex w-fit items-center gap-1">
                        <CheckCircle size={14}/> Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 flex w-fit items-center gap-1">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-right flex justify-end gap-2">
                    {test.status === 'draft' && (
                      <button onClick={() => handlePublish(test.id)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors">
                        Publish
                      </button>
                    )}
                    <button onClick={() => handleDelete(test.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 border-b-0">
                    No tests found. Click "Create New Test" to build one.
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
