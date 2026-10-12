import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function SyllabusManagement() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);

  const [activeTab, setActiveTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Form states
  const [formData, setFormData] = useState({ name: '', display_order: 0, published: false, subject_id: '', chapter_id: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, chapRes, topRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/subjects').then(res => res.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/chapters').then(res => res.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/topics').then(res => res.json())
      ]);
      setSubjects(subRes);
      setChapters(chapRes);
      setTopics(topRes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = `/api/${activeTab}`;
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', display_order: 0, published: false, subject_id: '', chapter_id: '', description: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Syllabus Management</h1>
      
      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
        {['subjects', 'chapters', 'topics'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold rounded-t-lg capitalize transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 capitalize text-slate-800 dark:text-white">Add New {activeTab.slice(0, -1)}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === 'chapters' && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Subject</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                  required value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'topics' && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Chapter</label>
                <select 
                  className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700"
                  required value={formData.chapter_id} onChange={e => setFormData({...formData, chapter_id: e.target.value})}
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" required className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            {activeTab === 'chapters' && (
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input type="number" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} />
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span className="font-medium text-slate-700 dark:text-slate-300">Published</span>
            </label>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus size={20} /> Save {activeTab.slice(0, -1)}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-center py-10">Loading...</p>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    {activeTab !== 'subjects' && <th className="px-6 py-4">Parent</th>}
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Order</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'subjects' ? subjects : activeTab === 'chapters' ? chapters : topics).map(item => (
                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                      {activeTab === 'chapters' && <td className="px-6 py-4">{subjects.find(s => s.id == item.subject_id)?.name}</td>}
                      {activeTab === 'topics' && <td className="px-6 py-4">{chapters.find(c => c.id == item.chapter_id)?.name}</td>}
                      <td className="px-6 py-4 text-center">
                        {item.published ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Published</span> : <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">Draft</span>}
                      </td>
                      <td className="px-6 py-4 text-center">{item.display_order}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'subjects' ? subjects : activeTab === 'chapters' ? chapters : topics).length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No {activeTab} found. Add one to get started!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

