import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Plus, Edit2, Trash2, CheckCircle, Search, Filter } from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const { token } = useAuth();
  
  const [search, setSearch] = useState('');

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
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/questions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/subjects').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/chapters').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/topics').then(r => r.json())
      ]);
      setQuestions(q); setSubjects(s); setChapters(c); setTopics(t);
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
    if (formData.options.some(opt => opt.trim() === '')) return alert("All options must be filled.");
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/questions', {
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
    if(!window.confirm("Delete this question?")) return;
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + `/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredQuestions = questions.filter(q => q.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">MCQ Question Bank</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ADD QUESTION FORM */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Plus size={20} className="text-blue-500" /> Create Question
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chapter</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.chapter_id} onChange={e => setFormData({...formData, chapter_id: e.target.value})}>
                  <option value="">Select Chapter</option>
                  {chapters.filter(c => c.subject_id == formData.subject_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question Text</label>
              <textarea required className="w-full p-2 border rounded-lg dark:bg-slate-900" rows="3" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})}></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Options (Select Correct Answer)</label>
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct_answer" checked={formData.answer_index === i} onChange={() => setFormData({...formData, answer_index: i})} className="w-4 h-4 cursor-pointer" />
                  <input required type="text" className={`flex-1 p-2 border rounded-lg dark:bg-slate-900 ${formData.answer_index === i ? 'border-green-500 ring-1 ring-green-500' : ''}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Explanation (Shown after test)</label>
              <textarea className="w-full p-2 border rounded-lg dark:bg-slate-900" rows="2" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marks</label>
                <input required type="number" step="0.5" className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.marks} onChange={e => setFormData({...formData, marks: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Negative Marks</label>
                <input required type="number" step="0.05" className="w-full p-2 border rounded-lg dark:bg-slate-900" value={formData.negative_marks} onChange={e => setFormData({...formData, negative_marks: parseFloat(e.target.value)})} />
              </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" className="w-5 h-5" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
              <span className="font-medium">Published</span>
            </label>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
              Save Question
            </button>
          </form>
        </div>

        {/* QUESTIONS LIST */}
        <div className="xl:col-span-2 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {filteredQuestions.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500">
                No questions found.
              </div>
            ) : filteredQuestions.map(q => (
              <div key={q.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded mr-2 mb-2">
                      {subjects.find(s=>s.id==q.subject_id)?.name}
                    </span>
                    <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded mr-2 mb-2">
                      {chapters.find(c=>c.id==q.chapter_id)?.name}
                    </span>
                    {q.published ? <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Published</span> : <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">Draft</span>}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm font-medium text-slate-500">+{q.marks} / -{q.negative_marks}</span>
                    <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={18}/></button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{q.text}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className={`p-2.5 border rounded-lg text-sm ${idx === q.answer_index ? 'bg-green-50 dark:bg-green-900/20 border-green-300 text-green-800 dark:text-green-300 font-medium' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                      {String.fromCharCode(65+idx)}. {opt}
                    </div>
                  ))}
                </div>
                
                {q.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                    <strong>Explanation:</strong> {q.explanation}
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
