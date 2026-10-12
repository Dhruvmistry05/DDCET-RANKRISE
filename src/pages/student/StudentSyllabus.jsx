import { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronRight, ChevronDown, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function StudentSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/student/syllabus`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSyllabus(data);
          if (data.length > 0) setExpandedSubject(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading curriculum syllabus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60">
          <Sparkles size={13} /> Official DDCET Blueprint
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Syllabus & Learning Roadmaps
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Browse chapters, topic breakdowns, and linked study materials aligned with the latest DDCET examination standards.
        </p>
      </div>

      {/* Subjects Accordion List */}
      <div className="space-y-3.5 sm:space-y-4">
        {syllabus.map(subject => (
          <div 
            key={subject.id} 
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs hover:shadow-sm transition-all"
          >
            <button 
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              className="w-full flex items-center justify-between p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {subject.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subject.chapters?.length || 0} Chapters Included
                  </p>
                </div>
              </div>

              <div className="shrink-0 p-1 rounded-lg text-slate-400">
                {expandedSubject === subject.id ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
              </div>
            </button>

            {expandedSubject === subject.id && (
              <div className="p-4 sm:p-6 border-t border-slate-200/80 dark:border-slate-700/80 space-y-5 bg-white dark:bg-slate-800">
                {subject.chapters?.map((chapter, index) => (
                  <div key={chapter.id} className="flex gap-3 sm:gap-4">
                    
                    {/* Index Timeline Indicator */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-700 my-1.5" />
                    </div>

                    {/* Chapter Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {chapter.name}
                        </h3>
                        {chapter.question_count > 0 && (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                            {chapter.question_count} Practice MCQs
                          </span>
                        )}
                      </div>
                      
                      {chapter.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                          {chapter.description}
                        </p>
                      )}
                      
                      {/* Topic Rows */}
                      <div className="space-y-2 mt-3">
                        {chapter.topics?.map(topic => (
                          <div 
                            key={topic.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40"
                          >
                            <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                              {topic.name}
                            </span>
                            
                            {topic.materials && topic.materials.length > 0 && (
                              <div className="flex flex-wrap gap-2 shrink-0">
                                {topic.materials.map(m => {
                                  const link = m.file_path 
                                    ? (m.file_path.startsWith('http') ? m.file_path : `${API_URL}${m.file_path}`) 
                                    : m.reference_url;
                                  return (
                                    <a 
                                      key={m.id} 
                                      href={link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-200/60 dark:border-blue-800/40 min-h-[32px]"
                                    >
                                      <FileText size={13} />
                                      <span>{m.type === 'pdf' ? 'PDF Notes' : 'Study Link'}</span>
                                      <ExternalLink size={11} className="opacity-70" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}

                        {(!chapter.topics || chapter.topics.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No specific sub-topics published yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(!subject.chapters || subject.chapters.length === 0) && (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-4">No chapters published yet for this subject.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {syllabus.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Curriculum Not Available</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              The syllabus is currently being organized. Please check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
