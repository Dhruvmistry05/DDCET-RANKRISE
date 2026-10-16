import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mockQuestions, syllabusData } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  PenTool, CheckCircle, XCircle, HelpCircle, ArrowLeft, 
  ArrowRight, RotateCcw, Lightbulb, BookOpen, Clock, Target, 
  Sparkles, Layers, ChevronRight
} from 'lucide-react';

export default function PracticeLab() {
  const [searchParams] = useSearchParams();
  const chapterParam = searchParams.get('chapter');
  const [questions, setQuestions] = useState(mockQuestions);
  const [selectedTopic, setSelectedTopic] = useState(chapterParam || 'all');
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (chapterParam) {
      setSelectedTopic(chapterParam);
      setCurrentIdx(0);
    }
  }, [chapterParam]);
  const [userAnswers, setUserAnswers] = useState({}); // qId -> selectedOptIndex
  const [showExplanation, setShowExplanation] = useState({}); // qId -> boolean
  const [startTime] = useState(Date.now());
  const { token } = useAuth();

  // Filter questions based on selected chapter/topic
  const filteredQuestions = selectedTopic === 'all' 
    ? questions 
    : questions.filter(q => {
        if (!selectedTopic) return true;
        const normSelected = selectedTopic.toLowerCase().replace(/&/g, 'and').trim();
        const normChapter = (q.chapter || '').toLowerCase().replace(/&/g, 'and').trim();
        const normSubject = (q.subject || '').toLowerCase().replace(/&/g, 'and').trim();
        return normChapter === normSelected || 
               normSubject === normSelected ||
               (normChapter && normSelected.includes(normChapter)) ||
               (normChapter && normChapter.includes(normSelected));
      });

  // Active question
  const currentQ = filteredQuestions[currentIdx] || filteredQuestions[0];

  // Stats calculation
  const answeredCount = Object.keys(userAnswers).length;
  let correctCount = 0;
  filteredQuestions.forEach(q => {
    if (userAnswers[q.id] === q.correctOptionIndex) correctCount++;
  });
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Handle option selection
  const handleSelectOption = async (optIdx) => {
    if (!currentQ) return;
    const isFirstTimeAnswered = userAnswers[currentQ.id] === undefined;
    
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
    setShowExplanation(prev => ({ ...prev, [currentQ.id]: true }));

    // Record practice activity to backend if authenticated
    if (isFirstTimeAnswered && token) {
      try {
        const elapsedSec = Math.max(15, Math.floor((Date.now() - startTime) / 1000));
        await fetch(`${API_BASE_URL}/api/student/topic-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic_id: 1, // General practice link
            completed: false,
            time_spent_seconds: 30, // 30s per practiced MCQ
            questions_attempted: 1
          })
        });
      } catch (err) {
        console.error('Error logging practice activity:', err);
      }
    }
  };

  const handleNext = () => {
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setShowExplanation({});
    setCurrentIdx(0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <PenTool size={13} className="text-[#2563EB]" />
            <span>Interactive MCQ Practice Lab</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Chapter Practice MCQs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Solve certified DDCET curriculum questions with instant feedback and memory cheat codes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Reset answers in this session"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
          <Link 
            to="/student/syllabus"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <BookOpen size={14} />
            <span>Syllabus</span>
          </Link>
        </div>
      </div>

      {/* Progress & Live Session Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
            <Target size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Solved</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {answeredCount} / {filteredQuestions.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Correct</span>
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {correctCount}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Accuracy</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {accuracy}%
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Remaining</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {filteredQuestions.length - answeredCount}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => { setSelectedTopic('all'); setCurrentIdx(0); }}
          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors border ${
            selectedTopic === 'all' 
              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All Topics ({questions.length})
        </button>
        {syllabusData.map(topic => (
          <button
            key={topic.name}
            onClick={() => { setSelectedTopic(topic.name); setCurrentIdx(0); }}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors border ${
              selectedTopic === topic.name 
                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {topic.name} ({topic.questions.length})
          </button>
        ))}
      </div>

      {/* Interactive Question Card */}
      {currentQ ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5 sm:p-7 shadow-xs space-y-6">
          
          {/* Question Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1E3A8A] text-white text-xs font-bold shadow-2xs">
                Q {currentIdx + 1} of {filteredQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentQ.chapter}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
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

          {/* Explanation & Cheat Code Card (Revealed upon selecting answer) */}
          {showExplanation[currentQ.id] && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 sm:p-5 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-[#1E3A8A] dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Curriculum Solution & Explanation</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
              {currentQ.cheat && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900 text-xs text-[#1E3A8A] dark:text-blue-300 font-semibold flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span>Memory Cheat: {currentQ.cheat}</span>
                </div>
              )}
            </div>
          )}

          {/* Question Stepper Navigation Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
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

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentIdx + 1} / {filteredQuestions.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIdx === filteredQuestions.length - 1}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentIdx === filteredQuestions.length - 1 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                  : 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white shadow-xs'
              }`}
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-[#E2E8F0] dark:border-slate-700 text-slate-500">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-2" />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-white">No MCQs in this topic</h3>
          <p className="text-xs text-slate-400 mt-1">Select &ldquo;All Topics&rdquo; to browse all practice questions.</p>
        </div>
      )}
    </div>
  );
}
