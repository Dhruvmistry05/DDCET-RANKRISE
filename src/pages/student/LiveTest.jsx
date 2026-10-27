import { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // qId -> optIdx
  const [status, setStatus] = useState({}); // qId -> 'answered' | 'review' | 'unanswered'
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const testRef = useRef(null);
  const answersRef = useRef({});
  const timeLeftRef = useRef(0);
  const submitRef = useRef(null);

  // Keep refs synchronized with state
  useEffect(() => {
    testRef.current = test;
  }, [test]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

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
    const currentTest = testRef.current;
    const currentAnswers = answersRef.current;
    if (!currentTest || !Array.isArray(currentTest.questions) || currentTest.questions.length === 0) {
      navigate('/student/mocks');
      return;
    }

    let score = 0, correct = 0, wrong = 0, unattempted = 0;
    const newMistakes = [];
    
    currentTest.questions.forEach(q => {
      const ans = currentAnswers[q.id];
      const marks = Number(q.marks) || 2;
      const negMarks = Number(q.negativeMarks !== undefined ? q.negativeMarks : (q.negative_marks !== undefined ? q.negative_marks : 0.5)) || 0;

      if (ans === undefined) {
        unattempted++;
      } else if (ans === q.correctOptionIndex) {
        correct++;
        score += marks;
      } else {
        wrong++;
        score -= negMarks;
        newMistakes.push({
          qid: q.id,
          topic: q.chapter || q.subject || 'General',
          question: q.text,
          selected: (Array.isArray(q.options) && q.options[ans] !== undefined) ? q.options[ans] : `Option ${ans + 1}`,
          correct: (Array.isArray(q.options) && q.options[q.correctOptionIndex] !== undefined) ? q.options[q.correctOptionIndex] : `Option ${(q.correctOptionIndex || 0) + 1}`
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
      }).catch(err => console.warn('Could not save mistakes locally', err));
    }

    const accuracy = (correct + wrong) > 0 ? (correct / (correct + wrong)) * 100 : 0;
    const questionsAttempted = correct + wrong;
    const duration = currentTest.durationMinutes || currentTest.duration_minutes || 60;
    const totalDuration = duration * 60;
    const timeSpentSeconds = Math.max(1, totalDuration - (timeLeftRef.current || 0));

    let recordedRank = null;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const maxScore = currentTest.questions.reduce((sum, q) => sum + (Number(q.marks) || 2), 0);
        const res = await fetch(`${API_BASE_URL}/api/student/tests/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            test_id: currentTest.id,
            test_title: currentTest.title,
            score,
            max_score: maxScore,
            correct_count: correct,
            wrong_count: wrong,
            unattempted_count: unattempted,
            questions_attempted: questionsAttempted,
            accuracy,
            time_spent_seconds: timeSpentSeconds,
            answers: currentAnswers
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
    
    navigate(`/student/result/${currentTest.id}`, { state: { result } });
  };

  submitRef.current = submitTest;

  // Load test details and initialize timer
  useEffect(() => {
    let timer = null;

    const loadAssessment = async () => {
      setLoading(true);
      setErrorMsg(null);
      let t = null;

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/api/tests/${testId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            t = data;
          }
        }
      } catch (err) {
        console.warn('Network fetch failed, attempting fallback to static tests', err);
      }

      if (!t) {
        // Fallback for static mock tests if offline or not in backend
        t = getTestById(testId);
      }

      if (!t) {
        setLoading(false);
        setErrorMsg('Assessment not found or is currently unavailable.');
        return;
      }

      // Check if test has questions
      if (!Array.isArray(t.questions) || t.questions.length === 0) {
        setLoading(false);
        setErrorMsg('This assessment currently has no questions assigned to it.');
        return;
      }

      // Timing & Window validation
      const now = new Date();
      const startTime = t.scheduledStartTime || t.scheduled_start_time;
      const endTime = t.scheduledEndTime || t.scheduled_end_time;
      const isScheduledLive = t.type === 'scheduled_live';

      if (isScheduledLive && startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (now < start) {
          setLoading(false);
          setErrorMsg(`This scheduled assessment has not started yet. Starts at: ${start.toLocaleString()}`);
          return;
        }
        if (now > end) {
          setLoading(false);
          setErrorMsg('This scheduled live assessment window has concluded.');
          return;
        }
      }

      const durationMins = t.durationMinutes || t.duration_minutes || 60;
      t.durationMinutes = durationMins;
      t.duration_minutes = durationMins;

      // Determine initial timeLeft
      let initialSeconds = durationMins * 60;
      if (isScheduledLive && endTime) {
        const remainingWindow = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
        initialSeconds = Math.min(initialSeconds, remainingWindow);
      }

      setTest(t);
      testRef.current = t;
      setTimeLeft(initialSeconds);
      timeLeftRef.current = initialSeconds;

      const initStatuses = {};
      t.questions.forEach(q => {
        initStatuses[q.id] = 'unanswered';
      });
      setStatus(initStatuses);
      setLoading(false);

      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (submitRef.current) submitRef.current();
            return 0;
          }
          timeLeftRef.current = prev - 1;
          return prev - 1;
        });
      }, 1000);
    };

    loadAssessment();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading assessment environment...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">Assessment Notice</h2>
          <p className="text-sm text-slate-300">
            {errorMsg || 'Assessment not found or is currently unavailable.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/student/mocks')}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Return to Test Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = test.questions[currentIdx] || test.questions[0];

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.values(status).filter(s => s === 'answered').length;
  const reviewCount = Object.values(status).filter(s => s === 'review').length;
  const unansweredCount = test.questions.length - answeredCount - reviewCount;
  const currentOptions = Array.isArray(q.options) ? q.options : [];

  const renderPaletteContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Question Palette</h2>
          <span className="text-xs text-slate-500">{answeredCount} of {test.questions.length} answered</span>
        </div>
        <button 
          onClick={() => setIsPaletteOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:white rounded-md cursor-pointer"
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
              className={`h-9 rounded-lg font-semibold text-xs border flex items-center justify-center transition-colors cursor-pointer ${bgColor} ${
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
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium border border-slate-700 cursor-pointer"
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
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
                +{q.marks || 2} Mark
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium">
                -{q.negativeMarks !== undefined ? q.negativeMarks : 0.5} Neg
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
              {currentOptions.map((opt, idx) => {
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
                        setAnswers(prev => ({ ...prev, [q.id]: idx }));
                        setStatus(prev => ({ ...prev, [q.id]: 'answered' }));
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
                  onClick={() => setStatus(prev => ({ ...prev, [q.id]: 'review' }))}
                  className="flex-1 sm:flex-none px-3.5 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Mark Review
                </button>
                <button 
                  onClick={() => {
                    setAnswers(prev => {
                      const next = { ...prev };
                      delete next[q.id];
                      return next;
                    });
                    setStatus(prev => ({ ...prev, [q.id]: 'unanswered' }));
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 border border-[#E2E8F0] dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Clear Answer
                </button>
              </div>

              {/* Navigation & Submit Actions */}
              <div className="flex gap-2">
                {currentIdx > 0 && (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx - 1)} 
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>
                )}
                
                {currentIdx < test.questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIdx(currentIdx + 1)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Save & Next</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsSubmitModalOpen(true)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
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
                className="flex-1 sm:flex-none px-4 py-2 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg min-h-[40px] transition-colors cursor-pointer"
              >
                Back to Test
              </button>
              <button 
                onClick={submitTest} 
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs min-h-[40px] transition-colors cursor-pointer"
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
