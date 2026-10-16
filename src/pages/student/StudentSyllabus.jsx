import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, ChevronRight, ChevronDown, CheckCircle, ExternalLink, 
  PenTool, Search, CheckCircle2, Circle, Sparkles, Layers, Award,
  HelpCircle, ArrowRight, BarChart2, BookCheck
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

export default function StudentSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('ALL'); // 'ALL' | 'BE-01' | 'BE-02'
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL'); // 'ALL' or subject.id
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [completedTopicIds, setCompletedTopicIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();

  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/student/syllabus`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSyllabus(data);
          // By default expand first 3 chapters of the first subject
          const defaultExpanded = new Set();
          if (data.length > 0 && data[0].chapters) {
            data[0].chapters.slice(0, 3).forEach(c => defaultExpanded.add(c.id));
          }
          setExpandedChapters(defaultExpanded);
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

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set();
    syllabus.forEach(s => {
      (s.chapters || []).forEach(c => allIds.add(c.id));
    });
    setExpandedChapters(allIds);
  };

  const collapseAll = () => {
    setExpandedChapters(new Set());
  };

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

  // Group syllabus by Section
  const sections = useMemo(() => {
    const be01Subjects = syllabus.filter(s => (s.section_code || '').toUpperCase() === 'BE-01' || s.section_name?.includes('Science'));
    const be02Subjects = syllabus.filter(s => (s.section_code || '').toUpperCase() === 'BE-02' || s.section_name?.includes('Aptitude'));

    return [
      {
        code: 'BE-01',
        title: 'BE-01 — Basics of Science & Engineering',
        subtitle: 'Physics, Chemistry, Computer & Environmental Sciences',
        questions: '50 Questions',
        marks: '100 Marks',
        subjects: be01Subjects
      },
      {
        code: 'BE-02',
        title: 'BE-02 — Aptitude Test (Mathematics & Soft Skill)',
        subtitle: 'Mathematics & English / Soft Skill Communication',
        questions: '50 Questions',
        marks: '100 Marks',
        subjects: be02Subjects
      }
    ];
  }, [syllabus]);

  // Total topics & completed count for stats
  const totalStats = useMemo(() => {
    let totalTopics = 0;
    let completedTopics = 0;
    let totalChapters = 0;

    syllabus.forEach(s => {
      (s.chapters || []).forEach(c => {
        totalChapters++;
        (c.topics || []).forEach(t => {
          totalTopics++;
          if (completedTopicIds.has(t.id)) {
            completedTopics++;
          }
        });
      });
    });

    const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalTopics, completedTopics, totalChapters, percent };
  }, [syllabus, completedTopicIds]);

  // Filtered list based on active section, subject, and search query
  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      if (activeSection !== 'ALL' && sec.code !== activeSection) return false;
      return true;
    }).map(sec => {
      let filteredSubjects = sec.subjects;
      
      if (selectedSubjectId !== 'ALL') {
        filteredSubjects = filteredSubjects.filter(s => String(s.id) === String(selectedSubjectId));
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredSubjects = filteredSubjects.map(s => {
          const matchingChapters = (s.chapters || []).filter(c => {
            const matchChapterName = c.name && c.name.toLowerCase().includes(q);
            const matchTopic = (c.topics || []).some(t => t.name && t.name.toLowerCase().includes(q));
            return matchChapterName || matchTopic;
          });
          return { ...s, chapters: matchingChapters };
        }).filter(s => (s.chapters && s.chapters.length > 0) || (s.name && s.name.toLowerCase().includes(q)));
      }

      return {
        ...sec,
        subjects: filteredSubjects
      };
    }).filter(sec => sec.subjects.length > 0);
  }, [sections, activeSection, selectedSubjectId, searchQuery]);

  // Current available subjects for the secondary filter pills
  const availableSubjects = useMemo(() => {
    if (activeSection === 'ALL') {
      return syllabus;
    }
    const sec = sections.find(s => s.code === activeSection);
    return sec ? sec.subjects : [];
  }, [activeSection, sections, syllabus]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-sm">Loading official DDCET syllabus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] text-xs font-bold border border-blue-200">
              <BookCheck size={14} className="text-[#2563EB]" /> Official GTU Blueprint
            </span>
            <span className="text-xs font-semibold text-slate-400">Exam 2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            DDCET Engineering Syllabus Guide
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Strictly organized hierarchically according to the official GTU syllabus guide. Study chapter-by-chapter and tick off every point to monitor your exam readiness.
          </p>
        </div>

        {/* Blueprint Overview Stats Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Preparation Progress
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
              <span>{totalStats.percent}%</span>
              <span className="text-xs font-medium text-slate-500">
                ({totalStats.completedTopics}/{totalStats.totalTopics} Points)
              </span>
            </div>
            <div className="w-44 bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-[#1E3A8A] h-full rounded-full transition-all duration-300"
                style={{ width: `${totalStats.percent}%` }}
              />
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-300 sm:pl-4 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Total Marks:</span>
              <span className="font-bold text-slate-800">200 Marks</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Questions:</span>
              <span className="font-bold text-slate-800">100 MCQs</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Duration:</span>
              <span className="font-bold text-slate-800">150 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => { setActiveSection('ALL'); setSelectedSubjectId('ALL'); }}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSection === 'ALL'
              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeSection === 'ALL' ? 'text-blue-200' : 'text-slate-400'}`}>
              Full Blueprint
            </span>
            <Layers size={16} className={activeSection === 'ALL' ? 'text-blue-200' : 'text-slate-400'} />
          </div>
          <div className="mt-2">
            <div className="text-base font-bold">All Sections Overview</div>
            <div className={`text-xs mt-0.5 ${activeSection === 'ALL' ? 'text-blue-100' : 'text-slate-500'}`}>
              100 Questions • 200 Marks • 24 Units
            </div>
          </div>
        </button>

        <button
          onClick={() => { setActiveSection('BE-01'); setSelectedSubjectId('ALL'); }}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSection === 'BE-01'
              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeSection === 'BE-01' ? 'text-blue-200' : 'text-slate-400'}`}>
              Section 01
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeSection === 'BE-01' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800'}`}>
              BE-01
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold truncate">Basics of Science & Engg</div>
            <div className={`text-xs mt-0.5 ${activeSection === 'BE-01' ? 'text-blue-100' : 'text-slate-500'}`}>
              50 Qs • 100 Marks • Physics, Chem, CS, Env
            </div>
          </div>
        </button>

        <button
          onClick={() => { setActiveSection('BE-02'); setSelectedSubjectId('ALL'); }}
          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
            activeSection === 'BE-02'
              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeSection === 'BE-02' ? 'text-blue-200' : 'text-slate-400'}`}>
              Section 02
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeSection === 'BE-02' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800'}`}>
              BE-02
            </span>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold truncate">Aptitude Test & Soft Skill</div>
            <div className={`text-xs mt-0.5 ${activeSection === 'BE-02' ? 'text-blue-100' : 'text-slate-500'}`}>
              50 Qs • 100 Marks • Mathematics & English
            </div>
          </div>
        </button>
      </div>

      {/* Search & Secondary Subject Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Subject Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedSubjectId === 'ALL'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Subjects ({availableSubjects.length})
          </button>
          {availableSubjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(String(sub.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedSubjectId === String(sub.id)
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{sub.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedSubjectId === String(sub.id) ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {sub.chapters?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Expand/Collapse All */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters or topics..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Sections List */}
      <div className="space-y-8">
        {filteredSections.map(section => (
          <div key={section.code} className="space-y-5">
            
            {/* Section Level Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-slate-200 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {section.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Official Exam Section</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
                  {section.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold shrink-0">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                  {section.questions}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                  {section.marks}
                </span>
              </div>
            </div>

            {/* Subjects in this Section */}
            <div className="space-y-6">
              {section.subjects.map(subject => {
                // Calculate subject completion
                let subjectTopicsCount = 0;
                let subjectDoneCount = 0;
                (subject.chapters || []).forEach(ch => {
                  (ch.topics || []).forEach(tp => {
                    subjectTopicsCount++;
                    if (completedTopicIds.has(tp.id)) subjectDoneCount++;
                  });
                });
                const subPercent = subjectTopicsCount > 0 ? Math.round((subjectDoneCount / subjectTopicsCount) * 100) : 0;

                return (
                  <div key={subject.id} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                    
                    {/* Subject Header Card */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {subject.name ? subject.name[0] : 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {subject.name}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              {subject.chapters?.length || 0} Units
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            GTU DDCET 2027 Examination Curriculum
                          </span>
                        </div>
                      </div>

                      {/* Subject Progress Pill */}
                      <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-slate-700">
                            {subjectDoneCount} / {subjectTopicsCount} Points Studied
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {subPercent}% Completed
                          </div>
                        </div>
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${subPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chapters List inside Subject */}
                    <div className="divide-y divide-slate-100">
                      {(subject.chapters || []).map((chapter, chIdx) => {
                        const isExpanded = expandedChapters.has(chapter.id);
                        
                        // Chapter progress
                        const chTopics = chapter.topics || [];
                        const chDone = chTopics.filter(t => completedTopicIds.has(t.id)).length;
                        const chPercent = chTopics.length > 0 ? Math.round((chDone / chTopics.length) * 100) : 0;
                        const isChapterComplete = chTopics.length > 0 && chDone === chTopics.length;

                        return (
                          <div key={chapter.id} className="transition">
                            
                            {/* Chapter Header Toggle Row */}
                            <div 
                              onClick={() => toggleChapter(chapter.id)}
                              className="p-4 sm:p-4.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                
                                {/* Unit Number Badge */}
                                <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 transition ${
                                  isChapterComplete
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {chapter.chapter_number ? String(chapter.chapter_number).padStart(2, '0') : String(chIdx + 1).padStart(2, '0')}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                      {chapter.name}
                                    </h4>
                                    
                                    {/* Weightage Badge */}
                                    {chapter.weightage && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                                        Weightage: {chapter.weightage}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                    <span>{chTopics.length} Important Points</span>
                                    <span>•</span>
                                    <span className={chDone > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                                      {chDone} Done ({chPercent}%)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Direct Practice Button */}
                                <Link
                                  to={`/student/practice?chapter=${encodeURIComponent(chapter.name)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                                  title="Practice Questions for this Chapter"
                                >
                                  <PenTool size={12} className="text-[#2563EB]" />
                                  <span>Practice</span>
                                </Link>

                                <button 
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                                  aria-label={isExpanded ? 'Collapse chapter' : 'Expand chapter'}
                                >
                                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Topics / Important Points */}
                            {isExpanded && (
                              <div className="px-4 pb-5 pt-1 sm:px-6 bg-slate-50/60 border-t border-slate-100 space-y-2.5">
                                {chapter.description && (
                                  <p className="text-xs text-slate-500 italic pt-2 leading-relaxed">
                                    {chapter.description}
                                  </p>
                                )}

                                <div className="space-y-2 pt-2">
                                  {chTopics.map((topic, tpIdx) => {
                                    const isDone = completedTopicIds.has(topic.id);

                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() => toggleTopic(topic.id)}
                                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition select-none ${
                                          isDone
                                            ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                                            : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3 min-w-0">
                                          <button
                                            type="button"
                                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                                              isDone
                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                : 'border border-slate-300 bg-white hover:border-blue-500'
                                            }`}
                                            title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                                          >
                                            {isDone && <CheckCircle size={13} className="text-white" />}
                                          </button>

                                          <div className="min-w-0">
                                            <span className={`text-xs sm:text-sm font-medium leading-relaxed block ${
                                              isDone ? 'line-through text-slate-500 decoration-emerald-500' : 'text-slate-800'
                                            }`}>
                                              {topic.name}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Linked Notes/Materials */}
                                        {topic.materials && topic.materials.length > 0 && (
                                          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                            {topic.materials.map(m => (
                                              <a
                                                key={m.id}
                                                href={m.file_path ? (m.file_path.startsWith('http') ? m.file_path : `${API_URL}${m.file_path}`) : m.reference_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition"
                                                title={m.title}
                                              >
                                                <span>Notes</span>
                                                <ExternalLink size={10} />
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {chTopics.length === 0 && (
                                    <div className="p-3 text-center text-xs text-slate-400 italic">
                                      No specific bullet points published for this chapter.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
            <BookOpen size={40} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No matching syllabus content found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No subjects or chapters match your search filter "{searchQuery}". Try clearing your search query.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSubjectId('ALL'); setActiveSection('ALL'); }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg transition shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
