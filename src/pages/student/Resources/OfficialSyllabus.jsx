import { useState, useEffect } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { File, Download, ExternalLink, BookOpen, Sparkles } from 'lucide-react';

export default function OfficialSyllabus() {
  const [syllabusDocs, setSyllabusDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_BASE = API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/api/resources?type=syllabus&publishedOnly=true`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setSyllabusDocs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setSyllabusDocs([]);
        setLoading(false);
      });
  }, [token, API_BASE]);

  if (loading) {
    return (
      <div className="p-8 sm:p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Loading Official Syllabus...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold mb-3 border border-amber-200/60 dark:border-amber-800/60">
          <Sparkles size={13} />
          <span>Official ACPC / DDCET Blueprint</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          Official DDCET Syllabus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          View and download the verified official syllabus documents, mark distribution, and chapter weightage guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {syllabusDocs.map(doc => {
          const fileUrl = doc.file_path
            ? (doc.file_path.startsWith('http') ? doc.file_path : `${API_BASE}${doc.file_path}`)
            : '';
          const downloadUrl = `${API_BASE}/api/resources/${doc.id}/download`;

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <File size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">
                      {doc.title}
                    </h2>
                    {doc.description && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition"
                    >
                      <ExternalLink size={15} /> Open Tab
                    </a>
                  )}
                  <a
                    href={downloadUrl}
                    download
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs sm:text-sm font-bold min-h-[44px] shadow-sm transition"
                  >
                    <Download size={15} /> Download PDF
                  </a>
                </div>
              </div>

              {/* Mobile Quick Action Banner */}
              <div className="sm:hidden p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-center space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For the best viewing experience on mobile phones, open the PDF directly or download for offline study.
                </p>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20"
                  >
                    <BookOpen size={16} /> View Fullscreen PDF
                  </a>
                )}
              </div>

              {/* Desktop/Tablet Embedded PDF Viewer */}
              <div className="hidden sm:block bg-slate-100 dark:bg-slate-900 w-full h-[600px] lg:h-[700px]">
                {fileUrl ? (
                  <object
                    data={fileUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                  >
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center space-y-2">
                      <p className="text-sm font-medium">Your browser does not support embedded PDFs.</p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 underline font-bold text-sm"
                      >
                        Click here to view PDF in a new tab
                      </a>
                    </div>
                  </object>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No PDF file attached
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {syllabusDocs.length === 0 && (
          <div className="p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-800 space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Official Syllabus Available Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              The syllabus PDF will appear here once published by the administrators. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


