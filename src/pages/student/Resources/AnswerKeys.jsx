import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { FileCheck, Download, Eye, Link as LinkIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnswerKeys() {
  const [keys, setKeys] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/resources?type=answer_key&publishedOnly=true`, { 
        headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
      }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/resources?type=question_paper&publishedOnly=true`, { 
        headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
      }).then(r => r.json()).catch(() => []),
    ]).then(([keysData, papersData]) => {
      if (Array.isArray(keysData)) setKeys(keysData);
      if (Array.isArray(papersData)) setPapers(papersData);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading official answer keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <FileCheck size={13} className="text-emerald-600" /> Official Solutions
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Official Exam Answer Keys
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verify question solutions, marking keys, and official grading criteria.
          </p>
        </div>

        <Link 
          to="/student/resources"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={14} />
          <span>All Resources</span>
        </Link>
      </div>

      {/* Answer Keys List */}
      <div className="space-y-3">
        {keys.map(keyDoc => {
          const linkedPaper = papers.find(p => p.id === keyDoc.paper_id);
          const viewUrl = keyDoc.file_path ? (keyDoc.file_path.startsWith('http') ? keyDoc.file_path : `${API_URL}${keyDoc.file_path}`) : (keyDoc.external_url || '');
          const downloadUrl = `${API_URL}/api/resources/${keyDoc.id}/download`;

          return (
            <div 
              key={keyDoc.id} 
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-lg flex items-center justify-center shrink-0">
                  <FileCheck size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {keyDoc.title}
                  </h2>
                  {linkedPaper ? (
                    <p className="text-xs text-[#2563EB] dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                      <LinkIcon size={12} className="shrink-0" /> Verified solution for: {linkedPaper.title}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                      {keyDoc.description || 'Certified answer key document'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E8F0] dark:border-slate-800">
                <a 
                  href={viewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 rounded-lg font-semibold text-xs transition"
                >
                  <Eye size={14} /> 
                  <span>View Key</span>
                </a>
                <a 
                  href={downloadUrl} 
                  download 
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs transition shadow-xs"
                >
                  <Download size={14} /> 
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}

        {keys.length === 0 && (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <p className="text-slate-500 text-xs font-medium">No official answer keys currently published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
