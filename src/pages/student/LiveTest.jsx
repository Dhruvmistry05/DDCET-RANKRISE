import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../../store/mockData';
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
          <h2 className="font-bold text-sm text-slate-800 dark:text-white">Question Palette</h2>
          <span className="text-xs text-slate-500">{answeredCount} of {test.questions.length} answered</span>
        </div>
        <button 
          onClick={() => setIsPaletteOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2.5 overflow-y-auto flex-1">
        {test.questions.map((question, idx) => {
          const stat = status[question.id];
          let bgColor = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
          if (stat === 'answered') bgColor = 'bg-emerald-600 text-white border-emerald-600';
          if (stat === 'review') bgColor = 'bg-amber-500 text-white border-amber-500';
          
          const isCurrent = currentIdx === idx;
          return (
            <button 
              key={question.id}
              onClick={() => {
                setCurrentIdx(idx);
                setIsPaletteOpen(false);
              }}
              className={`h-11 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center transition-all ${bgColor} ${
                isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 font-black scale-105' : ''
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
            <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Answered</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-amber-500 rounded-md shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Marked for Review</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{reviewCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-slate-300 dark:bg-slate-700 rounded-md shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Not Visited</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">{unansweredCount}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* Top Test Header Bar */}
      <header className="bg-slate-900 text-white px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center shadow-md z-20 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="hidden sm:inline-block px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-400/20">
            DDCET Live
          </span>
          <h1 className="text-sm sm:text-lg font-bold text-white truncate max-w-[160px] sm:max-w-md">
            {test.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Palette Trigger Button */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 min-h-[38px]"
            title="Open Question Palette"
          >
            <Grid size={15} />
            <span>Q: {currentIdx + 1}/{test.questions.length}</span>
          </button>

          {/* Timer Display */}
          <div className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-mono text-xs sm:text-sm font-bold min-h-[38px] ${
            timeLeft < 300 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
          }`}>
            <Timer size={16} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Quick Submit Button */}
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors min-h-[38px]"
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
          <div className="px-4 sm:px-8 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs sm:text-sm font-semibold shrink-0">
            <span className="text-slate-600 dark:text-slate-300">
              Question <span className="font-bold text-blue-600 dark:text-blue-400">{currentIdx + 1}</span> of {test.questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                +{q.marks} Mark
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold">
                -{q.negativeMarks} Neg
              </span>
            </div>
          </div>

          {/* Question Statement & Options */}
          <div className="p-4 sm:p-8 flex-1 max-w-4xl mx-auto w-full space-y-6">
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {q.text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3 pt-2">
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === idx;
                return (
                  <label 
                    key={idx} 
                    className={`flex items-start sm:items-center p-3.5 sm:p-4 border rounded-2xl cursor-pointer transition-all min-h-[52px] ${
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs sm:text-sm shrink-0 mr-3.5 transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    
                    <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-snug flex-1">
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
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0 shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between gap-2.5 sm:gap-4">
              
              {/* Review & Clear Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setStatus({ ...status, [q.id]: 'review' })}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-amber-500/80 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
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
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-semibold text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  Clear Answer
                </button>
              </div>

              {/* Navigation & Submit Actions */}
              <div className="flex gap-2">
                {currentIdx > 0 && (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx - 1)} 
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                  >
                    <ArrowLeft size={16} />
                    <span>Previous</span>
                  </button>
                )}
                
                {currentIdx < test.questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx + 1)} 
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 min-h-[44px]"
                  >
                    <span>Save & Next</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsSubmitModalOpen(true)} 
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 min-h-[44px]"
                  >
                    SUBMIT TEST
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
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 z-10">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <h3 className="text-xl font-bold">Submit Assessment?</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to finalize your submission? Once submitted, your answers cannot be altered.
            </p>

            {/* Assessment Quick Summary */}
            <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="block font-black text-lg text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-semibold">Answered</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                <span className="block font-black text-lg text-amber-700 dark:text-amber-400">{reviewCount}</span>
                <span className="text-amber-600 dark:text-amber-500 font-semibold">In Review</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                <span className="block font-black text-lg text-slate-700 dark:text-slate-300">{unansweredCount}</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Left Blank</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="flex-1 sm:flex-none px-4 py-2.5 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl min-h-[44px]"
              >
                Back to Test
              </button>
              <button 
                onClick={submitTest} 
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 min-h-[44px]"
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