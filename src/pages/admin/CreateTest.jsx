import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Search } from 'lucide-react';

export default function CreateTest() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('mock_paper');
  const [duration, setDuration] = useState(60);
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [search, setSearch] = useState('');

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [q, s, c] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/questions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/subjects').then(r => r.json()),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/chapters').then(r => r.json())
      ]);
      setQuestions(q); setSubjects(s); setChapters(c);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(selectedQuestions.size === 0) {
      alert("Select at least one question for the test.");
      return;
    }
    
    if (type === 'scheduled_live' && (!startTime || !endTime)) {
      alert("Please provide start and end times for scheduled live tests.");
      return;
    }

    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title, type, duration_minutes: duration,
          subject_id: subjectId, chapter_id: chapterId,
          scheduled_start_time: startTime || null,
          scheduled_end_time: endTime || null,
          question_ids: Array.from(selectedQuestions),
          status: 'draft'
        })
      });
      navigate('/admin/tests');
    } catch (e) {
      console.error(e);
    }
  };

  let filteredQuestions = questions;
  if (type === 'subject_wise' && subjectId) filteredQuestions = filteredQuestions.filter(q => q.subject_id == subjectId);
  if (type === 'chapter_wise' && chapterId) filteredQuestions = filteredQuestions.filter(q => q.chapter_id == chapterId);
  if (search) filteredQuestions = filteredQuestions.filter(q => q.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Test Builder</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* TEST CONFIGURATION */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit space-y-4">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Configuration</h2>
          <form id="test-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Test Title</label>
              <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" placeholder="e.g. Full Mock Test 1" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Test Type</label>
              <select className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={type} onChange={e => { setType(e.target.value); setSubjectId(''); setChapterId(''); }}>
                <option value="mock_paper">Combined Mock Paper</option>
                <option value="subject_wise">Subject-wise Test</option>
                <option value="chapter_wise">Chapter-wise Test</option>
                <option value="scheduled_live">Scheduled Live Test</option>
              </select>
            </div>

            {(type === 'subject_wise' || type === 'chapter_wise') && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Subject</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(''); }}>
                  <option value="">-- Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {type === 'chapter_wise' && (
              <div>
                <label className="block text-sm font-medium mb-1">Select Chapter</label>
                <select required className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={chapterId} onChange={e => setChapterId(e.target.value)}>
                  <option value="">-- Chapter --</option>
                  {chapters.filter(c => c.subject_id == subjectId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {type === 'scheduled_live' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input required type="datetime-local" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={startTime} onChange={e=>setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input required type="datetime-local" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" value={endTime} onChange={e=>setEndTime(e.target.value)} />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input required value={duration} onChange={e=>setDuration(e.target.value)} type="number" min="1" className="w-full p-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" />
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">Selected Questions:</span>
                <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">{selectedQuestions.size}</span>
              </div>
              <button type="submit" form="test-form" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Save as Draft
              </button>
            </div>
          </form>
        </div>

        {/* QUESTION SELECTION */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search question bank..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="button" onClick={handleSelectAllFiltered} className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
              Select All Visible
            </button>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {filteredQuestions.map(q => (
              <label key={q.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${selectedQuestions.has(q.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800' : 'bg-white border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700'}`}>
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedQuestions.has(q.id)}
                  onChange={() => handleToggleQuestion(q.id)}
                />
                <div className="flex-1">
                  <div className="flex gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                      {subjects.find(s=>s.id==q.subject_id)?.name?.slice(0, 20)}..
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                      Marks: {q.marks}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed">{q.text}</p>
                </div>
              </label>
            ))}
            {filteredQuestions.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                No questions available for this selection. Try adjusting the filters or adding questions in the Question Bank.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
