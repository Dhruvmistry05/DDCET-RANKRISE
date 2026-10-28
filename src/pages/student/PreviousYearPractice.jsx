import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import pyqFallbackData from '../../data/pyq_papers.json';
import { 
  Clock, BookOpen, CheckCircle, XCircle, ArrowLeft, ArrowRight, 
  RotateCcw, AlertCircle, FileText, Check, Award, AlertTriangle, 
  ChevronRight, BarChart2, ShieldAlert, Sparkles, Filter, Grid, 
  X, HelpCircle, Download, ExternalLink, Calendar, Layers, Eye, RefreshCw
} from 'lucide-react';

export default function PreviousYearPractice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const initialYear = searchParams.get('year') || '2026';
  const initialSection = searchParams.get('section') || 'all'; // 'all', '1', '2'

  // Papers List State
  const [papers, setPapers] = useState(pyqFallbackData);
  const [selectedPaperId, setSelectedPaperId] = useState(() => {
    const matched = pyqFallbackData.find(p => String(p.year) === initialYear);
    return matched ? matched.id : pyqFallbackData[0]?.id || 'ddcet-2026';
  });
  const [selectedSection, setSelectedSection] = useState(initialSection); // 'all' | '1' | '2'
  const [practiceMode, setPracticeMode] = useState('tutor'); // 'tutor' (instant feedback) | 'exam' (timed simulation)
  const [loading, setLoading] = useState(false);

  // Active Practice Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // qId -> optionIndex
  const [questionStatus, setQuestionStatus] = useState({}); // qId -> 'answered' | 'review' | 'unanswered'
  const [revealedExplanations, setRevealedExplanations] = useState({}); // qId -> boolean
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Result & Review State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'wrong', 'correct', 'unattempted'
  const [submissionStats, setSubmissionStats] = useState(null);

  // Timer Ref
  const timerRef = useRef(null);

  // Load paper list from API with local fallback
  useEffect(() => {
    async function fetchPapers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/pyq/papers`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPapers(data);
          }
        }
      } catch {
        // Fallback already preloaded
      }
    }
    fetchPapers();
  }, []);

  // Currently selected paper metadata
  const currentPaperMeta = useMemo(() => {
    return papers.find(p => p.id === selectedPaperId) || papers[0];
  }, [papers, selectedPaperId]);

  // Start Practice Handler
  const handleStartPractice = async () => {
    setLoading(true);
    let paperData = null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/pyq/papers/${selectedPaperId}`);
      if (res.ok) {
        paperData = await res.json();
      }
    } catch {
      // Fallback
    }

    if (!paperData) {
      paperData = pyqFallbackData.find(p => p.id === selectedPaperId) || pyqFallbackData[0];
    }

    if (!paperData || !Array.isArray(paperData.questions)) {
      alert("Unable to load question paper. Please try again.");
      setLoading(false);
      return;
    }

    let qList = [...paperData.questions];
    if (selectedSection === '1') {
      qList = qList.filter(q => q.section === 1);
    } else if (selectedSection === '2') {
      qList = qList.filter(q => q.section === 2);
    }

    setActiveQuestions(qList);
    setCurrentIdx(0);
    setUserAnswers({});
    const initStatus = {};
    qList.forEach(q => { initStatus[q.id] = 'unanswered'; });
    setQuestionStatus(initStatus);
    setRevealedExplanations({});
    setIsSessionActive(true);
    setIsSubmitted(false);
    setSubmissionStats(null);
    setSessionStartTime(Date.now());
    setElapsedSeconds(0);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Timer effect
  useEffect(() => {
    if (isSessionActive && !isSubmitted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, isSubmitted]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Option select handler
  const handleSelectOption = (qId, optIdx) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setQuestionStatus(prev => ({
      ...prev,
      [qId]: prev[qId] === 'review' ? 'review' : 'answered'
    }));
  };

  // Mark for review toggle
  const handleToggleReview = (qId) => {
    setQuestionStatus(prev => ({
      ...prev,
      [qId]: prev[qId] === 'review' ? (userAnswers[qId] !== undefined ? 'answered' : 'unanswered') : 'review'
    }));
  };

  // Clear answer
  const handleClearAnswer = (qId) => {
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setQuestionStatus(prev => ({ ...prev, [qId]: 'unanswered' }));
    setRevealedExplanations(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  // Toggle explanation in tutor mode
  const handleToggleExplanation = (qId) => {
    setRevealedExplanations(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Current Question
  const currentQ = activeQuestions[currentIdx] || activeQuestions[0];

  // Submission calculation
  const handleSubmitPractice = async () => {
    setIsSubmitModalOpen(false);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let rawScore = 0;
    const mistakesToStore = [];

    activeQuestions.forEach(q => {
      const selected = userAnswers[q.id];
      if (selected === undefined) {
        unattempted++;
      } else if (selected === q.correctOptionIndex) {
        correct++;
        rawScore += Number(q.marks || 2.0);
      } else {
        wrong++;
        rawScore -= Number(q.negativeMarks !== undefined ? q.negativeMarks : 0.5);
        mistakesToStore.push({
          qid: q.id,
          topic: `${currentPaperMeta.exam_code}: ${q.subject}`,
          question: q.text,
          selected: q.options[selected] || `Option ${selected + 1}`,
          correct: q.options[q.correctOptionIndex] || `Option ${q.correctOptionIndex + 1}`
        });
      }
    });

    const netScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
    const totalAttempted = correct + wrong;
    const accuracy = totalAttempted > 0 ? parseFloat(((correct / totalAttempted) * 100).toFixed(1)) : 0;
    const maxScore = activeQuestions.reduce((sum, q) => sum + Number(q.marks || 2.0), 0);

    const stats = {
      score: netScore,
      max_score: maxScore,
      correct_count: correct,
      wrong_count: wrong,
      unattempted_count: unattempted,
      questions_attempted: totalAttempted,
      accuracy,
      time_spent_seconds: elapsedSeconds || 120,
      paper_title: currentPaperMeta.title,
      exam_code: currentPaperMeta.exam_code,
      year: currentPaperMeta.year
    };
    setSubmissionStats(stats);

    // Sync mistakes to localStorage for Mistake Book
    if (mistakesToStore.length > 0) {
      import('../../store/mockData').then(({ getProgressStore, saveProgressStore }) => {
        const store = getProgressStore();
        store.mistakes = [...(store.mistakes || []), ...mistakesToStore];
        const unique = [];
        const seen = new Set();
        for (const m of store.mistakes) {
          if (!seen.has(m.qid)) {
            seen.add(m.qid);
            unique.push(m);
          }
        }
        store.mistakes = unique;
        saveProgressStore(store);
      }).catch(() => {});
    }

    // Submit attempt to backend analytics
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/student/tests/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            test_id: `pyq-${currentPaperMeta.id}-${selectedSection}`,
            test_title: `PYQ Practice: ${currentPaperMeta.title} (${selectedSection === 'all' ? 'Full Paper' : 'Section ' + selectedSection})`,
            score: netScore,
            max_score: maxScore,
            correct_count: correct,
            wrong_count: wrong,
            unattempted_count: unattempted,
            questions_attempted: totalAttempted,
            accuracy: accuracy,
            time_spent_seconds: elapsedSeconds || 120,
            answers: userAnswers
          })
        });
      } catch (err) {
        console.error('Failed to submit PYQ to analytics:', err);
      }
    }
  };

  // Palette counts
  const answeredCount = Object.values(questionStatus).filter(s => s === 'answered').length;
  const reviewCount = Object.values(questionStatus).filter(s => s === 'review').length;
  const unattemptedCount = activeQuestions.length - answeredCount - reviewCount;

  // Filtered review questions
  const filteredReviewList = useMemo(() => {
    if (!isSubmitted) return [];
    return activeQuestions.filter(q => {
      const selected = userAnswers[q.id];
      if (reviewFilter === 'wrong') return selected !== undefined && selected !== q.correctOptionIndex;
      if (reviewFilter === 'correct') return selected === q.correctOptionIndex;
      if (reviewFilter === 'unattempted') return selected === undefined;
      return true;
    });
  }, [isSubmitted, activeQuestions, userAnswers, reviewFilter]);

  // Section 1 vs 2 breakdown
  const sectionBreakdown = useMemo(() => {
    if (!isSubmitted) return null;
    const sec1Qs = activeQuestions.filter(q => q.section === 1);
    const sec2Qs = activeQuestions.filter(q => q.section === 2);

    const calcSec = (qs) => {
      let c = 0, w = 0, score = 0;
      qs.forEach(q => {
        const sel = userAnswers[q.id];
        if (sel === q.correctOptionIndex) {
          c++;
          score += 2.0;
        } else if (sel !== undefined) {
          w++;
          score -= 0.5;
        }
      });
      const att = c + w;
      return {
        total: qs.length,
        attempted: att,
        correct: c,
        wrong: w,
        score: Math.max(0, score),
        max: qs.length * 2.0,
        accuracy: att > 0 ? ((c / att) * 100).toFixed(1) : 0
      };
    };

    return {
      sec1: calcSec(sec1Qs),
      sec2: calcSec(sec2Qs)
    };
  }, [isSubmitted, activeQuestions, userAnswers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">

      {/* ========================================================================= */}
      {/* VIEW 1: PAPER SELECTION & CONFIGURATION                                   */}
      {/* ========================================================================= */}
      {!isSessionActive && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  GTU & ACPC Verified
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Official Papers
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Previous Year MCQ Practice
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Practice authentic question papers question-by-question with official answer keys, step-by-step solutions, negative marking (+2.0 / -0.5), and live analytics integration.
              </p>
            </div>

            <Link
              to="/student/resources"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shrink-0"
            >
              <Download size={14} />
              <span>Download PDF Papers</span>
            </Link>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                Official Examination Standards
              </p>
              <p className="leading-relaxed">
                All questions, options, and solutions are matched directly from official ACPC Gujarat examination booklets and final published answer keys. Practicing past papers helps you understand the exact DDCET weightage, difficulty, and question patterns.
              </p>
            </div>
          </div>

          {/* Step 1: Year & Paper Selection Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Step 1: Choose Previous Year Examination Paper
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.map(paper => {
                const isSelected = selectedPaperId === paper.id;
                return (
                  <div
                    key={paper.id}
                    onClick={() => setSelectedPaperId(paper.id)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E3A8A] text-white">
                            {paper.year}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Code: {paper.exam_code} ({paper.booklet_code ? `Series ${paper.booklet_code}` : 'Official'})
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                          {paper.title}
                        </h3>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
                      {paper.subtitle || 'Admission Committee for Professional Courses (ACPC) Gujarat'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{paper.total_questions || 100}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Questions</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{paper.duration_minutes || 150}m</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                        <span className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{paper.total_marks || 200}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Marks</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Practice Scope (Full Paper vs Sections) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Step 2: Select Question Range / Section
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { 
                  id: 'all', 
                  title: 'Complete Paper', 
                  count: '100 MCQs (001 - 100)', 
                  desc: 'Full examination coverage: 50 Science & Engg + 50 Maths & English' 
                },
                { 
                  id: '1', 
                  title: 'Section 1 Only', 
                  count: '50 MCQs (001 - 050)', 
                  desc: 'Basics of Science & Engineering: Physics, Chemistry, Computer & Environment' 
                },
                { 
                  id: '2', 
                  title: 'Section 2 Only', 
                  count: '50 MCQs (051 - 100)', 
                  desc: 'Aptitude & Soft Skills: Engineering Mathematics, English Grammar & Communication' 
                }
              ].map(sec => {
                const isSelected = selectedSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSection(sec.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{sec.title}</span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{sec.count}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      {sec.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Practice Mode */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Step 3: Select Practice Methodology
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPracticeMode('tutor')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  practiceMode === 'tutor'
                    ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Tutor Mode (Recommended)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Solve questions one by one with immediate answer checks, official rationale, and unlimited time. Great for revision and deep learning.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPracticeMode('exam')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  practiceMode === 'exam'
                    ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Exam Simulation Mode</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Simulate official exam conditions without seeing answers until you submit the test. Results and score breakdown appear at the end.
                </p>
              </button>
            </div>
          </div>

          {/* Launch Action Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentPaperMeta.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selected: {selectedSection === 'all' ? 'All 100 Questions' : (selectedSection === '1' ? 'Section 1 (50 Qs)' : 'Section 2 (50 Qs)')} • {practiceMode === 'tutor' ? 'Tutor Mode' : 'Exam Simulation'}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartPractice}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Paper...</span>
                </>
              ) : (
                <>
                  <span>Begin MCQ Practice</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ACTIVE QUESTION-BY-QUESTION ARENA                                 */}
      {/* ========================================================================= */}
      {isSessionActive && !isSubmitted && currentQ && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Top Test Header Control Bar */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1E3A8A] text-white shrink-0">
                {currentPaperMeta.year}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentPaperMeta.exam_code} • {currentQ.section_name}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Question Palette Trigger (Mobile) */}
              <button
                onClick={() => setIsPaletteOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <Grid size={14} />
                <span>Q: {currentIdx + 1}/{activeQuestions.length}</span>
              </button>

              {/* Timer Display */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Clock size={14} className="text-slate-400" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              {/* Finish / Submit Button */}
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
              >
                Submit Practice
              </button>
            </div>
          </div>

          {/* Main Area: Question Statement + Palette Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            
            {/* Left Column: Current Question Card */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
                
                {/* Question Subheader: Number, Subject, Marks */}
                <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Question {currentIdx + 1} of {activeQuestions.length}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {currentQ.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                      +{currentQ.marks || 2} Mark
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                      -{currentQ.negativeMarks !== undefined ? currentQ.negativeMarks : 0.5} Neg
                    </span>
                  </div>
                </div>

                {/* Question Statement & Options */}
                <div className="p-4 sm:p-6 space-y-5">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.text}
                  </h3>

                  {/* 4 Options */}
                  <div className="space-y-2.5 pt-1">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = userAnswers[currentQ.id] === idx;
                      const isRevealed = revealedExplanations[currentQ.id];
                      const isCorrectOpt = idx === currentQ.correctOptionIndex;

                      let optStyles = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750';
                      let badgeStyles = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

                      if (isRevealed) {
                        if (isCorrectOpt) {
                          optStyles = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
                          badgeStyles = 'bg-emerald-600 text-white';
                        } else if (isSelected && !isCorrectOpt) {
                          optStyles = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
                          badgeStyles = 'bg-rose-600 text-white';
                        }
                      } else if (isSelected) {
                        optStyles = 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600';
                        badgeStyles = 'bg-[#1E3A8A] text-white';
                      }

                      return (
                        <label
                          key={idx}
                          onClick={() => handleSelectOption(currentQ.id, idx)}
                          className={`flex items-start sm:items-center p-3 sm:p-3.5 border rounded-lg cursor-pointer transition-colors ${optStyles}`}
                        >
                          <div className={`w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs shrink-0 mr-3 transition-colors ${badgeStyles}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>

                          <span className="text-xs sm:text-sm font-medium leading-normal flex-1">
                            {opt}
                          </span>

                          <input
                            type="radio"
                            name={`pyq-option-${currentQ.id}`}
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleSelectOption(currentQ.id, idx)}
                          />

                          {isRevealed && isCorrectOpt && (
                            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                          )}
                          {isRevealed && isSelected && !isCorrectOpt && (
                            <XCircle size={18} className="text-rose-500 dark:text-rose-400 shrink-0 ml-2" />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Tutor Mode: Check Answer & Explanation Box */}
                  {practiceMode === 'tutor' && (
                    <div className="pt-2">
                      {!revealedExplanations[currentQ.id] ? (
                        <button
                          type="button"
                          onClick={() => handleToggleExplanation(currentQ.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Check Official Answer & Explanation</span>
                        </button>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle size={14} />
                              <span>Official Answer: Option ({String.fromCharCode(65 + currentQ.correctOptionIndex)})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleExplanation(currentQ.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-[11px]"
                            >
                              Hide
                            </button>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {currentQ.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Control Bar */}
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleReview(currentQ.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        questionStatus[currentQ.id] === 'review'
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {questionStatus[currentQ.id] === 'review' ? 'Marked in Review' : 'Mark Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearAnswer(currentQ.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>Previous</span>
                      </button>
                    )}

                    {currentIdx < activeQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx(prev => prev + 1)}
                        className="px-4 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                      >
                        <span>Save & Next</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                      >
                        Submit Test
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Desktop Question Palette */}
            <aside className="hidden lg:block space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Question Palette
                  </h3>
                  <span className="text-xs text-slate-400">
                    {answeredCount}/{activeQuestions.length}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {activeQuestions.map((q, idx) => {
                    const stat = questionStatus[q.id];
                    let bg = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
                    if (stat === 'answered') bg = 'bg-[#1E3A8A] text-white border-[#1E3A8A]';
                    if (stat === 'review') bg = 'bg-amber-500 text-white border-amber-500';

                    const isCurrent = currentIdx === idx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-8 rounded-lg font-bold text-xs border flex items-center justify-center transition cursor-pointer ${bg} ${
                          isCurrent ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-[#1E3A8A]" />
                      <span>Answered</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                      <span>Marked Review</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{reviewCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                      <span>Not Visited</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{unattemptedCount}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile Drawer Palette */}
          {isPaletteOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setIsPaletteOpen(false)}
              />
              <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-800 p-4 shadow-2xl z-10 flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Question Palette
                    </h3>
                    <span className="text-xs text-slate-500">{answeredCount} of {activeQuestions.length} answered</span>
                  </div>
                  <button 
                    onClick={() => setIsPaletteOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2 overflow-y-auto flex-1 content-start">
                  {activeQuestions.map((q, idx) => {
                    const stat = questionStatus[q.id];
                    let bg = 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                    if (stat === 'answered') bg = 'bg-[#1E3A8A] text-white';
                    if (stat === 'review') bg = 'bg-amber-500 text-white';

                    const isCurrent = currentIdx === idx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentIdx(idx);
                          setIsPaletteOpen(false);
                        }}
                        className={`h-9 rounded-lg font-bold text-xs border flex items-center justify-center ${bg} ${
                          isCurrent ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Submit Confirmation Modal */}
          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
                onClick={() => setIsSubmitModalOpen(false)}
              />
              <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 z-10 animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit Practice Session?</h3>
                    <p className="text-xs text-slate-500">Your final score and accuracy will be calculated.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-center">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="block font-bold text-base text-emerald-700 dark:text-emerald-400">{answeredCount}</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Answered</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                    <span className="block font-bold text-base text-amber-700 dark:text-amber-400">{reviewCount}</span>
                    <span className="text-[11px] text-amber-600 font-semibold">Review</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                    <span className="block font-bold text-base text-slate-700 dark:text-slate-300">{unattemptedCount}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Blank</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                  >
                    Resume Practice
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitPractice}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: COMPREHENSIVE PERFORMANCE & REVIEW REPORT                         */}
      {/* ========================================================================= */}
      {isSubmitted && submissionStats && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Return & Action Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsSessionActive(false);
                setIsSubmitted(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={14} />
              <span>Choose Another Paper</span>
            </button>

            <button
              onClick={handleStartPractice}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition shadow-xs"
            >
              <RotateCcw size={14} />
              <span>Retake Paper</span>
            </button>
          </div>

          {/* Hero Score Banner */}
          <div className="bg-[#1E3A8A] text-white rounded-2xl p-6 sm:p-8 border border-blue-900 shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-blue-100">
                  {submissionStats.exam_code} Official Practice
                </span>
                <span className="text-xs text-blue-200">
                  Time: {formatTime(submissionStats.time_spent_seconds)}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Net Score Achieved</span>
                <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white mt-1">
                  {submissionStats.score.toFixed(2)} <span className="text-xl text-blue-200 font-normal">/ {submissionStats.max_score}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-800/80 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{submissionStats.accuracy}%</div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Accuracy</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-300">{submissionStats.correct_count}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Correct (+2)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-rose-300">{submissionStats.wrong_count}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Wrong (-0.5)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-200">{submissionStats.unattempted_count}</div>
                  <div className="text-[10px] text-blue-200 uppercase font-semibold">Blank</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown Grid */}
          {sectionBreakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Section 1: Basics of Science & Engg
                  </h3>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {sectionBreakdown.sec1.score.toFixed(1)} / {sectionBreakdown.sec1.max} Marks
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec1.correct}</span>
                    <span className="text-[10px] text-slate-400">Correct</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec1.wrong}</span>
                    <span className="text-[10px] text-slate-400">Wrong</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec1.accuracy}%</span>
                    <span className="text-[10px] text-slate-400">Accuracy</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Section 2: Maths & Soft Skills
                  </h3>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {sectionBreakdown.sec2.score.toFixed(1)} / {sectionBreakdown.sec2.max} Marks
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec2.correct}</span>
                    <span className="text-[10px] text-slate-400">Correct</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec2.wrong}</span>
                    <span className="text-[10px] text-slate-400">Wrong</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <span className="block font-bold text-slate-800 dark:text-slate-200">{sectionBreakdown.sec2.accuracy}%</span>
                    <span className="text-[10px] text-slate-400">Accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Review Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Detailed Solution Review
                </h3>
                <p className="text-xs text-slate-500">
                  Compare your answers against the official ACPC answer key. Incorrect answers are automatically saved to your Mistake Book.
                </p>
              </div>

              {/* Review Filter Tabs */}
              <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'all', label: `All (${activeQuestions.length})` },
                  { id: 'wrong', label: `Wrong (${submissionStats.wrong_count})` },
                  { id: 'correct', label: `Correct (${submissionStats.correct_count})` },
                  { id: 'unattempted', label: `Blank (${submissionStats.unattempted_count})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReviewFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      reviewFilter === tab.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Review Questions */}
            <div className="space-y-3">
              {filteredReviewList.map(q => {
                const userChoice = userAnswers[q.id];
                const isCorrect = userChoice === q.correctOptionIndex;
                const isBlank = userChoice === undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-xl border bg-white dark:bg-slate-800 shadow-2xs space-y-3 ${
                      isCorrect 
                        ? 'border-emerald-200 dark:border-emerald-900/40' 
                        : isBlank 
                        ? 'border-slate-200 dark:border-slate-700' 
                        : 'border-rose-200 dark:border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Q{q.number}.
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {q.subject}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isBlank
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {isCorrect ? 'Correct (+2.0)' : isBlank ? 'Not Attempted (0.0)' : 'Incorrect (-0.50)'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q.text}
                    </p>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isOfficialKey = oIdx === q.correctOptionIndex;
                        const isStudentPick = oIdx === userChoice;

                        let style = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                        if (isOfficialKey) {
                          style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (isStudentPick && !isCorrect) {
                          style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200 font-semibold';
                        }

                        return (
                          <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${style}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                              <span>{opt}</span>
                            </div>
                            {isOfficialKey && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                Answer Key
                              </span>
                            )}
                            {isStudentPick && !isOfficialKey && (
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                Your Pick
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                          Explanation:
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
