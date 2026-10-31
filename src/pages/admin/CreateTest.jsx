import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { 
  Search, Plus, CheckCircle, ArrowLeft, Layers, CheckCircle2, 
  Circle, X, Trash2, RefreshCw, Eye, BookOpen, Award, Filter, 
  ChevronRight, ChevronDown, SlidersHorizontal, CheckSquare, 
  Square, FileText, Sparkles, HelpCircle, AlertCircle, ArrowUpDown
} from 'lucide-react';

export default function CreateTest() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  // --- Test Parameters State ---
  const [title, setTitle] = useState('');
  const [type, setType] = useState('mock_paper');
  const [duration, setDuration] = useState(60);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('published');
  const [submitting, setSubmitting] = useState(false);

  // --- Bank & Taxonomy Data ---
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Question Selection State ---
  // Using an Array to preserve sequential order for test builder & a Set for O(1) lookups
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // --- Views & Tabs ---
  // 'browse' = Searchable/Filterable Bank | 'preview' = Review Selected Questions
  const [activeTab, setActiveTab] = useState('browse');

  // --- Filters & Search Controls ---
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterChapter, setFilterChapter] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterQuestionType, setFilterQuestionType] = useState('all'); // 'all', 'mcq', 'numerical', 'conceptual'
  const [filterSelectionState, setFilterSelectionState] = useState('all'); // 'all', 'selected', 'unselected'

  // --- Pagination in Browse View ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // --- Replace Question Modal State ---
  const [replacingQuestion, setReplacingQuestion] = useState(null);
  const [replaceSearch, setReplaceSearch] = useState('');

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, sRes, cRes, tRes] = await Promise.all([
        fetch(`${API_URL}/api/questions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(qRes)) setQuestions(qRes);
      if (Array.isArray(sRes)) setSubjects(sRes);
      if (Array.isArray(cRes)) setChapters(cRes);
      if (Array.isArray(tRes)) setTopics(tRes);
    } catch (e) {
      console.error('Error fetching question builder data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper map for fast lookup of full question by ID
  const questionMap = useMemo(() => {
    const map = new Map();
    questions.forEach(q => map.set(q.id, q));
    return map;
  }, [questions]);

  // Total Marks Calculation
  const totalMarks = useMemo(() => {
    let sum = 0;
    selectedIds.forEach(id => {
      const q = questionMap.get(id);
      if (q) sum += Number(q.marks || 2.0);
    });
    return sum;
  }, [selectedIds, questionMap]);

  // Determine question type helper (handles explicit type or auto-classifies)
  const getQuestionType = (q) => {
    if (q.type) return q.type.toLowerCase();
    if (q.question_type) return q.question_type.toLowerCase();
    const textLower = (q.text || '').toLowerCase();
    if (
      textLower.includes('calculate') || 
      textLower.includes('find the') || 
      textLower.includes('value of') ||
      textLower.includes('=') || 
      textLower.includes('%') || 
      textLower.includes('ratio') ||
      /\d+\s*(m\/s|kg|ohm|v|a|j|n|w|k|hz)/i.test(textLower)
    ) {
      return 'numerical';
    }
    if (
      textLower.includes('definition') || 
      textLower.includes('law') || 
      textLower.includes('principle') || 
      textLower.includes('unit of') ||
      textLower.includes('which of the following')
    ) {
      return 'conceptual';
    }
    return 'mcq';
  };

  // Filtered Chapters based on filterSubject
  const availableFilterChapters = useMemo(() => {
    if (filterSubject === 'all') return chapters;
    return chapters.filter(c => String(c.subject_id) === String(filterSubject));
  }, [chapters, filterSubject]);

  // Filtered Topics based on filterChapter
  const availableFilterTopics = useMemo(() => {
    if (filterChapter === 'all') {
      if (filterSubject === 'all') return topics;
      const validChapterIds = new Set(availableFilterChapters.map(c => c.id));
      return topics.filter(t => validChapterIds.has(t.chapter_id));
    }
    return topics.filter(t => String(t.chapter_id) === String(filterChapter));
  }, [topics, filterChapter, filterSubject, availableFilterChapters]);

  // Reset dependent filters when parent filter changes
  const handleSubjectFilterChange = (newSub) => {
    setFilterSubject(newSub);
    setFilterChapter('all');
    setFilterTopic('all');
    setCurrentPage(1);
  };

  const handleChapterFilterChange = (newChap) => {
    setFilterChapter(newChap);
    setFilterTopic('all');
    setCurrentPage(1);
  };

  // Main Filtered Questions list
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // 1. Search filter
      if (search.trim()) {
        const qTerm = search.toLowerCase().trim();
        const textMatch = (q.text || '').toLowerCase().includes(qTerm);
        const idMatch = String(q.id).includes(qTerm);
        const subMatch = (q.subject || '').toLowerCase().includes(qTerm);
        const chapMatch = (q.chapter || '').toLowerCase().includes(qTerm);
        const topicMatch = (q.topic || '').toLowerCase().includes(qTerm);
        const optMatch = Array.isArray(q.options) && q.options.some(opt => String(opt).toLowerCase().includes(qTerm));
        if (!textMatch && !idMatch && !subMatch && !chapMatch && !topicMatch && !optMatch) {
          return false;
        }
      }

      // 2. Subject filter
      if (filterSubject !== 'all' && String(q.subject_id) !== String(filterSubject)) {
        return false;
      }

      // 3. Chapter filter
      if (filterChapter !== 'all' && String(q.chapter_id) !== String(filterChapter)) {
        return false;
      }

      // 4. Topic filter
      if (filterTopic !== 'all' && String(q.topic_id) !== String(filterTopic)) {
        return false;
      }

      // 5. Question Type filter
      if (filterQuestionType !== 'all') {
        const qType = getQuestionType(q);
        if (filterQuestionType === 'numerical' && qType !== 'numerical') return false;
        if (filterQuestionType === 'conceptual' && qType !== 'conceptual') return false;
        if (filterQuestionType === 'mcq' && qType !== 'mcq') return false;
      }

      // 6. Selection State filter
      const isSelected = selectedSet.has(q.id);
      if (filterSelectionState === 'selected' && !isSelected) return false;
      if (filterSelectionState === 'unselected' && isSelected) return false;

      return true;
    });
  }, [questions, search, filterSubject, filterChapter, filterTopic, filterQuestionType, filterSelectionState, selectedSet]);

  // Paginated questions in Browse View
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Reset pagination if out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // --- Selection Handlers ---
  const handleToggleQuestion = (id) => {
    if (selectedSet.has(id)) {
      setSelectedIds(prev => prev.filter(qid => qid !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const toAdd = filteredQuestions.map(q => q.id).filter(id => !selectedSet.has(id));
    if (toAdd.length > 0) {
      setSelectedIds(prev => [...prev, ...toAdd]);
    }
  };

  const handleDeselectFiltered = () => {
    const toRemoveSet = new Set(filteredQuestions.map(q => q.id));
    setSelectedIds(prev => prev.filter(id => !toRemoveSet.has(id)));
  };

  const handleClearAllSelection = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > 5 && !window.confirm(`Are you sure you want to clear all ${selectedIds.length} selected questions?`)) {
      return;
    }
    setSelectedIds([]);
  };

  const handleRemoveSingle = (id) => {
    setSelectedIds(prev => prev.filter(qid => qid !== id));
  };

  // Replace Question Handler: swaps oldQuestionId with newQuestionId
  const handleConfirmReplace = (oldId, newId) => {
    setSelectedIds(prev => prev.map(id => (id === oldId ? newId : id)));
    setReplacingQuestion(null);
    setReplaceSearch('');
  };

  // Candidate questions for replace modal (from same chapter or subject, not already selected)
  const replacementCandidates = useMemo(() => {
    if (!replacingQuestion) return [];
    return questions.filter(q => {
      if (q.id === replacingQuestion.id) return false;
      if (selectedSet.has(q.id)) return false;
      // Match by chapter if available, else by subject
      if (replacingQuestion.chapter_id && q.chapter_id == replacingQuestion.chapter_id) {
        if (replaceSearch.trim()) {
          return q.text.toLowerCase().includes(replaceSearch.toLowerCase().trim());
        }
        return true;
      }
      if (replacingQuestion.subject_id && q.subject_id == replacingQuestion.subject_id) {
        if (replaceSearch.trim()) {
          return q.text.toLowerCase().includes(replaceSearch.toLowerCase().trim());
        }
        return true;
      }
      return false;
    }).slice(0, 30);
  }, [replacingQuestion, questions, selectedSet, replaceSearch]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearch('');
    setFilterSubject('all');
    setFilterChapter('all');
    setFilterTopic('all');
    setFilterQuestionType('all');
    setFilterSelectionState('all');
    setCurrentPage(1);
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("Please select at least one question for the assessment.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          type,
          duration_minutes: parseInt(duration, 10),
          subject_id: subjectId ? parseInt(subjectId, 10) : null,
          chapter_id: chapterId ? parseInt(chapterId, 10) : null,
          scheduled_start_time: startTime ? new Date(startTime).toISOString() : null,
          scheduled_end_time: endTime ? new Date(endTime).toISOString() : null,
          question_ids: selectedIds, // ONLY SAVE THE SELECTED QUESTIONS
          status
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create assessment');
      }

      navigate('/admin/tests');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Error creating test. Please check all fields and try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              Admin Assessment Center
            </span>
            <span className="text-xs text-slate-500 font-medium">Test Builder & Question Picker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Add New Test
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Configure test schedule, parameters, and easily select, filter, preview, or replace questions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => navigate('/admin/tests')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: TEST PARAMETERS & SUMMARY                                    */}
        {/* ========================================================================= */}
        <div className="xl:col-span-4 xl:sticky xl:top-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Header & Badges */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Test Parameters
                </h2>
                <p className="text-[11px] text-slate-400">Basic settings & schedule</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E3A8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <CheckCircle size={13} className="text-blue-600" />
                  {selectedIds.length} Qs • {totalMarks.toFixed(1)} M
                </span>
              </div>
            </div>

            <form id="test-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Test Title *
                </label>
                <input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  type="text" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                  placeholder="e.g. DDCET Full Mock Test #1" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Assessment Type *
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={type} 
                  onChange={e => { 
                    const newType = e.target.value;
                    setType(newType); 
                    setSubjectId(''); 
                    setChapterId(''); 
                  }}
                >
                  <option value="mock_paper">Combined Mock Examination (Full Paper)</option>
                  <option value="subject_wise">Subject-Wise Practice Test</option>
                  <option value="chapter_wise">Chapter-Wise Diagnostic Test</option>
                  <option value="scheduled_live">Timed Scheduled Live Exam</option>
                </select>
              </div>

              {(type === 'subject_wise' || type === 'chapter_wise') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Target Subject *
                  </label>
                  <select 
                    required 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                    value={subjectId} 
                    onChange={e => { 
                      const val = e.target.value;
                      setSubjectId(val); 
                      setChapterId('');
                      if (val) setFilterSubject(val);
                    }}
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {type === 'chapter_wise' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Target Chapter *
                  </label>
                  <select 
                    required 
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                    value={chapterId} 
                    onChange={e => {
                      const val = e.target.value;
                      setChapterId(val);
                      if (val) setFilterChapter(val);
                    }}
                  >
                    <option value="">-- Choose Chapter --</option>
                    {chapters.filter(c => !subjectId || c.subject_id == subjectId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'scheduled_live' && (
                <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Live Test Window</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Start Time *
                    </label>
                    <input 
                      required 
                      type="datetime-local" 
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-blue-600" 
                      value={startTime} 
                      onChange={e => setStartTime(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      End Time *
                    </label>
                    <input 
                      required 
                      type="datetime-local" 
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-blue-600" 
                      value={endTime} 
                      onChange={e => setEndTime(e.target.value)} 
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Duration (minutes) *
                </label>
                <input 
                  required 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)} 
                  type="number" 
                  min="5" 
                  max="300"
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Publication Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                      status === 'published'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                      status === 'draft'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    ✎ Draft
                  </button>
                </div>
              </div>

              {/* Live Metric Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Selected Questions:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedIds.length}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Total Maximum Marks:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalMarks.toFixed(1)} Marks</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Time Per Question:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {selectedIds.length > 0 ? `${(duration / selectedIds.length).toFixed(1)} mins` : '-'}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  form="test-form" 
                  disabled={submitting || selectedIds.length === 0}
                  className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Assessment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Save & Build Test ({selectedIds.length} Qs)</span>
                    </>
                  )}
                </button>
                {selectedIds.length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center mt-1.5 font-medium">
                    Select at least 1 question from the right to enable saving.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: QUESTION SELECTION SYSTEM (BROWSE & PREVIEW)                 */}
        {/* ========================================================================= */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Top Mode Navigation Tabs */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === 'browse'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers size={15} />
                <span>Browse Question Bank</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-semibold">
                  {questions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition relative ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Eye size={15} />
                <span>Selected Test Preview</span>
                <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  selectedIds.length > 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {selectedIds.length}
                </span>
              </button>
            </div>

            {/* Total Marks Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Marks:</span>
              <span className="font-bold text-slate-800 dark:text-white">{totalMarks.toFixed(1)}</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: BROWSE QUESTION BANK                                               */}
          {/* ========================================================================= */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              
              {/* Filter & Search Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by question text, keyword, ID, or option..." 
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-600 focus:bg-white transition"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns Grid: Subject, Chapter, Topic, Question Type, Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  
                  {/* 1. Subject Filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Subject
                    </label>
                    <select 
                      value={filterSubject}
                      onChange={e => handleSubjectFilterChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="all">All Subjects ({subjects.length})</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Chapter Filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Chapter
                    </label>
                    <select 
                      value={filterChapter}
                      onChange={e => handleChapterFilterChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="all">All Chapters ({availableFilterChapters.length})</option>
                      {availableFilterChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Topic Filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Topic
                    </label>
                    <select 
                      value={filterTopic}
                      onChange={e => { setFilterTopic(e.target.value); setCurrentPage(1); }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="all">All Topics ({availableFilterTopics.length})</option>
                      {availableFilterTopics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Question Type Filter */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Question Type
                    </label>
                    <select 
                      value={filterQuestionType}
                      onChange={e => { setFilterQuestionType(e.target.value); setCurrentPage(1); }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="all">All Question Types</option>
                      <option value="mcq">Standard MCQ</option>
                      <option value="numerical">Numerical & Calculations</option>
                      <option value="conceptual">Conceptual & Theory</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Row: Selection state filter & Batch Action Controls */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Selection State filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">View:</span>
                    <button
                      type="button"
                      onClick={() => { setFilterSelectionState('all'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        filterSelectionState === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      All ({filteredQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterSelectionState('selected'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        filterSelectionState === 'selected'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Selected ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFilterSelectionState('unselected'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        filterSelectionState === 'unselected'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Unselected ({Math.max(0, questions.length - selectedIds.length)})
                    </button>

                    {(filterSubject !== 'all' || filterChapter !== 'all' || filterTopic !== 'all' || filterQuestionType !== 'all' || search) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline ml-1"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Batch Selection Controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={handleSelectAllFiltered} 
                      disabled={filteredQuestions.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold transition shadow-2xs disabled:opacity-50"
                      title="Select all questions matching the active filter"
                    >
                      <CheckSquare size={13} />
                      <span>Select All ({filteredQuestions.length})</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={handleDeselectFiltered} 
                      disabled={filteredQuestions.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      title="Deselect all questions currently visible in filtered view"
                    >
                      <Square size={13} />
                      <span>Deselect Filtered</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={handleClearAllSelection} 
                      disabled={selectedIds.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      title="Clear entire test selection"
                    >
                      <Trash2 size={13} />
                      <span>Clear Selection</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Status Header & Pagination Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length} Questions
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="text-emerald-600 font-semibold">
                      ({filteredQuestions.filter(q => selectedSet.has(q.id)).length} selected in this view)
                    </span>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions Checklist */}
              <div className="space-y-2.5">
                {paginatedQuestions.map((q, idx) => {
                  const isSelected = selectedSet.has(q.id);
                  const qNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <div 
                      key={q.id}
                      onClick={() => handleToggleQuestion(q.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-blue-50/60 border-blue-600 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500/20 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        
                        {/* Checkbox */}
                        <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleToggleQuestion(q.id)}
                          />
                        </div>

                        {/* Question Details */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              #{qNum} (ID: {q.id})
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {q.subject || subjects.find(s => s.id == q.subject_id)?.name || 'General'}
                            </span>
                            {q.chapter && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 truncate max-w-[200px]">
                                {q.chapter}
                              </span>
                            )}
                            {q.topic && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 truncate max-w-[180px]">
                                • {q.topic}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ml-auto">
                              +{q.marks || 2.0} Marks {q.negative_marks ? `(-${q.negative_marks})` : ''}
                            </span>
                          </div>

                          {/* Question Text */}
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {q.text}
                          </p>

                          {/* 4 Options Preview */}
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = q.answer_index === oIdx || q.correctOptionIndex === oIdx;
                                return (
                                  <div 
                                    key={oIdx} 
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold'
                                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                                    }`}
                                  >
                                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] bg-white dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span className="truncate">{opt}</span>
                                    {isCorrect && (
                                      <span className="ml-auto text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
                                        Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>

                        {/* Selected / Unselected Indicator Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleQuestion(q.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : '+ Add'}
                        </button>

                      </div>
                    </div>
                  );
                })}

                {filteredQuestions.length === 0 && (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <HelpCircle size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      No matching questions found
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try adjusting or clearing your search keywords and filters to display questions from the Question Bank.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg hover:bg-blue-100 transition"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span>Page {currentPage} of {totalPages} ({filteredQuestions.length} Total Questions)</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PREVIEW SELECTED QUESTIONS BEFORE SAVING                          */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              
              {/* Preview Banner */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-blue-600" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Selected Test Paper Preview ({selectedIds.length} Questions)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Review the exact questions, marks, and answers that will be saved in this test. You can remove or replace any question.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('browse')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                  >
                    <Plus size={14} />
                    <span>Add More Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAllSelection}
                    disabled={selectedIds.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Selected Questions Cards List */}
              {selectedIds.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Layers size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    No Questions Selected Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't selected any questions for this test yet. Switch back to the Browse tab and check the questions you want to add.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('browse')}
                    className="px-4 py-2 bg-[#1E3A8A] text-white font-semibold text-xs rounded-xl hover:bg-blue-900 transition shadow-2xs"
                  >
                    Browse Question Bank
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedIds.map((qId, index) => {
                    const q = questionMap.get(qId);
                    if (!q) return null;
                    return (
                      <div 
                        key={q.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 relative group"
                      >
                        {/* Top Meta & Action Controls */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Q#{index + 1}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {q.subject || 'Subject'}
                            </span>
                            {q.chapter && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {q.chapter}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                              +{q.marks || 2.0} Marks {q.negative_marks ? `(-${q.negative_marks})` : ''}
                            </span>
                          </div>

                          {/* Individual Remove & Replace buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingQuestion(q);
                                setReplaceSearch('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-lg transition"
                              title="Replace this question with an alternative"
                            >
                              <RefreshCw size={12} />
                              <span>Replace</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveSingle(q.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Remove question from test"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {q.text}
                        </p>

                        {/* Options */}
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.answer_index === oIdx || q.correctOptionIndex === oIdx;
                              return (
                                <div 
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2.5 ${
                                    isCorrect
                                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold'
                                      : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="flex-1 min-w-0">{opt}</span>
                                  {isCorrect && (
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                      Correct Key
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Explanation snippet if present */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-blue-900 dark:text-blue-300">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* REPLACE QUESTION MODAL                                                    */}
      {/* ========================================================================= */}
      {replacingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Replace Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplacingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Question being replaced */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Currently Selected Question (To be replaced):
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white mt-1">
                {replacingQuestion.text}
              </p>
              <div className="flex gap-2 mt-2 text-[10px] font-semibold text-slate-500">
                <span>Subject: {replacingQuestion.subject}</span>
                {replacingQuestion.chapter && <span>• Chapter: {replacingQuestion.chapter}</span>}
              </div>
            </div>

            {/* Search within alternatives */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search replacement questions..."
                value={replaceSearch}
                onChange={e => setReplaceSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-600"
              />
            </div>

            {/* Alternatives List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {replacementCandidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No replacement candidates found for this chapter/subject. Try searching a different keyword.
                </div>
              ) : (
                replacementCandidates.map(candidate => (
                  <div
                    key={candidate.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition flex items-start justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                          {candidate.subject}
                        </span>
                        {candidate.chapter && (
                          <span className="text-slate-500 truncate max-w-[200px]">
                            {candidate.chapter}
                          </span>
                        )}
                        <span className="ml-auto font-bold text-emerald-600">
                          +{candidate.marks || 2.0} Marks
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {candidate.text}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmReplace(replacingQuestion.id, candidate.id)}
                      className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shrink-0 transition"
                    >
                      Use This
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setReplacingQuestion(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
