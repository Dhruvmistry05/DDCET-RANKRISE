import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';
import { 
  Trophy, Medal, ArrowLeft, ArrowRight, Clock, Target, 
  Award, Search, RefreshCw, Zap, ShieldCheck, Flame, Users, Sparkles
} from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [timeframe, setTimeframe] = useState('all-time'); // 'all-time' | 'monthly' | 'weekly'

  const fetchLeaderboard = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        setTotalStudents(data.total_registered_students || 0);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(() => fetchLeaderboard(false), 30000);
    return () => clearInterval(timer);
  }, []);

  // Filtered leaderboard
  const filteredList = useMemo(() => {
    return leaderboard.filter(student => {
      const matchSearch = 
        (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.branch || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchBranch = selectedBranch === 'All' || 
        (student.branch || '').toLowerCase().includes(selectedBranch.toLowerCase());

      return matchSearch && matchBranch;
    });
  }, [leaderboard, searchQuery, selectedBranch]);

  // Current logged in student's stats
  const currentStudent = useMemo(() => {
    if (!user) return null;
    return leaderboard.find(s => 
      String(s.student_id) === String(user.id) ||
      (user.email && s.name && s.name.toLowerCase() === (user.name || '').toLowerCase())
    );
  }, [leaderboard, user]);

  // Top 3 Podium
  const top1 = filteredList.find(s => s.rank === 1) || filteredList[0];
  const top2 = filteredList.find(s => s.rank === 2) || (filteredList.length > 1 ? filteredList[1] : null);
  const top3 = filteredList.find(s => s.rank === 3) || (filteredList.length > 2 ? filteredList[2] : null);

  const branches = ['All', 'Computer', 'Information Technology', 'Chemical', 'Mechanical', 'Civil', 'Electrical'];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Loading verified statewide rankings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
            <Trophy size={13} className="text-amber-600" />
            <span>Statewide Merit Rankings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>DDCET Live Leaderboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
              Live Verified
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real rankings calculated deterministically from verified mock exams and syllabus practice sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-60"
            title="Refresh rankings"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link 
            to="/student" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A8A]/90 transition shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Logged-In User Performance Banner */}
      {currentStudent ? (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-900 text-white shadow-sm border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-sm shrink-0 border-2 border-amber-300">
                #{currentStudent.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Your Current Standing</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">State Rank</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {currentStudent.name}
                </h3>
                <p className="text-xs text-blue-200/90 mt-0.5">
                  {currentStudent.branch} {currentStudent.college ? `• ${currentStudent.college}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-white/10 rounded-xl p-3 border border-white/10 text-center shrink-0">
              <div>
                <span className="text-[10px] text-blue-200 font-semibold block uppercase">Total Points</span>
                <span className="text-base sm:text-lg font-black text-amber-300">{currentStudent.points}</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-200 font-semibold block uppercase">Avg Score</span>
                <span className="text-base sm:text-lg font-bold text-white">{currentStudent.average_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-200 font-semibold block uppercase">Accuracy</span>
                <span className="text-base sm:text-lg font-bold text-emerald-300">{currentStudent.accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-200 font-semibold block uppercase">Tests</span>
                <span className="text-base sm:text-lg font-bold text-white">{currentStudent.tests_completed}</span>
              </div>
            </div>
          </div>
        </div>
      ) : user ? (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
              <Zap size={16} />
            </div>
            <div>
              <strong className="text-slate-900 block font-bold text-sm">Enter the Statewide Leaderboard</strong>
              <span className="text-slate-600">Take a practice session or full mock test to qualify for official state rankings!</span>
            </div>
          </div>
          <Link
            to="/student/practice"
            className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg font-bold hover:bg-[#1E3A8A]/90 transition shrink-0"
          >
            Start Practice
          </Link>
        </div>
      ) : null}

      {/* Top 3 Podium Cards */}
      {top1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end pt-2">
          
          {/* Rank 2 (Silver) */}
          {top2 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs relative order-2 md:order-1 hover:border-slate-300 transition">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black border border-slate-300 flex items-center gap-1 shadow-2xs">
                <span>🥈 Rank #2</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center border border-slate-300 shrink-0">
                  {top2.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate" title={top2.name}>{top2.name}</h4>
                  <span className="text-xs text-slate-500 block truncate">{top2.branch}</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Points</span>
                  <span className="text-sm font-bold text-slate-900">{top2.points}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Score</span>
                  <span className="text-sm font-bold text-blue-600">{top2.average_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Accuracy</span>
                  <span className="text-sm font-bold text-emerald-600">{top2.accuracy}%</span>
                </div>
              </div>
            </div>
          ) : <div className="hidden md:block order-1" />}

          {/* Rank 1 (Gold) */}
          <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-xl border-2 border-amber-300 p-5 sm:p-6 shadow-xs relative order-1 md:order-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-amber-950 text-xs font-black border border-amber-500 flex items-center gap-1 shadow-xs">
              <Trophy size={13} className="text-amber-950" />
              <span>👑 State Topper #1</span>
            </div>
            <div className="mt-2 text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-amber-200 text-amber-950 font-black text-lg flex items-center justify-center mx-auto border-2 border-amber-400 shadow-xs">
                {top1.name.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg truncate pt-1">{top1.name}</h4>
              <p className="text-xs text-amber-900/80 font-semibold">{top1.branch} • {top1.college || 'Gujarat Diploma'}</p>
            </div>
            <div className="mt-4 pt-3.5 border-t border-amber-200/60 grid grid-cols-3 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Points</span>
                <span className="text-base font-black text-amber-600">{top1.points}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Avg Score</span>
                <span className="text-base font-bold text-blue-700">{top1.average_score}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Accuracy</span>
                <span className="text-base font-bold text-emerald-700">{top1.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          {top3 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs relative order-3 hover:border-slate-300 transition">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-200 flex items-center gap-1 shadow-2xs">
                <span>🥉 Rank #3</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-900 font-bold text-sm flex items-center justify-center border border-amber-200 shrink-0">
                  {top3.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate" title={top3.name}>{top3.name}</h4>
                  <span className="text-xs text-slate-500 block truncate">{top3.branch}</span>
                </div>
              </div>
              <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Points</span>
                  <span className="text-sm font-bold text-slate-900">{top3.points}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Score</span>
                  <span className="text-sm font-bold text-blue-600">{top3.average_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Accuracy</span>
                  <span className="text-sm font-bold text-emerald-600">{top3.accuracy}%</span>
                </div>
              </div>
            </div>
          ) : <div className="hidden md:block order-3" />}
        </div>
      )}

      {/* Controls & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, branch or college..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Timeframe Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold shrink-0">
            <button
              onClick={() => setTimeframe('all-time')}
              className={`px-3 py-1.5 rounded-md transition ${timeframe === 'all-time' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-md transition ${timeframe === 'monthly' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-md transition ${timeframe === 'weekly' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Week
            </button>
          </div>
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Branch:</span>
          {branches.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                selectedBranch === b
                  ? 'bg-[#1E3A8A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Ranks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="w-10 text-center">Rank</span>
            <span>Student & Diploma College</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            <span className="hidden sm:inline-block w-14 text-center">Tests</span>
            <span className="hidden sm:inline-block w-16 text-center">Accuracy</span>
            <span className="hidden md:inline-block w-20 text-center">Study Time</span>
            <span className="w-20 text-right">Merit Points</span>
          </div>
        </div>

        {/* Rows */}
        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No students found matching "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((student) => {
              const isCurrentUser = user && (
                String(student.student_id) === String(user.id) ||
                (user.email && student.name.toLowerCase() === (user.name || '').toLowerCase())
              );

              return (
                <div 
                  key={student.student_id} 
                  className={`px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isCurrentUser ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-medium' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      student.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      student.rank === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                      student.rank === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {student.rank}
                    </div>

                    {/* Name & Branch Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {student.name}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] font-bold">
                            YOU
                          </span>
                        )}
                        {student.rank === 1 && <span title="Top Ranker">👑</span>}
                      </div>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {student.branch} {student.college ? `• ${student.college}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 sm:gap-10 shrink-0">
                    <div className="hidden sm:block w-14 text-center">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {student.tests_completed}
                      </span>
                    </div>

                    <div className="hidden sm:block w-16 text-center">
                      <span className="text-xs font-bold text-emerald-700">
                        {student.accuracy}%
                      </span>
                    </div>

                    <div className="hidden md:block w-20 text-center text-xs text-slate-500 font-medium">
                      {student.total_practice_time}
                    </div>

                    <div className="w-20 text-right">
                      <div className="font-black text-slate-900 text-sm sm:text-base leading-none">
                        {student.points}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Marks</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Competitive Rules & Scoring Guide */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>DDCET RankRise Competitive Scoring Policy</span>
        </div>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          Leaderboard positions are calculated based on raw test marks, question accuracy, practice volume, and time efficiency. Negative marking (+2.0 for correct, -0.5 for incorrect) is strictly simulated to prepare students for the official GTU DDCET admission test.
        </p>
      </div>

    </div>
  );
}
