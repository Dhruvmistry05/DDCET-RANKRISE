import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ddcet2027OfficialQuestions } from '../../store/ddcet2026Questions';
import { getProgressStore, saveProgressStore } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  Sparkles, Clock, Target, CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, ArrowLeft, RotateCcw, Award, ShieldAlert, BookOpen, 
  Filter, HelpCircle, Layers, Grid, Check, Sliders, PlayCircle,
  BarChart2, Zap, Bookmark
} from 'lucide-react';

export default function QuizGenerator() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Generator Setup State
  const [questionCount, setQuestionCount] = useState(100); // 100 or 50
  const [sectionScope, setSectionScope] = useState('both'); // 'both', 'sec1', 'sec2', 'mixed50'
  const [quizMode, setQuizMode] = useState('exam'); // 'exam' (timed) or 'practice' (instant feedback)
  const [shuffleQuestions, setShuffleQuestions] = useState(true);

  // Active Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // qId -> selectedOptIndex
  const [questionStatus, setQuestionStatus] = useState({}); // qId -> 'answered' | 'review' | 'unanswered'
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Filter view in results
  const [resultFilter, setResultFilter] = useState('all'); // 'all', 'wrong', 'correct', 'unattempted'

  // Available topics for info
  const section1Questions = useMemo(() => ddcet2027OfficialQuestions.filter(q => q.number <= 50), []);
  const section2Questions = useMemo(() => ddcet2027OfficialQuestions.filter(q => q.number > 50), []);
  const [bankQuestions, setBankQuestions] = useState([]);

  // Fetch verified question bank on mount
  useEffect(() => {
    async function loadBank() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/questions`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((q, idx) => {
              let opts = q.options;
              if (typeof opts === 'string') {
                try { opts = JSON.parse(opts); } catch (e) { opts = []; }
              }
              const ansIdx = q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.answer_index !== undefined ? q.answer_index : 0);
              return {
                id: q.id || `bank-q-${idx}`,
                number: idx + 1,
                section: 'Section-1: Basics of Science & Engineering (Physics)',
                subject: q.subject || 'Physics',
                chapter: q.chapter || 'Physics',
                topic: q.topic || '',
                text: q.text,
                options: Array.isArray(opts) ? opts : [],
                correctOptionIndex: ansIdx,
                correctLetter: ['A', 'B', 'C', 'D'][ansIdx] || 'A',
                isBonus: false,
                marks: 2.0,
                negativeMarks: 0.5,
                explanation: q.explanation || ''
              };
            });
            setBankQuestions(formatted);
          }
        }
      } catch (e) {
        console.warn('Could not load bank questions for quiz generator:', e);
      }
    }
    loadBank();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!quizStarted || quizSubmitted || quizMode === 'practice') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizSubmitted, quizMode]);

  // Anti-cheating visibility check
  useEffect(() => {
    if (!quizStarted || quizSubmitted || quizMode === 'practice') return;

    const handleVisibility = () => {
      if (document.hidden) {
        alert("DDCET NOTICE: Switching tabs or leaving the examination window during a simulated test is strictly monitored.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [quizStarted, quizSubmitted, quizMode]);

  // Handle Quiz Generation
  const handleGenerateQuiz = () => {
    let pool = [];

    if (sectionScope === 'physics_bank') {
      const source = bankQuestions.length > 0 ? bankQuestions : section1Questions;
      const shuffled = [...source].sort(() => 0.5 - Math.random());
      pool = shuffled.slice(0, Math.min(questionCount, shuffled.length)).map((q, idx) => ({
        ...q,
        number: idx + 1,
        marks: 2.0,
        negativeMarks: 0.5
      }));
    } else if (questionCount === 100) {
      // Full Paper: All 100 questions (50 from Sec 1 + 50 from Sec 2)
      const s1Source = bankQuestions.length > 0 ? bankQuestions : section1Questions;
      if (shuffleQuestions) {
        const s1 = [...s1Source].sort(() => 0.5 - Math.random()).slice(0, 50).map((q, idx) => ({
          ...q,
          number: idx + 1,
          section: 'Section-1: Basics of Science & Engineering'
        }));
        const s2 = [...section2Questions].sort(() => 0.5 - Math.random()).map((q, idx) => ({
          ...q,
          number: 50 + idx + 1,
          section: 'Section-2: Aptitude & Soft Skills'
        }));
        pool = [...s1, ...s2];
      } else {
        pool = [...ddcet2027OfficialQuestions];
      }
    } else {
      // 50 Questions Half / Sectional Paper
      if (sectionScope === 'sec1') {
        const s1Source = bankQuestions.length > 0 ? bankQuestions : section1Questions;
        pool = shuffleQuestions 
          ? [...s1Source].sort(() => 0.5 - Math.random()).slice(0, 50).map((q, idx) => ({ ...q, number: idx + 1 }))
          : [...section1Questions];
      } else if (sectionScope === 'sec2') {
        pool = shuffleQuestions 
          ? [...section2Questions].sort(() => 0.5 - Math.random()) 
          : [...section2Questions];
      } else {
        // Mixed 50 (25 from Sec 1 + 25 from Sec 2)
        const s1Source = bankQuestions.length > 0 ? bankQuestions : section1Questions;
        const s1 = [...s1Source].sort(() => 0.5 - Math.random()).slice(0, 25).map((q, idx) => ({ ...q, number: idx + 1 }));
        const s2 = [...section2Questions].sort(() => 0.5 - Math.random()).slice(0, 25).map((q, idx) => ({ ...q, number: 25 + idx + 1 }));
        pool = shuffleQuestions ? [...s1, ...s2].sort(() => 0.5 - Math.random()) : [...s1, ...s2];
      }
    }

    // Set duration: 100 Qs = 120 mins, 50 Qs = 60 mins
    const totalDurationSeconds = questionCount === 100 ? 120 * 60 : 60 * 60;

    const initStatus = {};
    pool.forEach(q => {
      initStatus[q.id] = 'unanswered';
    });

    setActiveQuestions(pool);
    setUserAnswers({});
    setQuestionStatus(initStatus);
    setCurrentIdx(0);
    setTimeLeft(totalDurationSeconds);
    setQuizSubmitted(false);
    setQuizResults(null);
    setQuizStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Option selection
  const handleSelectOption = (qId, optIdx) => {
    if (quizSubmitted) return;

    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setQuestionStatus(prev => ({
      ...prev,
      [qId]: 'answered'
    }));
  };

  // Mark for Review
  const handleToggleReview = (qId) => {
    if (quizSubmitted) return;

    setQuestionStatus(prev => ({
      ...prev,
      [qId]: prev[qId] === 'review' 
        ? (userAnswers[qId] !== undefined ? 'answered' : 'unanswered') 
        : 'review'
    }));
  };

  // Clear Response
  const handleClearResponse = (qId) => {
    if (quizSubmitted) return;

    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setQuestionStatus(prev => ({
      ...prev,
      [qId]: 'unanswered'
    }));
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setIsSubmitModalOpen(false);

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let earnedMarks = 0;
    let negativeDeduction = 0;
    let section1Score = 0;
    let section2Score = 0;

    const newMistakes = [];
    const questionReview = [];

    activeQuestions.forEach(q => {
      const selected = userAnswers[q.id];
      const isBonus = q.isBonus;
      const isSec1 = q.number <= 50;

      if (selected === undefined) {
        unattemptedCount++;
        questionReview.push({
          ...q,
          status: 'unattempted',
          selectedOption: null,
          isCorrect: false
        });
      } else if (selected === q.correctOptionIndex || isBonus) {
        correctCount++;
        earnedMarks += q.marks;
        if (isSec1) section1Score += q.marks;
        else section2Score += q.marks;

        questionReview.push({
          ...q,
          status: 'correct',
          selectedOption: selected,
          isCorrect: true
        });
      } else {
        wrongCount++;
        negativeDeduction += q.negativeMarks;
        if (isSec1) section1Score -= q.negativeMarks;
        else section2Score -= q.negativeMarks;

        questionReview.push({
          ...q,
          status: 'wrong',
          selectedOption: selected,
          isCorrect: false
        });

        // Add to Mistake Notebook
        newMistakes.push({
          qid: q.id,
          topic: q.chapter || q.subject,
          question: q.text,
          selected: q.options[selected],
          correct: q.options[q.correctOptionIndex] || 'Bonus Marks Awarded'
        });
      }
    });

    const netScore = Math.max(0, earnedMarks - negativeDeduction);
    const totalPossibleMarks = activeQuestions.length * 2.0;
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
    const timeSpentSeconds = (questionCount === 100 ? 120 * 60 : 60 * 60) - timeLeft;

    // Save mistakes to MistakeBook store
    if (newMistakes.length > 0) {
      const store = getProgressStore();
      const existing = store.mistakes || [];
      const seen = new Set(existing.map(m => m.qid));
      newMistakes.forEach(m => {
        if (!seen.has(m.qid)) {
          existing.push(m);
          seen.add(m.qid);
        }
      });
      store.mistakes = existing;
      saveProgressStore(store);
    }

    // Submit attempt to backend if logged in
    let recordedRank = null;
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/tests/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            test_id: `gen-quiz-${questionCount}`,
            score: netScore,
            max_score: totalPossibleMarks,
            time_spent_seconds: Math.max(10, timeSpentSeconds),
            questions_attempted: attemptedCount
          })
        });
        if (res.ok) {
          const data = await res.json();
          recordedRank = data.rank;
        }
      } catch (err) {
        console.error('Error submitting generative quiz:', err);
      }
    }

    setQuizResults({
      netScore,
      totalPossibleMarks,
      earnedMarks,
      negativeDeduction,
      correctCount,
      wrongCount,
      unattemptedCount,
      attemptedCount,
      accuracy,
      section1Score,
      section2Score,
      timeSpentSeconds,
      recordedRank,
      questionReview
    });

    setQuizSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Active question in view
  const currentQ = activeQuestions[currentIdx];

  // Counts for live palette
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(questionStatus).filter(s => s === 'review').length;
  const unansweredCount = activeQuestions.length - answeredCount;

  // =========================================================================
  // VIEW 1: RESULTS & DIAGNOSTIC REVIEW SCREEN
  // =========================================================================
  if (quizSubmitted && quizResults) {
    const filteredReview = quizResults.questionReview.filter(q => {
      if (resultFilter === 'wrong') return q.status === 'wrong';
      if (resultFilter === 'correct') return q.status === 'correct';
      if (resultFilter === 'unattempted') return q.status === 'unattempted';
      return true;
    });

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900 mb-1">
              <Award size={13} className="text-[#2563EB]" />
              <span>DDCET Evaluation Report</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {questionCount}-Question Assessment Results
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Evaluated strictly according to official DDCET marking rules (+2.0 correct, -0.5 negative penalty).
            </p>
          </div>

          <button
            onClick={() => {
              setQuizSubmitted(false);
              setQuizStarted(false);
            }}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <RotateCcw size={14} />
            <span>Generate New Quiz</span>
          </button>
        </div>

        {/* Scorecard Hero Banner */}
        <div className="bg-[#1E3A8A] text-white rounded-xl p-6 sm:p-8 border border-blue-900 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Total Score Achieved
              </span>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-baseline justify-center md:justify-start gap-2">
                <span>{quizResults.netScore.toFixed(2)}</span>
                <span className="text-lg sm:text-xl font-normal text-blue-200">/ {quizResults.totalPossibleMarks.toFixed(1)}</span>
              </div>
              <p className="text-xs text-blue-100/80 mt-1">
                Completed in {Math.floor(quizResults.timeSpentSeconds / 60)}m {quizResults.timeSpentSeconds % 60}s
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t md:border-t-0 md:border-l border-blue-800/80 pt-4 md:pt-0 md:pl-6 text-center">
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-white block">
                  {quizResults.accuracy.toFixed(1)}%
                </span>
                <span className="text-[11px] text-blue-200 font-semibold uppercase">Accuracy</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-300 block">
                  +{quizResults.earnedMarks.toFixed(1)}
                </span>
                <span className="text-[11px] text-blue-200 font-semibold uppercase">Gross Score</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-rose-300 block">
                  -{quizResults.negativeDeduction.toFixed(1)}
                </span>
                <span className="text-[11px] text-blue-200 font-semibold uppercase">Negative Penalty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Correct (+2.0)</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{quizResults.correctCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs text-center">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-1.5 border border-rose-100 dark:border-rose-900">
              <XCircle size={16} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Wrong (-0.5)</span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{quizResults.wrongCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 flex items-center justify-center mx-auto mb-1.5 border border-slate-200 dark:border-slate-600">
              <HelpCircle size={16} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Unattempted (0)</span>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{quizResults.unattemptedCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] flex items-center justify-center mx-auto mb-1.5 border border-blue-100 dark:border-blue-900">
              <Award size={16} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">State Rank</span>
            <span className="text-xl font-bold text-[#1E3A8A] dark:text-blue-400">
              {quizResults.recordedRank || '-'}
            </span>
          </div>
        </div>

        {/* Section 1 vs Section 2 Breakdown (For 100 Qs or Mixed tests) */}
        {questionCount === 100 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Section 1 (Q1 - Q50)
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Basics of Science & Engineering
              </h3>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {quizResults.section1Score.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">out of 100 Marks</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                Section 2 (Q51 - Q100)
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Aptitude (Mathematics & Soft Skills)
              </h3>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {quizResults.section2Score.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">out of 100 Marks</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Bookmark size={16} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {quizResults.wrongCount > 0 
                ? `${quizResults.wrongCount} incorrect questions were automatically added to your Mistake Notebook.`
                : 'Flawless attempt! No mistakes added to your notebook.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/student/mistakes"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
            >
              Open Mistake Book
            </Link>
            <Link
              to="/student/leaderboard"
              className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Question Review Section with Filter Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E2E8F0] dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Question-by-Question Solution Review
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `All (${quizResults.questionReview.length})` },
                { id: 'wrong', label: `Incorrect (${quizResults.wrongCount})` },
                { id: 'correct', label: `Correct (${quizResults.correctCount})` },
                { id: 'unattempted', label: `Blank (${quizResults.unattemptedCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setResultFilter(f.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    resultFilter === f.id
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReview.map((item, idx) => {
              const isCorrect = item.status === 'correct';
              const isWrong = item.status === 'wrong';
              const isUnattempted = item.status === 'unattempted';

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border bg-white dark:bg-slate-800 transition-colors shadow-2xs space-y-3 ${
                    isCorrect ? 'border-emerald-200 dark:border-emerald-800' :
                    isWrong ? 'border-rose-200 dark:border-rose-900' :
                    'border-[#E2E8F0] dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Q{item.number} • {item.chapter}
                        </span>
                        {item.isBonus && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Bonus Marks (Key X)
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {item.text}
                      </h4>
                    </div>

                    <span className={`shrink-0 px-2.5 py-1 rounded text-xs font-bold ${
                      isCorrect ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200' :
                      isWrong ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {isCorrect ? '+2.0' : isWrong ? '-0.5' : '0.0'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.options.map((opt, optIdx) => {
                      const isSelected = item.selectedOption === optIdx;
                      const isAnswer = item.correctOptionIndex === optIdx;

                      let optClasses = 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-slate-700 dark:text-slate-300';
                      if (isAnswer) {
                        optClasses = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isAnswer) {
                        optClasses = 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold';
                      }

                      return (
                        <div 
                          key={optIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${optClasses}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-[10px]">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isAnswer && <Check size={14} className="text-emerald-600 shrink-0" />}
                          {isSelected && !isAnswer && <XCircle size={14} className="text-rose-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE EXAM / PRACTICE ARENA
  // =========================================================================
  if (quizStarted && currentQ) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 font-sans">
        
        {/* Test App Bar */}
        <header className="h-14 bg-slate-900 text-white px-4 sm:px-6 flex justify-between items-center z-20 shrink-0 border-b border-slate-800 sticky top-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="hidden sm:inline-block px-2 py-0.5 bg-[#1E3A8A] text-blue-200 rounded text-xs font-semibold uppercase tracking-wider border border-blue-700">
              DDCET 2027
            </span>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-md">
              {questionCount}-Question Generative Quiz
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile Palette Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium border border-slate-700"
            >
              <Grid size={14} />
              <span>Q: {currentIdx + 1}/{activeQuestions.length}</span>
            </button>

            {/* Timer (Exam Mode) */}
            {quizMode === 'exam' && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                timeLeft < 300 
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                <Clock size={14} className={timeLeft < 300 ? 'text-rose-400' : 'text-slate-400'} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              Submit Quiz
            </button>
          </div>
        </header>

        {/* Test Main Viewport */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Question Viewer Container */}
          <main className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl w-full mx-auto space-y-6">
              
              {/* Question Header Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center">
                    {currentIdx + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {currentQ.section}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentQ.chapter}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    +2.0 Marks
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold">
                    -0.5 Negative
                  </span>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.text}
              </div>

              {/* Options Grid */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 shadow-2xs' 
                          : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#1E3A8A] text-white border border-blue-900' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-xs sm:text-sm font-medium flex-1">
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-[#E2E8F0] dark:border-slate-800 mt-6 max-w-3xl w-full mx-auto">
              <div className="flex flex-col sm:flex-row justify-between gap-2.5">
                
                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleReview(currentQ.id)}
                    className={`flex-1 sm:flex-none px-3.5 py-2 border rounded-lg font-medium text-xs transition-colors ${
                      questionStatus[currentQ.id] === 'review'
                        ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {questionStatus[currentQ.id] === 'review' ? 'Marked for Review' : 'Mark Review'}
                  </button>

                  <button
                    onClick={() => handleClearResponse(currentQ.id)}
                    className="flex-1 sm:flex-none px-3.5 py-2 border border-[#E2E8F0] dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg font-medium text-xs transition-colors"
                  >
                    Clear Choice
                  </button>
                </div>

                {/* Primary Navigation */}
                <div className="flex gap-2">
                  {currentIdx > 0 && (
                    <button
                      onClick={() => setCurrentIdx(prev => prev - 1)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
                    >
                      <ArrowLeft size={14} />
                      <span>Previous</span>
                    </button>
                  )}

                  {currentIdx < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Save & Next</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                    >
                      Submit Exam
                    </button>
                  )}
                </div>

              </div>
            </div>
          </main>

          {/* Desktop Palette Sidebar */}
          <aside className="hidden lg:flex w-72 xl:w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex-col shrink-0 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Question Palette ({activeQuestions.length})
            </h3>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 shrink-0" />
                <span>{answeredCount} Done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                <span>{reviewCount} Review</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                <span>{unansweredCount} Blank</span>
              </div>
            </div>

            {/* Grid of numbers */}
            <div className="grid grid-cols-5 gap-1.5">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = userAnswers[q.id] !== undefined;
                const isReview = questionStatus[q.id] === 'review';

                let btnClass = 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-200';
                if (isReview) {
                  btnClass = 'bg-amber-500 text-white font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-[#1E3A8A] text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${btnClass} ${
                      isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Drawer Palette */}
          {isPaletteOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setIsPaletteOpen(false)}
              />
              <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-850 p-4 shadow-2xl z-10 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Question Palette
                  </h3>
                  <button
                    onClick={() => setIsPaletteOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {activeQuestions.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isReview = questionStatus[q.id] === 'review';

                    let btnClass = 'bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300';
                    if (isReview) btnClass = 'bg-amber-500 text-white font-bold';
                    else if (isAnswered) btnClass = 'bg-[#1E3A8A] text-white font-bold';

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setIsPaletteOpen(false);
                        }}
                        className={`h-9 rounded-lg text-xs font-semibold ${btnClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Submit Confirmation Dialog */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setIsSubmitModalOpen(false)}
            />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-[#E2E8F0] dark:border-slate-700 space-y-4 z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit DDCET Assessment?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Review your progress summary below before finalizing your submission.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="block font-bold text-lg text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
                  <span className="text-emerald-600 dark:text-emerald-500 font-semibold text-[11px]">Answered</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="block font-bold text-lg text-amber-700 dark:text-amber-400">{reviewCount}</span>
                  <span className="text-amber-600 dark:text-amber-500 font-semibold text-[11px]">Review</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                  <span className="block font-bold text-lg text-slate-700 dark:text-slate-300">{unansweredCount}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Blank</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Resume Test
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
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

  // =========================================================================
  // VIEW 3: GENERATOR CONFIGURATION DASHBOARD (Default Landing)
  // =========================================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <Sparkles size={13} className="text-[#2563EB]" />
            <span>Official 2027 Question Bank Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Generative DDCET Quiz Arena
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate custom 100-Question full mock papers or 50-Question targeted sprints following all official DDCET rules.
          </p>
        </div>

        <Link
          to="/student/mock"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-300 transition-colors shadow-2xs"
        >
          <BookOpen size={14} className="text-[#2563EB]" />
          <span>Mock Test Center</span>
        </Link>
      </div>

      {/* Official DDCET Exam Rules Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Official Timed Format</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              120 Mins for 100 Qs | 60 Mins for 50 Qs with strict real-time countdown.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
            <Target size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">+2.0 Marks for Correct</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Every correct answer adds 2 marks toward your final state merit score.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">-0.5 Negative Marking</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              1/4th mark deduction per wrong answer. Unattempted questions carry 0 penalty.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Configuration Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5 sm:p-7 shadow-xs space-y-6">
        
        {/* Step 1: Select Question Count (100 Qs vs 50 Qs) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Choose Exam Volume</span>
            </label>
            <span className="text-xs text-slate-400 font-medium">Official DDCET Scale</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 100 Questions Card */}
            <div
              onClick={() => {
                setQuestionCount(100);
                setSectionScope('both');
              }}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                questionCount === 100
                  ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    100 Questions Full Mock Paper
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E3A8A] text-white">
                    Complete Exam
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Full statewide simulation. 50 Qs from Basics of Science & Engineering + 50 Qs from Aptitude & Soft Skills.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                <span>⏱ 120 Minutes</span>
                <span>🎯 200 Max Marks</span>
              </div>
            </div>

            {/* 50 Questions Card */}
            <div
              onClick={() => setQuestionCount(50)}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                questionCount === 50
                  ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    50 Questions Half / Sectional Sprint
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                    Targeted Sprint
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Fast 60-minute sectional sprint. Perfect for targeted revision or high-intensity focus on specific sections.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                <span>⏱ 60 Minutes</span>
                <span>🎯 100 Max Marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Section Scope (Active when 50 Questions selected) */}
        {questionCount === 50 && (
          <div className="space-y-3 pt-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">2</span>
              <span>Select Section Coverage</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setSectionScope('sec1')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  sectionScope === 'sec1'
                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold mb-0.5">Section 1 Only</span>
                <span className="text-[11px] text-slate-500 font-normal">Basics of Science & Engineering (50 Qs)</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionScope('sec2')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  sectionScope === 'sec2'
                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold mb-0.5">Section 2 Only</span>
                <span className="text-[11px] text-slate-500 font-normal">Aptitude, Math & Soft Skills (50 Qs)</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionScope('mixed50')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  sectionScope === 'mixed50'
                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold mb-0.5">Mixed 50 Sprint</span>
                <span className="text-[11px] text-slate-500 font-normal">25 from Sec 1 + 25 from Sec 2</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionScope('physics_bank')}
                className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                  sectionScope === 'physics_bank'
                    ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold mb-0.5">Physics Bank (780 Qs)</span>
                <span className="text-[11px] text-slate-500 font-normal">Random 50 from all 26 syllabus topics</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Exam Mode & Order Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Quiz Delivery Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuizMode('exam')}
                className={`p-3 rounded-lg border text-xs text-left transition-colors ${
                  quizMode === 'exam'
                    ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="block font-semibold">Timed Exam Mode</span>
                <span className="text-[11px] text-slate-400 font-normal">Timer & post-test report</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizMode('practice')}
                className={`p-3 rounded-lg border text-xs text-left transition-colors ${
                  quizMode === 'practice'
                    ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="block font-semibold">Self-Paced Practice</span>
                <span className="text-[11px] text-slate-400 font-normal">No timer pressure</span>
              </button>
            </div>
          </div>

          {/* Shuffling */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Question Sequencing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShuffleQuestions(true)}
                className={`p-3 rounded-lg border text-xs text-left transition-colors ${
                  shuffleQuestions
                    ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="block font-semibold">Randomized Order</span>
                <span className="text-[11px] text-slate-400 font-normal">Shuffled question order</span>
              </button>

              <button
                type="button"
                onClick={() => setShuffleQuestions(false)}
                className={`p-3 rounded-lg border text-xs text-left transition-colors ${
                  !shuffleQuestions
                    ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold'
                    : 'border-[#E2E8F0] dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="block font-semibold">Official Sequence</span>
                <span className="text-[11px] text-slate-400 font-normal">Original paper order (1-100)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-3">
          <button
            onClick={handleGenerateQuiz}
            className="w-full py-3.5 px-6 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <PlayCircle size={18} />
            <span>
              Generate & Launch {questionCount}-Question DDCET Quiz ({questionCount === 100 ? '120 Mins' : '60 Mins'})
            </span>
          </button>
        </div>

      </div>

    </div>
  );
}
