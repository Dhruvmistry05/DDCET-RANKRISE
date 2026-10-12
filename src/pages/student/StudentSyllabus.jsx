import { useState, useEffect } from 'react';
import { BookOpen, FileText, ChevronRight, ChevronDown, CheckCircle } from 'lucide-react';

export default function StudentSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/student/syllabus')
      .then(res => res.json())
      .then(data => {
        setSyllabus(data);
        if (data.length > 0) setExpandedSubject(data[0].id);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your syllabus...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">DDCET Syllabus</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your learning progress and access study materials.</p>
      </div>

      <div className="space-y-4">
        {syllabus.map(subject => (
          <div key={subject.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <button 
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              className="w-full flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{subject.name}</h2>
                  <p className="text-sm text-slate-500">{subject.chapters.length} Chapters</p>
                </div>
              </div>
              {expandedSubject === subject.id ? <ChevronDown size={24} className="text-slate-400" /> : <ChevronRight size={24} className="text-slate-400" />}
            </button>

            {expandedSubject === subject.id && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                {subject.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-700 my-2"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{chapter.name}</h3>
                        {chapter.question_count > 0 && (
                          <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer hover:bg-orange-200 transition-colors">
                            {chapter.question_count} Practice MCQs
                          </span>
                        )}
                      </div>
                      {chapter.description && <p className="text-slate-500 text-sm mb-3">{chapter.description}</p>}
                      
                      <div className="space-y-2 mt-4">
                        {chapter.topics.map(topic => (
                          <div key={topic.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{topic.name}</span>
                            <div className="flex gap-2">
                              {topic.materials.map(m => (
                                <a key={m.id} href={m.file_path ? (import.meta.env.VITE_API_URL || 'http://localhost:3001') + m.file_path : m.reference_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <FileText size={14}/> {m.type === 'pdf' ? 'PDF' : 'Notes'}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                        {chapter.topics.length === 0 && <p className="text-sm text-slate-400 italic">No topics added yet.</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {subject.chapters.length === 0 && <p className="text-slate-500 text-center py-4">No chapters published yet.</p>}
              </div>
            )}
          </div>
        ))}
        {syllabus.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No syllabus published yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

