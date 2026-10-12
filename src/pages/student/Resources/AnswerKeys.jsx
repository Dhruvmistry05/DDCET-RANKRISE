import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { FileCheck, Download, Eye, Link as LinkIcon } from 'lucide-react';

export default function AnswerKeys() {
  const [keys, setKeys] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    Promise.all([
      fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources?type=answer_key&publishedOnly=true', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources?type=question_paper&publishedOnly=true', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([keysData, papersData]) => {
      setKeys(keysData);
      setPapers(papersData);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Official Answer Keys...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Official Answer Keys</h1>
        <p className="text-slate-500 dark:text-slate-400">Verify your answers using official DDCET answer keys.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {keys.map(keyDoc => {
          const linkedPaper = papers.find(p => p.id === keyDoc.paper_id);
          return (
            <div key={keyDoc.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{keyDoc.title}</h2>
                  {linkedPaper ? (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <LinkIcon size={14} /> Official key for: {linkedPaper.title}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">{keyDoc.description || 'Independent Answer Key'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 shrink-0">
                <a href={keyDoc.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + keyDoc.file_path : ''} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold transition-colors">
                  <Eye size={18} /> View
                </a>
                <a href={keyDoc.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + keyDoc.file_path : ''} download className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                  <Download size={18} /> Download
                </a>
              </div>
            </div>
          );
        })}

        {keys.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <p className="text-slate-500 text-lg">No official answer keys currently available.</p>
          </div>
        )}
      </div>
    </div>
  );
}


