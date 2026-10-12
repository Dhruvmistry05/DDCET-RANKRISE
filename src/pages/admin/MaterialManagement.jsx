import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { UploadCloud, File, Trash2, ExternalLink, Plus, BookOpen, Layers } from 'lucide-react';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  const [formData, setFormData] = useState({
    title: '', type: 'pdf', description: '', reference_url: '',
    subject_id: '', chapter_id: '', topic_id: '', published: true
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mat, sub, chap, top] = await Promise.all([
        fetch(`${API_URL}/api/materials`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(mat)) setMaterials(mat);
      if (Array.isArray(sub)) setSubjects(sub);
      if (Array.isArray(chap)) setChapters(chap);
      if (Array.isArray(top)) setTopics(top);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('file', file);

    try {
      await fetch(`${API_URL}/api/materials`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      setFormData({ title: '', type: 'pdf', description: '', reference_url: '', subject_id: '', chapter_id: '', topic_id: '', published: true });
      setFile(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    try {
      await fetch(`${API_URL}/api/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Study Materials Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Attach notes, formula sheets, reference links, and chapter guides.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        
        {/* ADD MATERIAL FORM */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 h-fit space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            <span>Upload New Material</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Document Title *
              </label>
              <input 
                required 
                type="text" 
                className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Thermodynamics Chapter Summary" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Format *
                </label>
                <select 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="link">Web Reference Link</option>
                  <option value="video">Video Tutorial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select 
                  required 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.subject_id} 
                  onChange={e => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Chapter (Optional)
                </label>
                <select 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none min-h-[44px]" 
                  value={formData.chapter_id} 
                  onChange={e => setFormData({...formData, chapter_id: e.target.value})}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => !formData.subject_id || c.subject_id == formData.subject_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Topic (Optional)
                </label>
                <select 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none min-h-[44px]" 
                  value={formData.topic_id} 
                  onChange={e => setFormData({...formData, topic_id: e.target.value})}
                >
                  <option value="">Select Topic</option>
                  {topics.filter(t => !formData.chapter_id || t.chapter_id == formData.chapter_id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.type === 'pdf' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  PDF File *
                </label>
                <input 
                  required 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  className="w-full p-2 border border-dashed rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700" 
                  onChange={e => setFile(e.target.files[0])} 
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  External URL *
                </label>
                <input 
                  required 
                  type="url" 
                  className="w-full p-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.reference_url} 
                  onChange={e => setFormData({...formData, reference_url: e.target.value})} 
                  placeholder="https://..." 
                />
              </div>
            )}

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
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-60 min-h-[44px]"
            >
              {loading ? 'Uploading...' : 'Save & Publish Material'}
            </button>
          </form>
        </div>

        {/* MATERIALS LIST COLUMN */}
        <div className="xl:col-span-2 space-y-3">
          
          {/* Mobile Card List (< md) */}
          <div className="block md:hidden space-y-2.5">
            {materials.map(item => (
              <div 
                key={item.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {item.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  <span>{subjects.find(s=>s.id == item.subject_id)?.name || 'General'}</span>
                  {item.chapter_id && <span> • {chapters.find(c=>c.id == item.chapter_id)?.name}</span>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    {item.file_path ? (
                      <a 
                        href={item.file_path.startsWith('http') ? item.file_path : `${API_URL}${item.file_path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1"
                      >
                        <File size={14}/> View PDF
                      </a>
                    ) : (
                      <a 
                        href={item.reference_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1"
                      >
                        <ExternalLink size={14}/> Open URL
                      </a>
                    )}
                  </div>

                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}

            {materials.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                No materials uploaded yet.
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-xs font-bold text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Resource</th>
                  <th className="px-5 py-3.5">Curriculum Location</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {materials.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{item.title}</td>
                    <td className="px-5 py-3.5">
                      {item.file_path ? (
                        <a 
                          href={item.file_path.startsWith('http') ? item.file_path : `${API_URL}${item.file_path}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1"
                        >
                          <File size={15}/> View PDF
                        </a>
                      ) : (
                        <a 
                          href={item.reference_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1"
                        >
                          <ExternalLink size={15}/> Link
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      <div>{subjects.find(s=>s.id == item.subject_id)?.name || 'N/A'}</div>
                      {item.chapter_id && <div className="text-[11px] text-slate-400">{chapters.find(c=>c.id == item.chapter_id)?.name}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.published ? (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">Pub</span>
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">Draft</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}

                {materials.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500">
                      No materials found. Upload your first document above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
