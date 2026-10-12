import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { UploadCloud, FileText, Trash2, ExternalLink, Filter } from 'lucide-react';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [papers, setPapers] = useState([]);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: '', description: '', type: 'question_paper', exam_year: '', paper_id: '', published: true
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setResources(data);
      setPapers(data.filter(r => r.type === 'question_paper'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF file to upload.");

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('file', file);

    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      setFormData({ title: '', description: '', type: 'question_paper', exam_year: '', paper_id: '', published: true });
      setFile(null);
      // reset file input
      document.getElementById('file-upload').value = '';
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/resources/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'question_paper': return 'Question Paper';
      case 'answer_key': return 'Answer Key';
      case 'syllabus': return 'Syllabus';
      default: return type;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Official Resources Management</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <UploadCloud size={24} className="text-indigo-500" /> Upload Resource
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input required type="text" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. DDCET 2025 Syllabus" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Resource Type</label>
              <select className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, paper_id: ''})}>
                <option value="question_paper">Question Paper</option>
                <option value="answer_key">Answer Key</option>
                <option value="syllabus">Syllabus</option>
              </select>
            </div>

            {(formData.type === 'question_paper' || formData.type === 'answer_key') && (
              <div>
                <label className="block text-sm font-medium mb-1">Examination Year</label>
                <input type="number" min="2000" max="2099" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.exam_year} onChange={e => setFormData({...formData, exam_year: e.target.value})} placeholder="e.g. 2024" />
              </div>
            )}

            {formData.type === 'answer_key' && (
              <div>
                <label className="block text-sm font-medium mb-1">Link to Question Paper</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={formData.paper_id} onChange={e => setFormData({...formData, paper_id: e.target.value})}>
                  <option value="">-- Select Question Paper --</option>
                  {papers.map(p => <option key={p.id} value={p.id}>{p.title} {p.exam_year ? `(${p.exam_year})` : ''}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <textarea className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload PDF</label>
              <input id="file-upload" required type="file" accept=".pdf" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" onChange={e => setFile(e.target.files[0])} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" className="w-5 h-5" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span className="font-medium text-slate-800 dark:text-white">Publish Immediately</span>
            </label>

            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Save Resource
            </button>
          </form>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-xs text-slate-500">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {resources.map(item => (
                  <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      {item.type === 'answer_key' && item.paper_id && (
                        <div className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                          Linked to: {papers.find(p => p.id === item.paper_id)?.title || 'Unknown Paper'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-medium">
                        {getTypeName(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.exam_year || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {item.published ? <span className="text-green-600 font-bold">Pub</span> : <span className="text-orange-500 font-bold">Draft</span>}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <a href={item.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + item.file_path : ''} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600" title="View PDF">
                        <FileText size={18} />
                      </a>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600" title="Delete">
                        <Trash2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No resources uploaded yet.</td>
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


