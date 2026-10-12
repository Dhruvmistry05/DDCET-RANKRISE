import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { FileText, Download, Eye, Calendar, Filter } from 'lucide-react';

export default function PreviousPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources?type=question_paper&publishedOnly=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPapers(data);
        setLoading(false);
      });
  }, [token]);

  const filteredPapers = yearFilter ? papers.filter(p => p.exam_year?.toString() === yearFilter) : papers;
  const years = [...new Set(papers.map(p => p.exam_year).filter(Boolean))].sort((a, b) => b - a);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Previous Year Papers...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Previous Year Papers</h1>
        <p className="text-slate-500 dark:text-slate-400">Access official past DDCET question papers.</p>
      </div>

      {years.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
          <Filter size={18} className="text-slate-400" />
          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Filter by Year:</span>
          <select 
            className="p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-sm"
            value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPapers.map(paper => (
          <div key={paper.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                {paper.exam_year && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Calendar size={14}/> {paper.exam_year}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{paper.title}</h2>
              {paper.description && <p className="text-sm text-slate-500 mb-6">{paper.description}</p>}
            </div>
            
            <div className="flex gap-3 mt-4">
              <a href={paper.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + paper.file_path : ''} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition-colors">
                <Eye size={18} /> View
              </a>
              <a href={paper.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + paper.file_path : ''} download className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                <Download size={18} /> Download
              </a>
            </div>
          </div>
        ))}

        {filteredPapers.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <p className="text-slate-500 text-lg">No papers currently available for this selection.</p>
          </div>
        )}
      </div>
    </div>
  );
}


