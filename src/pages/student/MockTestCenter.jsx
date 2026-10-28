import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTests } from '../../store/mockData';
import { API_BASE_URL } from '../../config/api';
import { 
  ClipboardCheck, Clock, BookOpen, AlertCircle, ArrowRight, 
  Award, CheckCircle2, ShieldAlert, BarChart3, HelpCircle, Sparkles,
  Layers, RefreshCw, FileText
} from 'lucide-react';

export default function MockTestCenter() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'full' | 'subject' | 'live'
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/api/tests?publishedOnly=true`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            setTests(data);
            setLoading(false);
            return;
          }
        }
        // Fallback to static mock data if backend request fails
        if (isMounted) {
          setTests(getTests().filter(t => t.status !== 'draft'));
        }
      } catch (err) {
        console.error('Error fetching mock tests from server:', err);
        if (isMounted) {
          setTests(getTests().filter(t => t.status !== 'draft'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTests();
    return () => { isMounted = false; };
  }, []);

  // Filter tests by active category
  const filteredTests = tests.filter(test => {
    if (activeCategory === 'full') {
      return test.type === 'mock_paper' || test.type === 'combined';
    }
    if (activeCategory === 'subject') {
      return test.type === 'subject_wise' || test.type === 'chapter_wise' || test.type === 'sectional';
    }
    if (activeCategory === 'live') {
      return test.type === 'scheduled_live';
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <ClipboardCheck size={13} className="text-[#2563EB]" />
            <span>Statewide DDCET Simulation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mock Test Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Simulate real exam conditions, analyze accuracy, and calculate statewide merit rank.
          </p>
        </div>

        <Link
          to="/student/leaderboard"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs transition-colors"
        >
          <Award size={15} className="text-[#2563EB]" />
          <span>View Leaderboard</span>
        </Link>
      </div>

      {/* Exam Blueprint & Marking Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mb-2.5 border border-blue-100 dark:border-blue-900">
            <Clock size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Standard Exam Timing</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Strict timed environment matching official DDCET board exam duration with real-time countdown.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">+2.0 Marks Correct</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Official evaluation scale where every correct choice awards full points toward merit score.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 border border-rose-100 dark:border-rose-900">
            <ShieldAlert size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">-0.5 Negative Marking</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Avoid wild guessing. Incorrect responses deduct 0.5 marks as per the DDCET admission rules.
          </p>
        </div>
      </div>

      {/* Generative Quiz Arena Launcher Banner */}
      <div className="bg-[#1E3A8A] text-white rounded-xl p-5 sm:p-6 border border-blue-900 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/10 text-blue-200 text-xs font-semibold border border-white/15">
            <Sparkles size={12} className="text-blue-300" />
            <span>AI & Pattern-Based Exam Generator</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Generative DDCET Quiz Arena (50 & 100 Questions)
          </h2>
          <p className="text-xs text-blue-100/80 max-w-xl leading-relaxed">
            Generate customized 100-Question full mock papers or 50-Question targeted sprints from the verified DDCET 2027 Question Bank with official +2.0 / -0.5 marking.
          </p>
        </div>

        <Link
          to="/student/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#1E3A8A] font-bold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-xs shrink-0"
        >
          <Sparkles size={15} className="text-[#2563EB]" />
          <span>Launch Quiz Generator</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Active Mock Assessments List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Available Mock Assessments
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {tests.length} Assessment{tests.length !== 1 ? 's' : ''} Published by Academic Team
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-md transition ${activeCategory === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              All ({tests.length})
            </button>
            <button
              onClick={() => setActiveCategory('full')}
              className={`px-3 py-1 rounded-md transition ${activeCategory === 'full' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Full Mocks
            </button>
            <button
              onClick={() => setActiveCategory('subject')}
              className={`px-3 py-1 rounded-md transition ${activeCategory === 'subject' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Subject & Chapter
            </button>
            <button
              onClick={() => setActiveCategory('live')}
              className={`px-3 py-1 rounded-md transition ${activeCategory === 'live' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Scheduled Live
            </button>
            <Link
              to="/student/pyq"
              className="px-3 py-1 rounded-md text-amber-600 dark:text-amber-400 font-bold hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0"
            >
              <span>Previous Year Papers</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">2026/25</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-medium">Loading published assessments...</span>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <ClipboardCheck size={36} className="mx-auto text-slate-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Mock Tests in this category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              New tests created by admins will appear here once published. You can also explore topic-wise tests in Practice Lab.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                View All Assessments
              </button>
              <Link
                to="/student/practice"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs hover:bg-[#1E3A8A]/90 transition-colors"
              >
                Go to Practice Lab
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTests.map(test => {
              const now = new Date();
              const startTime = test.scheduledStartTime || test.scheduled_start_time;
              const endTime = test.scheduledEndTime || test.scheduled_end_time;
              const isScheduledLive = test.type === 'scheduled_live';

              let isLive = true;
              let isUpcoming = false;
              let isConcluded = false;

              if (isScheduledLive && startTime && endTime) {
                const start = new Date(startTime);
                const end = new Date(endTime);
                isLive = now >= start && now <= end;
                isUpcoming = now < start;
                isConcluded = now > end;
              }

              const questionCount = test.question_count || test.questions?.length || 0;
              const duration = test.duration_minutes || test.durationMinutes || 60;
              const totalMarks = test.total_marks || test.totalMarks || (questionCount * 2);

              return (
                <div 
                  key={test.id} 
                  className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-colors shadow-xs flex flex-col justify-between ${
                    isLive 
                      ? 'border-blue-300 dark:border-blue-700 hover:border-blue-500' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {test.title}
                        </h3>
                        {(test.subject_name || test.subject || test.chapter_name || test.chapter) && (
                          <div className="flex flex-wrap gap-1 mt-1 text-[11px] font-medium text-slate-500">
                            {(test.subject_name || test.subject) && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {test.subject_name || test.subject}
                              </span>
                            )}
                            {(test.chapter_name || test.chapter) && (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {test.chapter_name || test.chapter}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <span className={`shrink-0 px-2.5 py-0.5 rounded text-xs font-semibold ${
                        isScheduledLive 
                          ? (isLive 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' 
                              : isUpcoming 
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400')
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                      }`}>
                        {isScheduledLive 
                          ? (isLive ? 'Live Window Open' : isUpcoming ? 'Scheduled' : 'Concluded')
                          : 'Open Assessment'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      {test.type === 'mock_paper' || test.type === 'combined'
                        ? 'Full simulated test matching GTU DDCET 2027 blueprint pattern and negative evaluation.'
                        : test.type === 'subject_wise'
                        ? 'Subject-level targeted evaluation to identify strong and weak chapters.'
                        : 'Practice assessment with real-time score analytics and negative marking.'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700/80 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Questions</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{questionCount}</span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700/80 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Duration</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{duration}m</span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700/80 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Max Marks</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{totalMarks}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/student/test/${test.id}`)}
                    disabled={!isLive}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isLive 
                        ? 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-750 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isLive ? (
                      <>
                        <span>Enter Exam Arena</span>
                        <ArrowRight size={15} />
                      </>
                    ) : isUpcoming ? (
                      'Starts at Scheduled Time'
                    ) : (
                      'Assessment Window Closed'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guidelines Box */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <AlertCircle size={15} className="text-[#2563EB]" />
          <span>Mock Exam Protocol</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
          <li>Ensure stable connectivity before starting the test.</li>
          <li>Each question carries +2.0 marks; incorrect answers incur a 0.5-mark penalty. Unanswered questions carry 0 marks.</li>
          <li>Once submitted, your result is recorded and your merit standing on the state leaderboard is updated in real time.</li>
        </ul>
      </div>

    </div>
  );
}
