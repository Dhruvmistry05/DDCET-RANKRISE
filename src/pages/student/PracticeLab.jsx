import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mockQuestions } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, 
  Lightbulb, BookOpen, Clock, Target, Layers, Grid, Play, 
  AlertCircle, Check, FileText
} from 'lucide-react';

export default function PracticeLab() {
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get('subject');
  const chapterParam = searchParams.get('chapter');
  const topicParam = searchParams.get('topic');

  // Master Question Bank
  const [questions, setQuestions] = useState(mockQuestions);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Practice Mode: 'topic' | 'chapter' | 'subject'
  const [practiceMode, setPracticeMode] = useState(() => {
    if (topicParam) return 'topic';
    if (chapterParam) return 'chapter';
    if (subjectParam) return 'subject';
    return 'topic';
  });

  // Selected Scope within the mode
  const [selectedSubject, setSelectedSubject] = useState(subjectParam || 'Physics');
  const [selectedChapter, setSelectedChapter] = useState(chapterParam || 'Units and Measurement');
  const [selectedTopic, setSelectedTopic] = useState(topicParam || '');

  // 2. Session Length: '30' | 'all'
  const [sessionLength, setSessionLength] = useState('30');

  // Test Execution State
  const [isTestActive, setIsTestActive] = useState(false);
  const [activeTestQuestions, setActiveTestQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // qId -> selectedOptIndex
  const [showExplanation, setShowExplanation] = useState({}); // qId -> boolean
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'wrong', 'correct', 'unattempted'
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { token } = useAuth();

  // Load questions from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchQuestions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/questions`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            const formatted = data.map((q, idx) => {
              let opts = q.options;
              if (typeof opts === 'string') {
                try { opts = JSON.parse(opts); } catch (e) { opts = []; }
              }
              const ansIdx = q.correctOptionIndex !== undefined 
                ? q.correctOptionIndex 
                : (q.answer_index !== undefined ? q.answer_index : 0);
              return {
                id: q.id || `q-${idx}`,
                text: q.text,
                options: Array.isArray(opts) ? opts : [],
                correctOptionIndex: ansIdx,
                chapter: q.chapter || 'Units and Measurement',
                subject: q.subject || 'Physics',
                topic: q.topic || 'General Topic',
                topic_id: q.topic_id,
                chapter_id: q.chapter_id,
                subject_id: q.subject_id,
                explanation: q.explanation || '',
                marks: q.marks || 2.0,
                negativeMarks: q.negative_marks || q.negativeMarks || 0.5
              };
            });
            setQuestions(formatted);
          }
        }
      } catch (err) {
        console.warn('Could not fetch questions from server, using fallback', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchQuestions();
    return () => { isMounted = false; };
  }, []);

  // Compute available Subjects from question bank
  const availableSubjects = useMemo(() => {
    const list = [
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Mathematics' },
      { name: 'Computer' },
      { name: 'English / Soft Skill' },
      { name: 'Environmental Sciences' }
    ];

    const map = new Map();
    questions.forEach(q => {
      const s = q.subject || 'Physics';
      map.set(s, (map.get(s) || 0) + 1);
    });

    return list.map(item => ({
      name: item.name,
      count: map.get(item.name) || 0
    }));
  }, [questions]);

  // Compute available Chapters for selected subject
  const availableChapters = useMemo(() => {
    const map = new Map();
    const chTopicsMap = new Map();

    questions
      .filter(q => (q.subject || '').toLowerCase().trim() === (selectedSubject || '').toLowerCase().trim())
      .forEach(q => {
        const c = q.chapter || 'General Chapter';
        map.set(c, (map.get(c) || 0) + 1);
        if (!chTopicsMap.has(c)) chTopicsMap.set(c, new Set());
        if (q.topic) chTopicsMap.get(c).add(q.topic);
      });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      topicCount: chTopicsMap.get(name)?.size || 0
    }));
  }, [questions, selectedSubject]);

  // Compute available Topics for selected chapter
  const availableTopics = useMemo(() => {
    const map = new Map();
    const normSelCh = (selectedChapter || '').toLowerCase().replace(/&/g, 'and').trim();

    questions
      .filter(q => {
        const matchSub = (q.subject || '').toLowerCase().trim() === (selectedSubject || '').toLowerCase().trim();
        const normQCh = (q.chapter || '').toLowerCase().replace(/&/g, 'and').trim();
        const matchCh = normQCh === normSelCh || normQCh.includes(normSelCh) || normSelCh.includes(normQCh);
        return matchSub && matchCh;
      })
      .forEach(q => {
        if (q.topic) {
          map.set(q.topic, (map.get(q.topic) || 0) + 1);
        }
      });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [questions, selectedSubject, selectedChapter]);

  // Synchronize selection defaults when subject or chapter changes
  useEffect(() => {
    if (chapterParam) {
      setSelectedChapter(chapterParam);
      setPracticeMode('chapter');
    } else if (availableChapters.length > 0 && !availableChapters.some(c => c.name === selectedChapter)) {
      setSelectedChapter(availableChapters[0].name);
    }
  }, [availableChapters, chapterParam]);

  useEffect(() => {
    if (topicParam) {
      setSelectedTopic(topicParam);
      setPracticeMode('topic');
    } else if (availableTopics.length > 0 && !availableTopics.some(t => t.name === selectedTopic)) {
      setSelectedTopic(availableTopics[0].name);
    }
  }, [availableTopics, topicParam]);

  // Filter questions strictly according to selected mode & scope
  const selectedPool = useMemo(() => {
    const normSub = (selectedSubject || '').toLowerCase().trim();

    if (practiceMode === 'subject') {
      return questions.filter(q => (q.subject || '').toLowerCase().trim() === normSub);
    }

    if (practiceMode === 'chapter') {
      const normSelCh = (selectedChapter || '').toLowerCase().replace(/&/g, 'and').trim();
      return questions.filter(q => {
        const matchSub = (q.subject || '').toLowerCase().trim() === normSub;
        const normQCh = (q.chapter || '').toLowerCase().replace(/&/g, 'and').trim();
        const matchCh = normQCh === normSelCh || normQCh.includes(normSelCh) || normSelCh.includes(normQCh);
        return matchSub && matchCh;
      });
    }

    if (practiceMode === 'topic') {
      const normSelCh = (selectedChapter || '').toLowerCase().replace(/&/g, 'and').trim();
      const normSelTop = (selectedTopic || '').toLowerCase().replace(/&/g, 'and').trim();
      return questions.filter(q => {
        const matchSub = (q.subject || '').toLowerCase().trim() === normSub;
        const normQCh = (q.chapter || '').toLowerCase().replace(/&/g, 'and').trim();
        const matchCh = normQCh === normSelCh || normQCh.includes(normSelCh) || normSelCh.includes(normQCh);
        const normQTop = (q.topic || '').toLowerCase().replace(/&/g, 'and').trim();
        const matchTop = normQTop === normSelTop || normQTop.includes(normSelTop) || normSelTop.includes(normQTop);
        return matchSub && matchCh && matchTop;
      });
    }

    return [];
  }, [questions, practiceMode, selectedSubject, selectedChapter, selectedTopic]);

  const availableCount = selectedPool.length;

  const targetSessionCount = useMemo(() => {
    if (practiceMode === 'topic') {
      return availableCount; // strictly all questions in topic (30 MCQs)
    }
    if (sessionLength === '30') {
      return Math.min(30, availableCount);
    }
    return availableCount;
  }, [practiceMode, sessionLength, availableCount]);

  // Start test
  const handleStartTest = () => {
    if (availableCount === 0) return;

    let testList = [...selectedPool];
    if (practiceMode !== 'topic' && sessionLength === '30' && testList.length > 30) {
      testList = testList.slice(0, 30);
    }

    setActiveTestQuestions(testList);
    setCurrentIdx(0);
    setUserAnswers({});
    setShowExplanation({});
    setIsPaletteOpen(false);
    setIsSubmitted(false);
    setShowExitConfirm(false);
    setIsTestActive(true);
    setTestStartTime(Date.now());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit to setup
  const handleExitTest = (force = false) => {
    const answeredCount = Object.keys(userAnswers).length;
    if (!force && answeredCount > 0 && !isSubmitted) {
      setShowExitConfirm(true);
      return;
    }
    setShowExitConfirm(false);
    setIsTestActive(false);
    setIsSubmitted(false);
    setUserAnswers({});
    setShowExplanation({});
    setCurrentIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retake test
  const handleRetakeTest = () => {
    setUserAnswers({});
    setShowExplanation({});
    setCurrentIdx(0);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentQ = activeTestQuestions[currentIdx] || activeTestQuestions[0];

  const answeredCount = Object.keys(userAnswers).length;
  let correctCount = 0;
  let wrongCount = 0;
  activeTestQuestions.forEach(q => {
    const sel = userAnswers[q.id];
    if (sel !== undefined) {
      if (sel === q.correctOptionIndex) correctCount++;
      else wrongCount++;
    }
  });
  const unattemptedCount = Math.max(0, activeTestQuestions.length - answeredCount);
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const netScore = Math.max(0, (correctCount * 2.0) - (wrongCount * 0.5));
  const maxPossibleMarks = activeTestQuestions.length * 2.0;

  // Handle option selection
  const handleSelectOption = async (optIdx) => {
    if (!currentQ || isSubmitted) return;
    const isFirstTime = userAnswers[currentQ.id] === undefined;

    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
    setShowExplanation(prev => ({ ...prev, [currentQ.id]: true }));

    if (isFirstTime && token) {
      try {
        await fetch(`${API_BASE_URL}/api/student/topic-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic_id: currentQ.topic_id || 1,
            completed: false
          })
        });
      } catch (err) {
        console.error('Error logging practice activity:', err);
      }
    }
  };

  const handleNext = () => {
    if (currentIdx < activeTestQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (token) {
      const elapsedSeconds = testStartTime ? Math.max(15, Math.round((Date.now() - testStartTime) / 1000)) : 180;
      try {
        const submitRes = await fetch(`${API_BASE_URL}/api/student/tests/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            test_id: `practice-${practiceMode}-${selectedSubject}`,
            test_title: `${selectedSubject}: ${practiceMode === 'topic' ? selectedTopic : (practiceMode === 'chapter' ? selectedChapter : 'Subject Practice')}`,
            score: netScore,
            max_score: maxPossibleMarks,
            correct_count: correctCount,
            wrong_count: wrongCount,
            unattempted_count: unattemptedCount,
            questions_attempted: answeredCount,
            accuracy: accuracy,
            time_spent_seconds: elapsedSeconds,
            answers: userAnswers
          })
        });
        if (submitRes.ok && typeof window !== 'undefined') {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('rankrise_last_activity', Date.now().toString());
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('rankrise_analytics_channel');
                bc.postMessage({ type: 'test_submitted' });
                bc.close();
              }
            } catch (e) {}
            window.dispatchEvent(new Event('rankrise_test_submitted'));
          }
        }
      } catch (err) {
        console.error('Error recording practice test attempt:', err);
      }
    }
  };

  // Review filter
  const reviewQuestions = useMemo(() => {
    if (!isSubmitted) return [];
    return activeTestQuestions.filter(q => {
      const sel = userAnswers[q.id];
      if (reviewFilter === 'wrong') return sel !== undefined && sel !== q.correctOptionIndex;
      if (reviewFilter === 'correct') return sel === q.correctOptionIndex;
      if (reviewFilter === 'unattempted') return sel === undefined;
      return true;
    });
  }, [isSubmitted, activeTestQuestions, userAnswers, reviewFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">

      {/* ========================================================================= */}
      {/* VIEW 1: PRACTICE SELECTION (When test is not running)                     */}
      {/* ========================================================================= */}
      {!isTestActive ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Clean Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                DDCET Practice Lab
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Practice questions strictly topic-wise, chapter-wise, or subject-wise with instant feedback.
              </p>
            </div>

            <Link 
              to="/student/syllabus"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-blue-300 transition-colors shadow-2xs"
            >
              <BookOpen size={14} className="text-[#2563EB]" />
              <span>Syllabus</span>
            </Link>
          </div>

          {/* Practice Mode Options Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Option 1: Topic-wise Practice */}
            <div
              onClick={() => setPracticeMode('topic')}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                practiceMode === 'topic'
                  ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#1E3A8A] dark:text-blue-300 flex items-center justify-center mb-2.5">
                  <Target size={17} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Topic-wise Practice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Select Subject → Chapter → Topic. Practice all questions strictly from that specific topic.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-blue-700 dark:text-blue-300">
                30 MCQs per Topic
              </div>
            </div>

            {/* Option 2: Chapter-wise Practice */}
            <div
              onClick={() => setPracticeMode('chapter')}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                practiceMode === 'chapter'
                  ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2.5">
                  <Layers size={17} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Chapter-wise Practice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Select Subject → Chapter. Practice all MCQs from every topic in that chapter.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                All Chapter MCQs
              </div>
            </div>

            {/* Option 3: Subject-wise Practice */}
            <div
              onClick={() => setPracticeMode('subject')}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                practiceMode === 'subject'
                  ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#2563EB]'
                  : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2.5">
                  <BookOpen size={17} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                  Subject-wise Practice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Select Subject. Practice all MCQs from every chapter and topic in that subject.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-purple-700 dark:text-purple-300">
                All Subject MCQs
              </div>
            </div>

            {/* Option 4: Previous Year MCQs */}
            <Link
              to="/student/pyq"
              className="p-4 sm:p-5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/30 hover:border-amber-500 transition-all flex flex-col justify-between group shadow-2xs cursor-pointer"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2.5">
                  <FileText size={17} />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Previous Year MCQs
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white">NEW</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Practice authentic DDCET 2026 & 2025 ACPC papers question-by-question with official answer keys.
                </p>
              </div>
              <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <span>100 MCQs per Paper</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Clean Selection Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5 sm:p-6 shadow-xs space-y-4">
            
            {/* Subject Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Select Subject
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {availableSubjects.map(sub => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => setSelectedSubject(sub.name)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedSubject === sub.name
                        ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-1 ring-[#2563EB]'
                        : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate block font-semibold">{sub.name}</span>
                    <span className={`text-[10px] ${sub.count > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      {sub.count > 0 ? `${sub.count} MCQs` : '0 Questions'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Selector (Shown for Chapter-wise & Topic-wise) */}
            {(practiceMode === 'chapter' || practiceMode === 'topic') && (
              <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-700/60">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select Chapter
                </label>
                {availableChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {availableChapters.map(ch => (
                      <button
                        key={ch.name}
                        type="button"
                        onClick={() => setSelectedChapter(ch.name)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                          selectedChapter === ch.name
                            ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold ring-1 ring-[#2563EB]'
                            : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-semibold truncate">{ch.name}</span>
                        <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {ch.count} MCQs
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>No questions found for {selectedSubject}. Please select Physics.</span>
                  </div>
                )}
              </div>
            )}

            {/* Topic Selector (Shown strictly for Topic-wise) */}
            {practiceMode === 'topic' && (
              <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-700/60">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select Topic
                </label>
                {availableTopics.length > 0 ? (
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {availableTopics.map(t => (
                      <option key={t.name} value={t.name}>
                        {t.name} (30 MCQs)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>No topics found. Please select a chapter with questions.</span>
                  </div>
                )}
              </div>
            )}

            {/* Selection Overview & Question Count Banner */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                    Selected Scope
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{selectedSubject}</span>
                    {practiceMode !== 'subject' && <span>› {selectedChapter}</span>}
                    {practiceMode === 'topic' && <span>› {selectedTopic}</span>}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-center shrink-0">
                  <span className="text-base sm:text-lg font-bold text-[#1E3A8A] dark:text-blue-300">
                    {availableCount} MCQs Available
                  </span>
                </div>
              </div>

              {/* Volume Chooser for Chapter & Subject Modes */}
              {practiceMode !== 'topic' && (
                <div className="pt-2 border-t border-blue-200/80 dark:border-blue-900/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSessionLength('30')}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-all ${
                        sessionLength === '30'
                          ? 'border-[#2563EB] bg-white dark:bg-slate-800 font-bold ring-1 ring-[#2563EB]'
                          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-850'
                      }`}
                    >
                      <span>30-Question Session</span>
                      {sessionLength === '30' && <Check size={14} className="text-[#2563EB]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionLength('all')}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-all ${
                        sessionLength === 'all'
                          ? 'border-[#2563EB] bg-white dark:bg-slate-800 font-bold ring-1 ring-[#2563EB]'
                          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-850'
                      }`}
                    >
                      <span>Attempt All ({availableCount} MCQs)</span>
                      {sessionLength === 'all' && <Check size={14} className="text-[#2563EB]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action Button */}
            <button
              type="button"
              onClick={handleStartTest}
              disabled={availableCount === 0}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
                availableCount > 0
                  ? 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              }`}
            >
              <Play size={16} />
              <span>
                {availableCount > 0
                  ? `Start Practice Test (${targetSessionCount} Questions)`
                  : 'No Questions Available for this Selection'}
              </span>
            </button>

          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* VIEW 2: ACTIVE TEST & SUBMITTED SCORECARD                                 */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">

          {/* Test Control Header Bar with Back Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExitTest(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                title="Return to Selection"
              >
                <ArrowLeft size={14} />
                <span>Back to Selection</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  {practiceMode.toUpperCase()} PRACTICE • {activeTestQuestions.length} QUESTIONS
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                  {practiceMode === 'subject' && selectedSubject}
                  {practiceMode === 'chapter' && selectedChapter}
                  {practiceMode === 'topic' && selectedTopic}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!isSubmitted && (
                <button
                  onClick={handleSubmitTest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Submit Test
                </button>
              )}
              {isSubmitted && (
                <button
                  onClick={handleRetakeTest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Retake Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Exit Confirmation Modal */}
          {showExitConfirm && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>You have answers in progress. Exit to Selection?</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-3 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Stay
                </button>
                <button
                  onClick={() => handleExitTest(true)}
                  className="px-3 py-1 rounded bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  Exit
                </button>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                <Target size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Solved</span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {answeredCount} / {activeTestQuestions.length}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                <CheckCircle size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Correct</span>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                  {correctCount}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                <Clock size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Accuracy</span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {accuracy}%
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900">
                <Clock size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Remaining</span>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {unattemptedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Scorecard or Question Card */}
          {isSubmitted ? (
            <div className="space-y-6">
              {/* Scorecard Hero Banner */}
              <div className="bg-[#1E3A8A] text-white rounded-xl p-6 sm:p-8 border border-blue-900 shadow-xs">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Score Achieved
                    </span>
                    <div className="text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-baseline justify-center md:justify-start gap-2">
                      <span>{netScore.toFixed(1)}</span>
                      <span className="text-lg sm:text-xl font-normal text-blue-200">/ {maxPossibleMarks.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-blue-100/80 mt-1">
                      {practiceMode.toUpperCase()} PRACTICE • {activeTestQuestions.length} Questions
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t md:border-t-0 md:border-l border-blue-800/80 pt-4 md:pt-0 md:pl-6 text-center">
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold text-white block">{accuracy}%</span>
                      <span className="text-[11px] text-blue-200 font-semibold uppercase">Accuracy</span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold text-emerald-300 block">{correctCount}</span>
                      <span className="text-[11px] text-blue-200 font-semibold uppercase">Correct (+2.0)</span>
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-bold text-rose-300 block">{wrongCount}</span>
                      <span className="text-[11px] text-blue-200 font-semibold uppercase">Wrong (-0.5)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6 pt-5 border-t border-blue-800/60">
                  <button
                    onClick={handleRetakeTest}
                    className="px-4 py-2 bg-white text-[#1E3A8A] font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>Retake Test</span>
                  </button>
                  <button
                    onClick={() => handleExitTest(true)}
                    className="px-4 py-2 bg-blue-700/80 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors border border-blue-600 flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Selection</span>
                  </button>
                </div>
              </div>

              {/* Review Filter Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Questions & Explanations ({reviewQuestions.length})
                  </h3>

                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'all', label: `All (${activeTestQuestions.length})` },
                      { id: 'wrong', label: `Incorrect (${wrongCount})` },
                      { id: 'correct', label: `Correct (${correctCount})` },
                      { id: 'unattempted', label: `Unattempted (${unattemptedCount})` }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setReviewFilter(f.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          reviewFilter === f.id
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Question Cards */}
                <div className="space-y-3">
                  {reviewQuestions.map((q, idx) => {
                    const userAns = userAnswers[q.id];
                    const isCorrect = userAns === q.correctOptionIndex;
                    const isWrong = userAns !== undefined && !isCorrect;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-xl border bg-white dark:bg-slate-800 shadow-2xs space-y-3 ${
                          isCorrect ? 'border-emerald-200 dark:border-emerald-800/80' :
                          isWrong ? 'border-rose-200 dark:border-rose-800/80' :
                          'border-[#E2E8F0] dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-400">
                              Q {idx + 1} • {q.chapter} {q.topic ? `• ${q.topic}` : ''}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                              {q.text}
                            </h4>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded text-xs font-bold ${
                            isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            isWrong ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {isCorrect ? '+2.0' : isWrong ? '-0.5' : '0.0'}
                          </span>
                        </div>

                        {/* Options list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isAns = q.correctOptionIndex === oIdx;
                            const isSelected = userAns === oIdx;

                            let style = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300';
                            if (isAns) {
                              style = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold';
                            } else if (isSelected && !isAns) {
                              style = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 font-semibold';
                            }

                            return (
                              <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${style}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-[10px]">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isAns && <Check size={14} className="text-emerald-600 shrink-0" />}
                                {isSelected && !isAns && <XCircle size={14} className="text-rose-600 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <span className="font-bold text-[#1E3A8A] dark:text-blue-300 block mb-1">
                              Explanation:
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            currentQ && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5 sm:p-7 shadow-xs space-y-6">
                
                {/* Question Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#1E3A8A] text-white text-xs font-bold shadow-2xs shrink-0">
                      Q {currentIdx + 1} of {activeTestQuestions.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      {currentQ.chapter}
                    </span>
                    {currentQ.topic && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate max-w-xs sm:max-w-md">
                          {currentQ.topic}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400">+{currentQ.marks || 2.0} Marks</span>
                    <span>•</span>
                    <span className="text-rose-500">-{currentQ.negativeMarks || 0.5} Negative</span>
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.text}
                </h2>

                {/* Option Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentQ.id] === oIdx;
                    const hasAnswered = userAnswers[currentQ.id] !== undefined;
                    const isCorrectOpt = oIdx === currentQ.correctOptionIndex;

                    let cardStyle = 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-700 text-slate-800 dark:text-slate-200';
                    let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    if (hasAnswered) {
                      if (isCorrectOpt) {
                        cardStyle = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 font-semibold';
                        badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                      } else if (isSelected) {
                        cardStyle = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-semibold';
                        badgeStyle = 'bg-rose-600 text-white border-rose-600';
                      } else {
                        cardStyle = 'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500';
                      }
                    }

                    const letters = ['A', 'B', 'C', 'D'];

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(oIdx)}
                        className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${cardStyle}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${badgeStyle}`}>
                            {letters[oIdx]}
                          </span>
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </div>

                        {hasAnswered && isCorrectOpt && (
                          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isCorrectOpt && (
                          <XCircle size={18} className="text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Explanation Card */}
                {showExplanation[currentQ.id] && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 sm:p-5 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-[#1E3A8A] dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb size={16} className="text-amber-500" />
                      <span>Explanation</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}

                {/* Question Stepper Navigation Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] dark:border-slate-700 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentIdx === 0}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        currentIdx === 0 
                          ? 'border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed' 
                          : 'bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowLeft size={14} />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      <Grid size={14} />
                      <span>Jump Palette ({currentIdx + 1}/{activeTestQuestions.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSubmitTest}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                    >
                      Finish & Score
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={currentIdx === activeTestQuestions.length - 1}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        currentIdx === activeTestQuestions.length - 1 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                          : 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white shadow-xs'
                      }`}
                    >
                      <span>Next</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Direct Jump Palette Grid Drawer */}
                {isPaletteOpen && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Question Palette
                      </span>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Correct</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Wrong</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block"></span> Unattempted</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 max-h-48 overflow-y-auto p-1">
                      {activeTestQuestions.map((q, idx) => {
                        const ans = userAnswers[q.id];
                        const isCurr = currentIdx === idx;
                        let color = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600';
                        if (ans !== undefined) {
                          if (ans === q.correctOptionIndex) {
                            color = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                          } else {
                            color = 'bg-rose-600 text-white border-rose-600 font-bold';
                          }
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCurrentIdx(idx);
                              setIsPaletteOpen(false);
                            }}
                            className={`h-8 rounded-lg text-xs flex items-center justify-center border transition-all ${color} ${
                              isCurr ? 'ring-2 ring-blue-500 ring-offset-1 font-bold scale-105' : ''
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}
