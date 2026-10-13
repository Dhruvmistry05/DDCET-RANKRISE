import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Plus, Trash2, Search } from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;
  
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [formData, setFormData] = useState({
    text: '', options: ['', '', '', ''], answer_index: 0, explanation: '', marks: 1, negative_marks: 0.25,
    subject_id: '', chapter_id: '', topic_id: '', published: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      console.error(e);
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
      await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      setFormData({
        text: '', options: ['', '', '', ''], answer_index: 0, explanation: '', marks: 1, negative_marks: 0.25,
        subject_id: '', chapter_id: '', topic_id: '', published: true
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    const matchesSub = !filterSubject || String(q.subject_id) === filterSubject;
    return matchesSearch && matchesSub;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Question Bank Manager
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Add, organize, and manage multiple choice questions with marking rules.
        </p>
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
                  onChange={e => setFormData({...formData, subject_id: e.target.value})}
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
                  onChange={e => setFormData({...formData, chapter_id: e.target.value})}
                >
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => !formData.subject_id || c.subject_id == formData.subject_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search questions by statement..." 
                className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {subjects.length > 0 && (
              <select
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none"
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>

          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
            {filteredQuestions.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No matching questions found in this collection.
              </div>
            ) : filteredQuestions.map(q => (
              <div key={q.id} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.find(s=>s.id==q.subject_id)?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded">
                        {subjects.find(s=>s.id==q.subject_id)?.name}
                      </span>
                    )}
                    {chapters.find(c=>c.id==q.chapter_id)?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded">
                        {chapters.find(c=>c.id==q.chapter_id)?.name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      q.published ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {q.published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-500">+{q.marks} / -{q.negative_marks}</span>
                    <button 
                      onClick={() => handleDelete(q.id)} 
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="Delete question"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {q.text}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 border rounded-lg text-xs font-medium ${
                        idx === q.answer_index 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold' 
                          : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold mr-1.5">{String.fromCharCode(65+idx)}.</span> 
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
