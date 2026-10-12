import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { UploadCloud, File, Trash2, ExternalLink } from 'lucide-react';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: '', type: 'pdf', description: '', reference_url: '',
    subject_id: '', chapter_id: '', topic_id: '', published: true
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mat, sub, chap, top] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/materials').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/subjects').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/chapters').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/topics').then(r => r.json())
      ]);
      setMaterials(mat); setSubjects(sub); setChapters(chap); setTopics(top);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('file', file);

    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/materials', {
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
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this material?")) return;
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Study Material Management</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <UploadCloud size={24} className="text-indigo-500" /> Add Material
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required type="text" className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="pdf">PDF File</option>
                  <option value="link">Reference Link</option>
                  <option value="video">Video Link</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chapter (Optional)</label>
                <select className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.chapter_id} onChange={e => setFormData({...formData, chapter_id: e.target.value})}>
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => c.subject_id == formData.subject_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Topic (Optional)</label>
                <select className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.topic_id} onChange={e => setFormData({...formData, topic_id: e.target.value})}>
                  <option value="">Select Topic</option>
                  {topics.filter(t => t.chapter_id == formData.chapter_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {formData.type === 'pdf' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Upload File (PDF/Image)</label>
                <input required type="file" accept=".pdf,image/*" className="w-full p-2 border rounded-lg dark:bg-slate-900" onChange={e => setFile(e.target.files[0])} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">URL Link</label>
                <input required type="url" className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.reference_url} onChange={e => setFormData({...formData, reference_url: e.target.value})} placeholder="https://..." />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" className="w-5 h-5" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span className="font-medium">Published</span>
            </label>

            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Upload Material
            </button>
          </form>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Link/File</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(item => (
                  <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                    <td className="px-6 py-4 font-bold">{item.title}</td>
                    <td className="px-6 py-4">
                      {item.file_path ? (
                        <a href={item.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + item.file_path : ''} target="_blank" rel="noreferrer" className="text-blue-500 flex items-center gap-1"><File size={16}/> View File</a>
                      ) : (
                        <a href={item.reference_url} target="_blank" rel="noreferrer" className="text-purple-500 flex items-center gap-1"><ExternalLink size={16}/> Open Link</a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {subjects.find(s=>s.id == item.subject_id)?.name || 'N/A'}
                      {item.chapter_id && <div className="text-xs text-slate-500">{chapters.find(c=>c.id == item.chapter_id)?.name}</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.published ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Pub</span> : <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold">Draft</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


