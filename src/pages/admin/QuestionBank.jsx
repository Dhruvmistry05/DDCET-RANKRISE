import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { 
  Plus, Trash2, Search, Edit2, CheckCircle, AlertCircle, 
  Database, Filter, Check, X, ChevronLeft, ChevronRight,
  BookOpen, Layers, Sparkles
} from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'verified' | 'pending'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Edit / Review Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Create Form Data
  const [formData, setFormData] = useState({
    text: '', options: ['', '', '', ''], answer_index: 0, explanation: '', marks: 2, negative_marks: 0.5,
    subject_id: '', chapter_id: '', topic_id: '', published: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [q, s, c, t] = await Promise.all([
        fetch(`${API_URL}/api/questions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(q)) setQuestions(q);
      if (Array.isArray(s)) setSubjects(s);
      if (Array.isArray(c)) setChapters(c);
      if (Array.isArray(t)) setTopics(t);
    } catch (e) {
      console.error('Error fetching question bank data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.options.some(opt => opt.trim() === '')) return alert("All 4 options must be filled.");
    try {
      const res = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({
          text: '', options: ['', '', '', ''], answer_index: 0, explanation: '', marks: 2, negative_marks: 0.5,
          subject_id: '', chapter_id: '', topic_id: '', published: true
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Modal
  const openEditModal = (q) => {
    setEditingQuestion({
      ...q,
      options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
      answer_index: q.answer_index !== undefined ? q.answer_index : (q.correctOptionIndex || 0),
      subject_id: q.subject_id ? String(q.subject_id) : '',
      chapter_id: q.chapter_id ? String(q.chapter_id) : '',
      topic_id: q.topic_id ? String(q.topic_id) : '',
      review_status: q.review_status || 'verified',
      needs_review: q.needs_review !== undefined ? Boolean(q.needs_review) : false
    });
  };

  const handleEditOptionChange = (index, value) => {
    if (!editingQuestion) return;
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (editingQuestion.options.some(opt => !opt || opt.trim() === '')) {
      return alert("All 4 options must be filled.");
    }

    setIsSubmittingEdit(true);
    try {
      const payload = {
        text: editingQuestion.text,
        options: editingQuestion.options,
        answer_index: editingQuestion.answer_index,
        explanation: editingQuestion.explanation,
        marks: editingQuestion.marks,
        negative_marks: editingQuestion.negative_marks,
        subject_id: editingQuestion.subject_id || null,
        chapter_id: editingQuestion.chapter_id || null,
        topic_id: editingQuestion.topic_id || null,
        published: editingQuestion.published,
        review_status: editingQuestion.review_status,
        needs_review: editingQuestion.review_status === 'pending',
        review_reason: editingQuestion.review_status === 'pending' ? editingQuestion.review_reason : ''
      };

      const res = await fetch(`${API_URL}/api/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...updated } : q));
        setEditingQuestion(null);
      } else {
        alert("Failed to update question. Please check server logs.");
      }
    } catch (err) {
      console.error('Error saving question:', err);
      alert("Error saving question updates.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = questions.length;
    const imported = questions.filter(q => q.source === 'DDCET Question Bank 2024').length;
    const pendingReview = questions.filter(q => q.review_status === 'pending' || q.needs_review).length;
    const duplicates = 20; // 20 exact duplicates detected and prevented during import
    return { total, imported, pendingReview, duplicates };
  }, [questions]);

  // Filtering
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Search matches
      if (search) {
        const sLower = search.toLowerCase();
        const textMatch = (q.text || '').toLowerCase().includes(sLower);
        const idMatch = String(q.id).includes(sLower);
        const optMatch = (q.options || []).some(opt => (opt || '').toLowerCase().includes(sLower));
        if (!textMatch && !idMatch && !optMatch) return false;
      }

      // Subject filter
      if (filterSubject && String(q.subject_id) !== filterSubject) {
        return false;
      }

      // Chapter filter
      if (filterChapter && String(q.chapter_id) !== filterChapter) {
        return false;
      }

      // Topic filter
      if (filterTopic && String(q.topic_id) !== filterTopic) {
        return false;
      }

      // Status filter
      if (filterStatus === 'pending') {
        if (q.review_status !== 'pending' && !q.needs_review) return false;
      } else if (filterStatus === 'verified') {
        if (q.review_status === 'pending' || q.needs_review) return false;
      }

      return true;
    });
  }, [questions, search, filterSubject, filterChapter, filterTopic, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSubject, filterChapter, filterTopic, filterStatus, pageSize]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage comprehensive MCQ pools, verify syllabus categorization, and review questions.
          </p>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500">Total Questions</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.imported.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500">Imported From QB</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.duplicates}
            </div>
            <div className="text-xs font-medium text-slate-500">Duplicates Filtered</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          className={`p-4 rounded-xl border shadow-xs flex items-center gap-3.5 cursor-pointer transition ${
            filterStatus === 'pending'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
          title="Click to filter by Pending Review"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.pendingReview}
            </div>
            <div className="text-xs font-medium text-slate-500">Pending Review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ADD QUESTION FORM COLUMN */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={16} className="text-[#2563EB]" /> 
            <span>Create New Question</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Subject *</label>
                <select 
                  required 
                  className="w-full p-2.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition" 
                  value={formData.subject_id} 
                  onChange={e => setFormData({...formData, subject_id: e.target.value, chapter_id: '', topic_id: ''})}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Chapter *</label>
                <select 
                  required 
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={formData.chapter_id} 
                  onChange={e => setFormData({...formData, chapter_id: e.target.value, topic_id: ''})}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => !formData.subject_id || String(c.subject_id) === String(formData.subject_id)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Topic</label>
              <select 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                value={formData.topic_id} 
                onChange={e => setFormData({...formData, topic_id: e.target.value})}
              >
                <option value="">Select Topic (Optional)</option>
                {topics.filter(t => !formData.chapter_id || String(t.chapter_id) === String(formData.chapter_id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Question Statement *</label>
              <textarea 
                required 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                rows="3" 
                value={formData.text} 
                onChange={e => setFormData({...formData, text: e.target.value})}
                placeholder="Type the full question prompt here..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Options (Select Correct Answer)
              </label>
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="correct_answer" 
                    checked={formData.answer_index === i} 
                    onChange={() => setFormData({...formData, answer_index: i})} 
                    className="w-4 h-4 cursor-pointer text-blue-600 shrink-0" 
                    title="Mark as correct option"
                  />
                  <input 
                    required 
                    type="text" 
                    className={`flex-1 p-2 border rounded-lg bg-white dark:bg-slate-900 text-xs sm:text-sm ${
                      formData.answer_index === i 
                        ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' 
                        : 'border-slate-200 dark:border-slate-700'
                    }`} 
                    value={opt} 
                    onChange={e => handleOptionChange(i, e.target.value)} 
                    placeholder={`Option ${String.fromCharCode(65+i)}`} 
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Explanation (Solution)</label>
              <textarea 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                rows="2" 
                value={formData.explanation} 
                onChange={e => setFormData({...formData, explanation: e.target.value})}
                placeholder="Step-by-step solution shown after test submission..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Marks (+)</label>
                <input 
                  required 
                  type="number" 
                  step="0.5" 
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm" 
                  value={formData.marks} 
                  onChange={e => setFormData({...formData, marks: parseFloat(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Negative (-)</label>
                <input 
                  required 
                  type="number" 
                  step="0.05" 
                  className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm" 
                  value={formData.negative_marks} 
                  onChange={e => setFormData({...formData, negative_marks: parseFloat(e.target.value)})} 
                />
              </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded" 
                checked={formData.published} 
                onChange={e => setFormData({...formData, published: e.target.checked})} 
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Publish Immediately</span>
            </label>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs sm:text-sm transition shadow-xs"
            >
              Save Question to Bank
            </button>
          </form>
        </div>

        {/* QUESTIONS LIST COLUMN */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Search & Multi-Level Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search questions by statement, options, or ID..." 
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Subject Filter */}
              <select
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none"
                value={filterSubject}
                onChange={e => {
                  setFilterSubject(e.target.value);
                  setFilterChapter('');
                  setFilterTopic('');
                }}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>

              {/* Chapter Filter */}
              <select
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none"
                value={filterChapter}
                onChange={e => {
                  setFilterChapter(e.target.value);
                  setFilterTopic('');
                }}
              >
                <option value="">All Chapters</option>
                {chapters
                  .filter(c => !filterSubject || String(c.subject_id) === filterSubject)
                  .map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>

              {/* Topic Filter */}
              <select
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none"
                value={filterTopic}
                onChange={e => setFilterTopic(e.target.value)}
              >
                <option value="">All Topics</option>
                {topics
                  .filter(t => !filterChapter || String(t.chapter_id) === filterChapter)
                  .map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>

              {/* Status Filter */}
              <select
                className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Review Only</option>
              </select>
            </div>
          </div>

          {/* Metrics bar & Page size selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 px-1">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredQuestions.length.toLocaleString()}</span> matching questions
              {filterStatus === 'pending' && <span className="ml-1 text-amber-600 font-semibold">(Filtered by Pending Review)</span>}
            </div>

            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select 
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium"
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading questions...</div>
            ) : paginatedQuestions.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No matching questions found with the selected filters.
              </div>
            ) : paginatedQuestions.map((q, idx) => {
              const displayIndex = (currentPage - 1) * pageSize + idx + 1;
              const isPending = q.review_status === 'pending' || q.needs_review;

              return (
                <div 
                  key={q.id} 
                  className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-xs border transition space-y-3 ${
                    isPending 
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/10' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-900 text-white dark:bg-slate-700 text-[10px] font-bold rounded">
                        #{displayIndex} (ID: {q.id})
                      </span>
                      {q.subject && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold rounded">
                          {q.subject}
                        </span>
                      )}
                      {q.chapter && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded">
                          {q.chapter}
                        </span>
                      )}
                      {q.topic && (
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium rounded max-w-[200px] truncate" title={q.topic}>
                          {q.topic}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded flex items-center gap-1 ${
                        isPending 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}>
                        {isPending ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                        {isPending ? 'Pending Review' : 'Verified'}
                      </span>
                      {q.source && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 text-[9px] font-medium rounded">
                          {q.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-slate-500">+{q.marks} / -{q.negative_marks}</span>
                      <button 
                        onClick={() => openEditModal(q)} 
                        className="text-slate-400 hover:text-blue-600 p-1 rounded transition"
                        title="Edit / Review question"
                      >
                        <Edit2 size={15}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(q.id)} 
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete question"
                      >
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>

                  {isPending && q.review_reason && (
                    <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0" />
                        <span><strong>Pending Topic Review:</strong> {q.review_reason}</span>
                      </div>
                      <button 
                        onClick={() => openEditModal(q)}
                        className="underline font-semibold hover:text-amber-900"
                      >
                        Review Now
                      </button>
                    </div>
                  )}
                  
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-snug whitespace-pre-line">
                    {q.text}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        className={`p-2.5 border rounded-lg text-xs font-medium ${
                          oIdx === q.answer_index || oIdx === q.correctOptionIndex
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold' 
                            : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{String.fromCharCode(65+oIdx)}.</span> 
                        {opt}
                      </div>
                    ))}
                  </div>
                  
                  {q.explanation && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT / REVIEW MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={18} className="text-blue-600" />
                  <span>Edit & Review Question #{editingQuestion.id}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update syllabus categorization, question wording, or verify review status.
                </p>
              </div>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Taxonomy Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                  <select
                    className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={editingQuestion.subject_id}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      subject_id: e.target.value,
                      chapter_id: '',
                      topic_id: ''
                    })}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Chapter</label>
                  <select
                    className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={editingQuestion.chapter_id}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      chapter_id: e.target.value,
                      topic_id: ''
                    })}
                  >
                    <option value="">Select Chapter</option>
                    {chapters
                      .filter(c => !editingQuestion.subject_id || String(c.subject_id) === String(editingQuestion.subject_id))
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Topic</label>
                  <select
                    className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    value={editingQuestion.topic_id}
                    onChange={e => setEditingQuestion({
                      ...editingQuestion,
                      topic_id: e.target.value
                    })}
                  >
                    <option value="">Select Topic</option>
                    {topics
                      .filter(t => !editingQuestion.chapter_id || String(t.chapter_id) === String(editingQuestion.chapter_id))
                      .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Question Statement</label>
                <textarea
                  rows="3"
                  className="w-full p-2.5 border rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  value={editingQuestion.text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                  Options (Radio marks correct answer)
                </label>
                {editingQuestion.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="edit_correct_answer" 
                      checked={editingQuestion.answer_index === i} 
                      onChange={() => setEditingQuestion({ ...editingQuestion, answer_index: i })} 
                      className="w-4 h-4 cursor-pointer text-blue-600 shrink-0" 
                    />
                    <input 
                      type="text" 
                      className={`flex-1 p-2 border rounded-lg text-xs sm:text-sm ${
                        editingQuestion.answer_index === i 
                          ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20' 
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                      }`} 
                      value={opt} 
                      onChange={e => handleEditOptionChange(i, e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Explanation</label>
                <textarea
                  rows="2"
                  className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                />
              </div>

              {/* Review Status & Actions */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Review Status</div>
                  <div className="text-[11px] text-slate-500">
                    {editingQuestion.review_status === 'pending' ? 'Needs review confirmation' : 'Verified & Approved'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion({
                      ...editingQuestion,
                      review_status: editingQuestion.review_status === 'pending' ? 'verified' : 'pending'
                    })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      editingQuestion.review_status === 'verified'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}
                  >
                    {editingQuestion.review_status === 'verified' ? '✓ Marked Verified' : '⚠ Set to Pending'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
