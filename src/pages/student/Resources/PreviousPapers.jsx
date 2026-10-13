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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <FileText size={13} className="text-blue-600" /> Previous Question Papers
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Past DDCET Exam Papers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Download and practice certified previous year question papers for diploma engineering.
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

      {/* Year Filter Chip Bar */}
      {years.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 w-full sm:w-fit">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-600 dark:text-slate-300 shrink-0">Filter by Year:</span>
          <select 
            className="p-1.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] dark:bg-slate-800 dark:border-slate-700 text-xs font-semibold outline-hidden focus:border-[#2563EB] flex-1 sm:flex-none"
            value={yearFilter} 
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Archived Years</option>
            {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPapers.map(paper => {
          const viewUrl = paper.file_path ? (paper.file_path.startsWith('http') ? paper.file_path : `${API_URL}${paper.file_path}`) : '';
          const downloadUrl = `${API_URL}/api/resources/${paper.id}/download`;

          return (
            <div 
              key={paper.id} 
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  {paper.exam_year && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700">
                      <Calendar size={12}/> {paper.exam_year}
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {paper.title}
                </h2>
                
                {paper.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {paper.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                <a 
                  href={viewUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F8FAFC] dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 rounded-lg font-semibold text-xs transition"
                >
                  <Eye size={14} /> 
                  <span>View PDF</span>
                </a>
                <a 
                  href={downloadUrl} 
                  download 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs transition shadow-xs"
                >
                  <Download size={14} /> 
                  <span>Download</span>
                </a>
              </div>
            </div>
          );
        })}

        {filteredPapers.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <p className="text-slate-500 text-xs font-medium">No question papers match the selected year filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
