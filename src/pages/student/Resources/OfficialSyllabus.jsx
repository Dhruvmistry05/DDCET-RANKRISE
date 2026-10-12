import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { File, Download, Eye } from 'lucide-react';

export default function OfficialSyllabus() {
  const [syllabusDocs, setSyllabusDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/resources?type=syllabus&publishedOnly=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSyllabusDocs(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Official Syllabus...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Official DDCET Syllabus</h1>
        <p className="text-slate-500 dark:text-slate-400">View and download the original official syllabus documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {syllabusDocs.map(doc => (
          <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <File size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{doc.title}</h2>
                  {doc.description && <p className="text-sm text-slate-500">{doc.description}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <a href={doc.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + doc.file_path : ''} download className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">
                  <Download size={18} /> Download PDF
                </a>
              </div>
            </div>
            {/* Embedded PDF Viewer */}
            <div className="bg-slate-100 dark:bg-slate-900 w-full h-[600px]">
              <object data={doc.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + doc.file_path : ''} type="application/pdf" width="100%" height="100%">
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <p>Your browser does not support embedded PDFs.</p>
                  <a href={doc.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + doc.file_path : ''} target="_blank" rel="noreferrer" className="text-blue-500 underline mt-2">Click here to view it</a>
                </div>
              </object>
            </div>
          </div>
        ))}

        {syllabusDocs.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <p className="text-slate-500 text-lg">Official syllabus PDF is not yet available.</p>
          </div>
        )}
      </div>
    </div>
  );
}


