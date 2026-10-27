import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Search, Plus, CheckCircle, ArrowLeft, Layers } from 'lucide-react';

export default function CreateTest() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  const [title, setTitle] = useState('');
  const [type, setType] = useState('mock_paper');
  const [duration, setDuration] = useState(60);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('published');
  
  const [search, setSearch] = useState('');

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [q, s, c] = await Promise.all([
        fetch(`${API_URL}/api/questions`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(q)) setQuestions(q);
      if (Array.isArray(s)) setSubjects(s);
      if (Array.isArray(c)) setChapters(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleQuestion = (id) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedQuestions(newSet);
  };

  const handleSelectAllFiltered = () => {
    const newSet = new Set(selectedQuestions);
    filteredQuestions.forEach(q => newSet.add(q.id));
    setSelectedQuestions(newSet);
  };

  const handleDeselectAll = () => {
    setSelectedQuestions(new Set());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedQuestions.size === 0) {
      alert("Please select at least one question for the test.");
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title,
          type,
          duration_minutes: parseInt(duration),
          subject_id: subjectId ? parseInt(subjectId) : null,
          chapter_id: chapterId ? parseInt(chapterId) : null,
          scheduled_start_time: startTime ? new Date(startTime).toISOString() : null,
          scheduled_end_time: endTime ? new Date(endTime).toISOString() : null,
          question_ids: Array.from(selectedQuestions),
          status
        })
      });
      navigate('/admin/tests');
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  let filteredQuestions = questions;
  if (type === 'subject_wise' && subjectId) filteredQuestions = filteredQuestions.filter(q => q.subject_id == subjectId);
  if (type === 'chapter_wise' && chapterId) filteredQuestions = filteredQuestions.filter(q => q.chapter_id == chapterId);
  if (search) filteredQuestions = filteredQuestions.filter(q => q.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assessment Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure test schedule, parameters, and select questions from the bank.
          </p>
        </div>

        <button 
          onClick={() => navigate('/admin/tests')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={14} />
          <span>Cancel</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* TEST CONFIGURATION COLUMN */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Test Parameters
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-slate-800 text-[#1E3A8A] dark:text-blue-300 border border-blue-100 dark:border-slate-700">
              {selectedQuestions.size} Selected
            </span>
          </div>

          <form id="test-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Test Title *
              </label>
              <input 
                required 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
                type="text" 
                className="w-full p-2.5 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition" 
                placeholder="e.g. DDCET State Mock 2027 #1" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Assessment Type *
              </label>
              <select 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                value={type} 
                onChange={e => { setType(e.target.value); setSubjectId(''); setChapterId(''); }}
              >
                <option value="mock_paper">Combined Mock Examination</option>
                <option value="subject_wise">Subject-Wise Practice Test</option>
                <option value="chapter_wise">Chapter-Wise Diagnostic Test</option>
                <option value="scheduled_live">Timed Scheduled Live Exam</option>
              </select>
            </div>

            {(type === 'subject_wise' || type === 'chapter_wise') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Subject *
                </label>
                <select 
                  required 
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={subjectId} 
                  onChange={e => { setSubjectId(e.target.value); setChapterId(''); }}
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {type === 'chapter_wise' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Chapter *
                </label>
                <select 
                  required 
                  className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={chapterId} 
                  onChange={e => setChapterId(e.target.value)}
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.filter(c => c.subject_id == subjectId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {type === 'scheduled_live' && (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Start Window *
                  </label>
                  <input 
                    required 
                    type="datetime-local" 
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none" 
                    value={startTime} 
                    onChange={e=>setStartTime(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    End Window *
                  </label>
                  <input 
                    required 
                    type="datetime-local" 
                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none" 
                    value={endTime} 
                    onChange={e=>setEndTime(e.target.value)} 
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
                onChange={e=>setDuration(e.target.value)} 
                type="number" 
                min="1" 
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
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
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
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
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  ✎ Draft (Hidden)
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {status === 'published' 
                  ? 'Will appear immediately in Mock Test Center for students.' 
                  : 'Stays hidden from students until published.'}
              </p>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                form="test-form" 
                disabled={submitting}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs sm:text-sm transition shadow-xs active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? 'Creating Test...' : `Save & Build Test (${selectedQuestions.size} Qs)`}
              </button>
            </div>
          </form>
        </div>

        {/* QUESTION SELECTION COLUMN */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search questions by statement..." 
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={handleSelectAllFiltered} 
                className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Select Visible
              </button>
              <button 
                type="button" 
                onClick={handleDeselectAll} 
                className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Questions Selection Checklist */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredQuestions.map(q => {
              const isSelected = selectedQuestions.has(q.id);
              return (
                <label 
                  key={q.id} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected 
                      ? 'bg-blue-50/50 border-blue-600 dark:bg-blue-950/20 dark:border-blue-600' 
                      : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded text-blue-600 shrink-0"
                    checked={isSelected}
                    onChange={() => handleToggleQuestion(q.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1 text-[10px] font-semibold">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {subjects.find(s=>s.id==q.subject_id)?.name || 'General'}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        Marks: {q.marks}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                </label>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                No questions found. Add questions in the Question Bank first.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
