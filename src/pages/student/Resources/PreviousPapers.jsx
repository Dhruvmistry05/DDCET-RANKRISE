import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { FileText, Download, Eye, Calendar, Filter, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PreviousPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/resources?type=question_paper&publishedOnly=true`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPapers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredPapers = yearFilter ? papers.filter(p => String(p.exam_year) === yearFilter) : papers;
  const years = [...new Set(papers.map(p => p.exam_year).filter(Boolean))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading previous question papers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60">
            <Sparkles size={13} /> Archived Examinations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Previous Year Question Papers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Access certified past DDCET examination question papers for realistic offline test solving.
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

      {/* Year Filter Chip Bar */}
      {years.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 w-full sm:w-fit">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 shrink-0">Filter by Year:</span>
          <select 
            className="p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none min-h-[38px]"
            value={yearFilter} 
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Archived Years</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {filteredPapers.map(paper => {
          const viewUrl = paper.file_path ? (paper.file_path.startsWith('http') ? paper.file_path : `${API_URL}${paper.file_path}`) : '';
          const downloadUrl = `${API_URL}/api/resources/${paper.id}/download`;

          return (
            <div 
              key={paper.id} 
              className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  {paper.exam_year && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Calendar size={13}/> {paper.exam_year}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {paper.title}
                </h2>
                
                {paper.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {paper.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <a 
                  href={viewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  <Eye size={16} /> 
                  <span>View PDF</span>
                </a>
                <a 
                  href={downloadUrl} 
                  download 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  <Download size={16} /> 
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="col-span-full p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
            <p className="text-slate-500 text-sm font-medium">No question papers match the selected year filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
