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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold mb-2.5 border border-slate-200 dark:border-slate-700">
          <BookOpen size={13} className="text-blue-600" />
          <span>Curriculum Blueprint</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
          Official DDCET Syllabus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          Download and inspect verified ACPC syllabus specifications, subject blueprints, and mark distribution guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {syllabusDocs.map(doc => {
          const fileUrl = doc.file_path
            ? (doc.file_path.startsWith('http') ? doc.file_path : `${API_BASE}${doc.file_path}`)
            : '';
          const downloadUrl = `${API_BASE}/api/resources/${doc.id}/download`;

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 border border-blue-100 dark:border-blue-900 rounded-lg flex items-center justify-center shrink-0">
                    <File size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {doc.title}
                    </h2>
                    {doc.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] hover:bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <ExternalLink size={14} /> Open in Tab
                    </a>
                  )}
                  <a
                    href={downloadUrl}
                    download
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </div>
              </div>

              {/* Mobile Quick Action Banner */}
              <div className="sm:hidden p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open the document in fullscreen or download for offline revision.
                </p>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                  >
                    <BookOpen size={14} /> View Fullscreen PDF
                  </a>
                )}
              </div>

              {/* Desktop/Tablet Embedded PDF Viewer */}
              <div className="hidden sm:block bg-slate-100 dark:bg-slate-950 w-full h-[600px] lg:h-[700px]">
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
                        className="text-blue-600 dark:text-blue-400 underline font-semibold text-xs"
                      >
                        Click here to view PDF in a new tab
                      </a>
                    </div>
                  </object>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    No PDF file attached
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {syllabusDocs.length === 0 && (
          <div className="p-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-2">
            <BookOpen size={30} className="mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Official Syllabus Available Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The syllabus PDF will appear here once published by administrators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


