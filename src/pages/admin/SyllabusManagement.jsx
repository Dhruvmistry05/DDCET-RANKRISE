import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, BookOpen, Layers, Bookmark } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';

export default function SyllabusManagement() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);

  const [activeTab, setActiveTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  // Form states
  const [formData, setFormData] = useState({ name: '', display_order: 0, published: false, subject_id: '', chapter_id: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, chapRes, topRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(res => res.json()).catch(() => [])
      ]);
      if (Array.isArray(subRes)) setSubjects(subRes);
      if (Array.isArray(chapRes)) setChapters(chapRes);
      if (Array.isArray(topRes)) setTopics(topRes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = `${API_URL}/api/${activeTab}`;
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
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}? All child records will be affected.`)) return;
    try {
      await fetch(`${API_URL}/api/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList = activeTab === 'subjects' ? subjects : activeTab === 'chapters' ? chapters : topics;

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Curriculum & Syllabus Structure
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage DDCET subjects, chapters, and nested learning topics.
        </p>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-fit border border-slate-200/80 dark:border-slate-700/80">
        {[
          { key: 'subjects', label: 'Subjects', icon: BookOpen },
          { key: 'chapters', label: 'Chapters', icon: Layers },
          { key: 'topics', label: 'Topics', icon: Bookmark },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button 
              key={tab.key} 
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[40px] ${
                isActive 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* ADD FORM COLUMN */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 h-fit space-y-4">
          <h2 className="text-base sm:text-lg font-bold capitalize text-slate-900 dark:text-white">
            Add New {activeTab.slice(0, -1)}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'chapters' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent Subject *
                </label>
                <select 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required 
                  value={formData.subject_id} 
                  onChange={e => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'topics' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent Chapter *
                </label>
                <select 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required 
                  value={formData.chapter_id} 
                  onChange={e => setFormData({...formData, chapter_id: e.target.value})}
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Name / Title *
              </label>
              <input 
                type="text" 
                required 
                className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder={`Name of ${activeTab.slice(0, -1)}`}
              />
            </div>

            {activeTab === 'chapters' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                  rows="2"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Display Order
              </label>
              <input 
                type="number" 
                className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                value={formData.display_order} 
                onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} 
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded" 
                checked={formData.published} 
                onChange={e => setFormData({...formData, published: e.target.checked})} 
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Publish Immediately</span>
            </label>

            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Plus size={18} /> 
              <span>Save {activeTab.slice(0, -1)}</span>
            </button>
          </form>
        </div>

        {/* LIST COLUMN */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading catalog...</div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden space-y-2.5">
                {currentList.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {activeTab === 'chapters' && (
                          <span>{subjects.find(s => s.id == item.subject_id)?.name}</span>
                        )}
                        {activeTab === 'topics' && (
                          <span>{chapters.find(c => c.id == item.chapter_id)?.name}</span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded font-bold ${item.published ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {item.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {currentList.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                    No {activeTab} added yet. Use the form to create your first entry.
                  </div>
                )}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-5 py-3.5">Name</th>
                      {activeTab !== 'subjects' && <th className="px-5 py-3.5">Parent</th>}
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-center">Order</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {currentList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        {activeTab === 'chapters' && <td className="px-5 py-3.5 text-xs">{subjects.find(s => s.id == item.subject_id)?.name}</td>}
                        {activeTab === 'topics' && <td className="px-5 py-3.5 text-xs">{chapters.find(c => c.id == item.chapter_id)?.name}</td>}
                        <td className="px-5 py-3.5 text-center">
                          {item.published ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">Published</span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-2.5 py-0.5 rounded-full text-xs font-bold">Draft</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-xs">{item.display_order}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentList.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-slate-500">No {activeTab} found. Add one to get started!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
