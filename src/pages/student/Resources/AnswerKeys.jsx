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
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
            <Sparkles size={13} /> Official Answer Sets
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Examination Answer Keys
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verify your answers, check grading keys, and analyze step-by-step scoring.
          </p>
        </div>

        <Link 
          to="/student/resources"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors min-h-[40px]"
        >
          <ArrowLeft size={16} />
          <span>All Resources</span>
        </Link>
      </div>

      {/* Answer Keys List */}
      <div className="space-y-3.5 sm:space-y-4">
        {keys.map(keyDoc => {
          const linkedPaper = papers.find(p => p.id === keyDoc.paper_id);
          const viewUrl = keyDoc.file_path ? (keyDoc.file_path.startsWith('http') ? keyDoc.file_path : `${API_URL}${keyDoc.file_path}`) : (keyDoc.external_url || '');
          const downloadUrl = `${API_URL}/api/resources/${keyDoc.id}/download`;

          return (
            <div 
              key={keyDoc.id} 
              className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <FileCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {keyDoc.title}
                  </h2>
                  {linkedPaper ? (
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                      <LinkIcon size={12} className="shrink-0" /> Official Key for: {linkedPaper.title}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {keyDoc.description || 'Independent Answer Key Document'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/60">
                <a 
                  href={viewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  <Eye size={16} /> 
                  <span>View Key</span>
                </a>
                <a 
                  href={downloadUrl} 
                  download 
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  <Download size={16} /> 
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}

        {keys.length === 0 && (
          <div className="p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
            <p className="text-slate-500 text-sm font-medium">No official answer keys currently published.</p>
          </div>
        )}
      </div>
    </div>
  );
}
