import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { 
  Timer, ArrowLeft, ArrowRight, Grid, CheckCircle2, 
  AlertCircle, HelpCircle, X, ShieldAlert, Check
} from 'lucide-react';

export default function LiveTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // qId -> optIdx
  const [status, setStatus] = useState({}); // qId -> 'answered' | 'review' | 'unanswered'
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

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
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("WARNING: Tab switching is strictly prohibited during the live test! This incident has been recorded.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const submitTest = async () => {
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

    // Save mistakes to local storage for Mistake Book
    if (newMistakes.length > 0) {
      import('../../store/mockData').then(({ getProgressStore, saveProgressStore }) => {
        const store = getProgressStore();
        store.mistakes = [...(store.mistakes || []), ...newMistakes];
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

    const accuracy = (correct + wrong) > 0 ? (correct / (correct + wrong)) * 100 : 0;
    const questionsAttempted = correct + wrong;
    const totalDuration = test.durationMinutes * 60;
    const timeSpentSeconds = Math.max(1, totalDuration - timeLeft);
    const maxScore = test.questions.reduce((sum, q) => sum + (q.marks || 2), 0);

    let recordedRank = null;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/tests/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            test_id: test.id,
            test_title: test.title,
            score,
            max_score: maxScore,
            correct_count: correct,
            wrong_count: wrong,
            unattempted_count: unattempted,
            questions_attempted: questionsAttempted,
            accuracy,
            time_spent_seconds: timeSpentSeconds,
            answers
          })
        });
        if (res.ok) {
          const data = await res.json();
          recordedRank = data.stats?.current_rank;
        }
      } catch (err) {
        console.error('Error submitting test to server:', err);
      }
    }

    const result = {
      score, correct, wrong, unattempted,
      accuracy,
      rank: recordedRank || '#1'
    };
    
    navigate(`/student/result/${test.id}`, { state: { result } });
  };

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading assessment environment...</span>
        </div>
      </div>
    );
  }

  const q = test.questions[currentIdx];

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.values(status).filter(s => s === 'answered').length;
  const reviewCount = Object.values(status).filter(s => s === 'review').length;
  const unansweredCount = test.questions.length - answeredCount - reviewCount;

  const renderPaletteContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Question Palette</h2>
          <span className="text-xs text-slate-500">{answeredCount} of {test.questions.length} answered</span>
        </div>
        <button 
          onClick={() => setIsPaletteOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 overflow-y-auto flex-1 content-start">
        {test.questions.map((question, idx) => {
          const stat = status[question.id];
          let bgColor = 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
          if (stat === 'answered') bgColor = 'bg-[#1E3A8A] text-white border-[#1E3A8A]';
          if (stat === 'review') bgColor = 'bg-amber-500 text-white border-amber-500';
          
          const isCurrent = currentIdx === idx;
          return (
            <button 
              key={question.id}
              onClick={() => {
                setCurrentIdx(idx);
                setIsPaletteOpen(false);
              }}
              className={`h-9 rounded-lg font-semibold text-xs border flex items-center justify-center transition-colors ${bgColor} ${
                isCurrent ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-1 dark:ring-offset-slate-800' : ''
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600 rounded shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Answered</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Marked Review</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{reviewCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Not Visited</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">{unansweredCount}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* Top Test Header Bar */}
      <header className="h-14 bg-slate-900 text-white px-4 sm:px-6 flex justify-between items-center z-20 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-semibold uppercase tracking-wider border border-slate-700">
            DDCET Live
          </span>
          <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[160px] sm:max-w-md">
            {test.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Palette Trigger Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium border border-slate-700"
            title="Open Question Palette"
          >
            <Grid size={14} />
            <span>Q: {currentIdx + 1}/{test.questions.length}</span>
          </button>

          {/* Timer Display */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold ${
            timeLeft < 300 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-slate-800 text-slate-200 border border-slate-700'
          }`}>
            <Timer size={14} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Quick Submit Button */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Main Examination Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Question + Action Column */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          
          {/* Question Subheader: Number & Marks */}
          <div className="px-4 sm:px-8 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-medium shrink-0">
            <span className="text-slate-600 dark:text-slate-400">
              Question <span className="font-semibold text-slate-900 dark:text-white">{currentIdx + 1}</span> of {test.questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                +{q.marks} Mark
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium">
                -{q.negativeMarks} Neg
              </span>
            </div>
          </div>

          {/* Question Statement & Options */}
          <div className="p-4 sm:p-8 flex-1 max-w-3xl mx-auto w-full space-y-5">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
              {q.text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-2.5 pt-1">
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === idx;
                return (
                  <label 
                    key={idx} 
                    className={`flex items-start sm:items-center p-3 sm:p-3.5 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#2563EB] dark:border-blue-500 ring-1 ring-[#2563EB]' 
                        : 'bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs shrink-0 mr-3 transition-colors ${
                      isSelected 
                        ? 'bg-[#1E3A8A] text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    
                    <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-normal flex-1">
                      {opt}
                    </span>

                    <input 
                      type="radio" 
                      name={`option-${q.id}`}
                      className="hidden"
                      checked={isSelected}
                      onChange={() => {
                        setAnswers({ ...answers, [q.id]: idx });
                        setStatus({ ...status, [q.id]: 'answered' });
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border-t border-[#E2E8F0] dark:border-slate-700 shrink-0">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between gap-2.5">
              
              {/* Review & Clear Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setStatus({ ...status, [q.id]: 'review' })}
                  className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-xs transition-colors"
                >
                  Mark Review
                </button>
                <button 
                  onClick={() => {
                    const newAns = {...answers}; 
                    delete newAns[q.id];
                    setAnswers(newAns);
                    setStatus({ ...status, [q.id]: 'unanswered' });
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 border border-[#E2E8F0] dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-xs transition-colors"
                >
                  Clear Answer
                </button>
              </div>

              {/* Navigation & Submit Actions */}
              <div className="flex gap-2">
                {currentIdx > 0 && (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx - 1)} 
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>
                )}
                
                {currentIdx < test.questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx + 1)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Save & Next</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsSubmitModalOpen(true)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Desktop Question Palette Sidebar */}
        <aside className="hidden lg:flex w-72 xl:w-80 border-l border-slate-200 dark:border-slate-700 flex-col shrink-0">
          {renderPaletteContent()}
        </aside>

        {/* Mobile Question Palette Drawer Modal */}
        {isPaletteOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
              onClick={() => setIsPaletteOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10">
              {renderPaletteContent()}
            </div>
          </div>
        )}
      </div>

      {/* Submit Test Confirmation Dialog */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setIsSubmitModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-[#E2E8F0] dark:border-slate-700 space-y-5 z-10">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-lg font-bold">Submit Assessment?</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to finalize your submission? Once submitted, your answers cannot be altered.
            </p>

            {/* Assessment Quick Summary */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="block font-bold text-lg text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-semibold text-[11px]">Answered</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                <span className="block font-bold text-lg text-amber-700 dark:text-amber-400">{reviewCount}</span>
                <span className="text-amber-600 dark:text-amber-500 font-semibold text-[11px]">In Review</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                <span className="block font-bold text-lg text-slate-700 dark:text-slate-300">{unansweredCount}</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Blank</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="flex-1 sm:flex-none px-4 py-2 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg min-h-[40px] transition-colors"
              >
                Back to Test
              </button>
              <button 
                onClick={submitTest} 
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs min-h-[40px] transition-colors"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}