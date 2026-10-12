import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../../store/mockData';
import { Timer, ArrowLeft, ArrowRight } from 'lucide-react';

export default function LiveTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // qId -> optIdx
  const [status, setStatus] = useState({}); // qId -> 'answered' | 'review' | 'unanswered'
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const t = getTestById(testId);
    if (!t) return;
    
    // Quick validation
    const now = new Date();
    if (now > new Date(t.scheduledEndTime) || now < new Date(t.scheduledStartTime)) {
      navigate('/student');
      return;
    }

    setTest(t);
    const endTime = new Date(t.scheduledEndTime).getTime();
    
    const initStatuses = {};
    t.questions.forEach(q => initStatuses[q.id] = 'unanswered');
    setStatus(initStatuses);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(Math.min(remaining, t.durationMinutes * 60));
      if (remaining <= 0) {
        clearInterval(timer);
        submitTest();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [testId]);

  // Anti-cheating: Tab switch detection
  const answersRef = useState(answers)[0]; // to avoid stale closure if we don't want to rebind
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("WARNING: Tab switching is strictly prohibited during the live test! This incident has been recorded.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const submitTest = () => {
    let score = 0, correct = 0, wrong = 0, unattempted = 0;
    const newMistakes = [];
    
    test.questions.forEach(q => {
      const ans = answers[q.id];
      if (ans === undefined) {
        unattempted++;
      } else if (ans === q.correctOptionIndex) {
        correct++;
        score += q.marks;
      } else {
        wrong++;
        score -= q.negativeMarks;
        newMistakes.push({
          qid: q.id,
          topic: q.chapter || q.subject,
          question: q.text,
          selected: q.options[ans],
          correct: q.options[q.correctOptionIndex]
        });
      }
    });

    // Save to local storage
    if (newMistakes.length > 0) {
      import('../../store/mockData').then(({ getProgressStore, saveProgressStore }) => {
        const store = getProgressStore();
        store.mistakes = [...(store.mistakes || []), ...newMistakes];
        // Remove duplicates by qid just in case
        const uniqueMistakes = [];
        const seen = new Set();
        for (const m of store.mistakes) {
          if (!seen.has(m.qid)) {
            seen.add(m.qid);
            uniqueMistakes.push(m);
          }
        }
        store.mistakes = uniqueMistakes;
        saveProgressStore(store);
      });
    }

    const result = {
      score, correct, wrong, unattempted,
      accuracy: (correct + wrong) > 0 ? (correct / (correct + wrong)) * 100 : 0
    };
    
    // Pass state via router
    navigate(`/student/result/${test.id}`, { state: { result } });
  };

  if (!test) return <div className="p-8 text-center">Loading or invalid test...</div>;

  const q = test.questions[currentIdx];

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex justify-between items-center shadow-md z-10">
        <h1 className="text-xl font-bold">{test.title}</h1>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${timeLeft < 300 ? 'bg-red-500' : 'bg-blue-800'}`}>
          <Timer size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 bg-white dark:bg-slate-800 border-b flex justify-between text-slate-500 font-semibold text-sm">
            <span>Question {currentIdx + 1} of {test.questions.length}</span>
            <span>+{q.marks} / -{q.negativeMarks} Marks</span>
          </div>

          <div className="p-8 flex-1">
            <h2 className="text-2xl font-medium text-slate-800 dark:text-white mb-8">{q.text}</h2>
            <div className="space-y-4 max-w-3xl">
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === idx;
                return (
                  <label key={idx} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-primary shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900'}`}>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-lg text-slate-700 dark:text-slate-300">{opt}</span>
                    <input 
                      type="radio" 
                      name="option" 
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {
                        setAnswers({ ...answers, [q.id]: idx });
                        setStatus({ ...status, [q.id]: 'answered' });
                      }}
                    />
                  </label>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border-t flex justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex gap-4">
              <button 
                onClick={() => setStatus({ ...status, [q.id]: 'review' })}
                className="px-6 py-3 border border-orange-400 text-orange-600 rounded-lg font-medium hover:bg-orange-50"
              >
                Mark for Review
              </button>
              <button 
                onClick={() => {
                  const newAns = {...answers}; delete newAns[q.id];
                  setAnswers(newAns);
                  setStatus({ ...status, [q.id]: 'unanswered' });
                }}
                className="px-6 py-3 border border-slate-300 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-50 dark:bg-slate-900"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-4">
              {currentIdx > 0 && (
                <button onClick={() => setCurrentIdx(currentIdx - 1)} className="px-6 py-3 bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-300">
                  <ArrowLeft size={20} /> Previous
                </button>
              )}
              {currentIdx < test.questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(currentIdx + 1)} className="px-6 py-3 bg-primary text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800">
                  Save & Next <ArrowRight size={20} />
                </button>
              ) : (
                <button onClick={() => document.getElementById('submitModal').showModal()} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                  SUBMIT
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Palette */}
        <aside className="w-80 bg-white dark:bg-slate-800 border-l flex flex-col">
          <div className="p-4 bg-slate-100 dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300 border-b">Question Palette</div>
          
          <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto flex-1">
            {test.questions.map((question, idx) => {
              const stat = status[question.id];
              let bgColor = 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
              if (stat === 'answered') bgColor = 'bg-green-500 text-white border-green-600';
              if (stat === 'review') bgColor = 'bg-orange-500 text-white border-orange-600';
              
              return (
                <button 
                  key={question.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-12 rounded-lg font-bold border-2 flex items-center justify-center transition-transform ${bgColor} ${currentIdx === idx ? 'ring-4 ring-blue-300 scale-110' : ''}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 space-y-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded"></div> Marked for Review</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 rounded"></div> Unanswered</div>
          </div>
        </aside>
      </div>

      <dialog id="submitModal" className="p-8 rounded-xl backdrop:bg-black/50 shadow-2xl">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Submit Test?</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Are you sure you want to submit? You cannot change your answers after submission.</p>
        <div className="flex justify-end gap-4">
          <form method="dialog">
            <button className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/50 rounded-lg">Cancel</button>
          </form>
          <button onClick={submitTest} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Submit Test</button>
        </div>
      </dialog>
    </div>
  );
}