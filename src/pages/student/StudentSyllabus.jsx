import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ChevronRight, ChevronDown, CheckCircle, ExternalLink, Sparkles, PenTool } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

export default function StudentSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [completedTopicIds, setCompletedTopicIds] = useState(new Set());
  const { token } = useAuth();

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

    if (token) {
      fetch(`${API_URL}/api/student/topic-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.completed_topic_ids)) {
            setCompletedTopicIds(new Set(data.completed_topic_ids.map(Number)));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const toggleTopic = async (topicId) => {
    const isCompleted = completedTopicIds.has(topicId);
    const newSet = new Set(completedTopicIds);
    if (isCompleted) {
      newSet.delete(topicId);
    } else {
      newSet.add(topicId);
    }
    setCompletedTopicIds(newSet);

    if (token) {
      try {
        await fetch(`${API_URL}/api/student/topic-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic_id: topicId,
            completed: !isCompleted
          })
        });
      } catch (err) {
        console.error('Error toggling topic progress:', err);
      }
    }
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Official Examination Blueprint
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Syllabus & Roadmaps
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Browse subjects, chapter breakdowns, and linked study materials aligned with the DDCET examination standards.
        </p>
      </div>

      {/* Subjects Accordion List */}
      <div className="space-y-3.5">
        {syllabus.map(subject => (
          <div 
            key={subject.id} 
            className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 overflow-hidden shadow-xs"
          >
            <button 
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-750 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {subject.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {subject.chapters?.length || 0} Units Included
                  </p>
                </div>
              </div>

              <div className="shrink-0 p-1 text-slate-400">
                {expandedSubject === subject.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {expandedSubject === subject.id && (
              <div className="p-4 sm:p-6 border-t border-[#E2E8F0] dark:border-slate-700 space-y-5 bg-[#F8FAFC]/60 dark:bg-slate-850">
                {subject.chapters?.map((chapter, index) => (
                  <div key={chapter.id} className="flex gap-3 sm:gap-4">
                    
                    {/* Index Indicator */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 w-px bg-[#E2E8F0] dark:bg-slate-700 my-1.5" />
                    </div>

                    {/* Chapter Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {chapter.name}
                        </h3>
                        {chapter.question_count > 0 && (
                          <Link 
                            to={`/student/practice?chapter=${encodeURIComponent(chapter.name)}`}
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 rounded text-xs font-semibold transition-colors shadow-2xs group"
                            title="Start practicing questions for this chapter"
                          >
                            <PenTool size={11} className="text-[#2563EB] group-hover:scale-110 transition-transform" />
                            <span>{chapter.question_count} Practice MCQs</span>
                          </Link>
                        )}
                      </div>
                      
                      {chapter.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                          {chapter.description}
                        </p>
                      )}
                      
                      {/* Topic Rows */}
                      <div className="space-y-2 mt-2.5">
                        {chapter.topics?.map(topic => {
                          const isDone = completedTopicIds.has(topic.id);
                          return (
                            <div 
                              key={topic.id} 
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-lg border transition-colors ${
                                isDone 
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
                                  : 'bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleTopic(topic.id)}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                                    isDone 
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-700 text-transparent hover:text-slate-300'
                                  }`}
                                  title={isDone ? 'Mark topic as incomplete' : 'Mark topic as completed'}
                                >
                                  <CheckCircle size={14} className={isDone ? 'opacity-100' : 'opacity-0 hover:opacity-100'} />
                                </button>
                                <span className={`text-xs sm:text-sm font-semibold truncate ${
                                  isDone 
                                    ? 'text-emerald-950 dark:text-emerald-200 line-through decoration-emerald-500/50' 
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  {topic.name}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {topic.materials && topic.materials.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
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
                                          className="text-[#1E3A8A] dark:text-blue-300 hover:text-blue-700 bg-slate-50 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/50 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-[#E2E8F0] dark:border-slate-600 transition-colors"
                                        >
                                          <FileText size={13} className="text-[#2563EB]" />
                                          <span>{m.type === 'pdf' ? 'Notes (PDF)' : 'Resource'}</span>
                                          <ExternalLink size={11} className="opacity-60" />
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {(!chapter.topics || chapter.topics.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No specific sub-topics published yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {(!subject.chapters || subject.chapters.length === 0) && (
                  <p className="text-xs text-slate-500 text-center py-4">No units published yet for this subject.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {syllabus.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
            <BookOpen size={36} className="mx-auto text-slate-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Curriculum Not Available</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              The syllabus is currently being organized. Please check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
