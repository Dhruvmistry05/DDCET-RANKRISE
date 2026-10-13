import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { Trophy, Medal, ArrowLeft, ArrowRight, Clock, Target, Award } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
          setTotalStudents(data.total_registered_students || 0);
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading live merit standings...</span>
        </div>
      </div>
    );
  }

  const top1 = leaderboard.find(s => s.rank === 1);
  const top2 = leaderboard.find(s => s.rank === 2);
  const top3 = leaderboard.find(s => s.rank === 3);
  const hasPodium = Boolean(top1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Merit Standing
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            DDCET Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time rankings calculated from recorded diploma mock assessments
          </p>
        </div>

        <Link 
          to="/student" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Top Performers Summary Card (Only shown if rankings exist) */}
      {hasPodium && (
        <div className="bg-[#1E3A8A] text-white rounded-xl border border-blue-900 p-5 sm:p-6 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-4 text-center">
            Top Merit Performers
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {/* Rank 2 */}
            {top2 ? (
              <div className="p-3 sm:p-4 rounded-lg border bg-white/10 border-white/15 order-2 sm:order-1">
                <div className="text-xs font-bold text-blue-200 mb-1">Rank 2</div>
                <div className="text-sm sm:text-base font-bold text-white truncate">{top2.name}</div>
                <div className="text-xs text-blue-100/80 mt-0.5">{top2.branch}</div>
                <div className="text-sm sm:text-base font-bold text-amber-300 mt-2">{top2.points} Marks</div>
              </div>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-white/5 order-2 sm:order-1 text-blue-200/60 text-xs">
                <span>Rank 2 Vacant</span>
              </div>
            )}

            {/* Rank 1 */}
            {top1 && (
              <div className="p-3 sm:p-4 rounded-lg border bg-white/15 border-white/30 shadow-xs order-1 sm:order-2">
                <div className="text-xs font-bold text-amber-300 mb-1 flex items-center justify-center gap-1">
                  <Trophy size={14} />
                  <span>Rank 1</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">{top1.name}</div>
                <div className="text-xs text-blue-100/80 mt-0.5">{top1.branch}</div>
                <div className="text-base sm:text-lg font-bold text-amber-300 mt-2">{top1.points} Marks</div>
              </div>
            )}

            {/* Rank 3 */}
            {top3 ? (
              <div className="p-3 sm:p-4 rounded-lg border bg-white/10 border-white/15 order-3">
                <div className="text-xs font-bold text-blue-200 mb-1">Rank 3</div>
                <div className="text-sm sm:text-base font-bold text-white truncate">{top3.name}</div>
                <div className="text-xs text-blue-100/80 mt-0.5">{top3.branch}</div>
                <div className="text-sm sm:text-base font-bold text-amber-300 mt-2">{top3.points} Marks</div>
              </div>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-lg border border-white/10 bg-white/5 order-3 text-blue-200/60 text-xs">
                <span>Rank 3 Vacant</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ranks Table or Empty State */}
      {leaderboard.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-[#E2E8F0] dark:border-slate-700 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900">
            <Trophy size={24} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No Student Rankings Recorded Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Rankings are computed automatically from recorded assessment attempts. Complete a live mock exam to enter the statewide leaderboard!
          </p>
          <Link 
            to="/student"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold mt-4 transition-colors shadow-xs"
          >
            <span>Go to Live Assessments</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 divide-y divide-[#E2E8F0] dark:divide-slate-700 shadow-xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-4">
              <span className="w-8 text-center">Rank</span>
              <span>Student Details</span>
            </div>
            <div className="flex items-center gap-6 sm:gap-8">
              <span className="hidden sm:inline-block">Tests</span>
              <span className="hidden sm:inline-block">Avg Score</span>
              <span className="hidden md:inline-block">Practice Time</span>
              <span className="w-16 text-right">Points</span>
            </div>
          </div>

          {leaderboard.map(student => (
            <div 
              key={student.student_id} 
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  student.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                  student.rank === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                  student.rank === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}>
                  {student.rank}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {student.name}
                  </div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {student.branch} • {student.tests_completed} {student.tests_completed === 1 ? 'test' : 'tests'} done
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                <div className="hidden sm:block text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                  {student.tests_completed}
                </div>
                <div className="hidden sm:block text-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {student.average_score}%
                </div>
                <div className="hidden md:block text-center text-xs text-slate-500 dark:text-slate-400">
                  {student.total_practice_time}
                </div>
                <div className="w-16 text-right">
                  <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-none">
                    {student.points}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">Marks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}