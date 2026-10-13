import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTests } from '../../store/mockData';
import { 
  ClipboardCheck, Clock, BookOpen, AlertCircle, ArrowRight, 
  Award, CheckCircle2, ShieldAlert, BarChart3, HelpCircle 
} from 'lucide-react';

export default function MockTestCenter() {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load published mock assessments
    setTests(getTests().filter(t => t.status !== 'draft'));
  }, []);

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
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Standard 120 Mins</h2>
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

      {/* Active Mock Assessments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Available Mock Assessments
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {tests.length} Assessment{tests.length !== 1 ? 's' : ''} Published
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <ClipboardCheck size={36} className="mx-auto text-slate-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Mock Tests Active</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Assessments are scheduled during specific test windows. You can practice individual chapters in the Practice Lab.
            </p>
            <div className="mt-4">
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
            {tests.map(test => {
              const now = new Date();
              const start = new Date(test.scheduledStartTime);
              const end = new Date(test.scheduledEndTime);
              const isLive = now >= start && now <= end;
              const isUpcoming = now < start;
              const totalMarks = (test.questions?.length || 0) * 2;

              return (
                <div 
                  key={test.id} 
                  className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-colors shadow-xs flex flex-col justify-between ${
                    isLive 
                      ? 'border-[#2563EB] dark:border-blue-600' 
                      : 'border-[#E2E8F0] dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {test.title}
                      </h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${
                        isLive 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : isUpcoming 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {isLive ? 'Active Test' : isUpcoming ? 'Scheduled' : 'Concluded'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Comprehensive evaluation covering Basic Engineering and Aptitude sections.
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700/80 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Questions</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{test.questions?.length || 0}</span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-2.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700/80 text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Duration</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{test.durationMinutes}m</span>
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
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors ${
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
