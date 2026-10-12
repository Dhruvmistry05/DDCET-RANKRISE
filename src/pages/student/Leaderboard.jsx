import { Link } from 'react-router-dom';
import { Trophy, Medal, Star, ArrowLeft, Crown } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'Rahul Sharma', score: 98.5, accuracy: 99, branch: 'Computer' },
  { rank: 2, name: 'Priya Patel', score: 95.0, accuracy: 96, branch: 'IT' },
  { rank: 3, name: 'Amit Kumar', score: 92.5, accuracy: 94, branch: 'Mechanical' },
  { rank: 4, name: 'Neha Gupta', score: 89.0, accuracy: 90, branch: 'Civil' },
  { rank: 5, name: 'Vikram Singh', score: 85.5, accuracy: 88, branch: 'Electrical' },
  { rank: 6, name: 'Dhruv Mistry', score: 84.0, accuracy: 87, branch: 'Computer' },
  { rank: 7, name: 'Ananya Desai', score: 81.5, accuracy: 85, branch: 'EC' },
];

export default function Leaderboard() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
            <Trophy size={16} /> Statewide Rankings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            DDCET Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Top performers across mock test assessments
          </p>
        </div>

        <Link 
          to="/student" 
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 transition-colors min-h-[40px]"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Ranking Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        
        {/* Top 3 Podium Visual (Responsive) */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-4 sm:p-8 flex justify-center items-end gap-2 sm:gap-6 text-white pb-8 sm:pb-12 pt-8 relative overflow-hidden">
          <Podium rank={2} name="Priya P." score="95.0" height="h-28 sm:h-36" badgeColor="bg-slate-300 text-slate-900" rankTitle="2nd" />
          <Podium rank={1} name="Rahul S." score="98.5" height="h-36 sm:h-44" badgeColor="bg-amber-400 text-amber-950" rankTitle="1st" isFirst />
          <Podium rank={3} name="Amit K." score="92.5" height="h-24 sm:h-28" badgeColor="bg-amber-600 text-white" rankTitle="3rd" />
        </div>

        {/* Ranks List / Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {mockLeaderboard.map(student => {
            const isTop3 = student.rank <= 3;
            return (
              <div 
                key={student.rank} 
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                    student.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                    student.rank === 2 ? 'bg-slate-300 text-slate-800' :
                    student.rank === 3 ? 'bg-amber-600/80 text-white' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {student.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                        {student.name}
                      </span>
                      {student.rank === 1 && <Crown size={14} className="text-amber-500 shrink-0" />}
                    </div>
                    <span className="block text-[11px] text-slate-400">
                      {student.branch} • {student.accuracy}% accuracy
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-blue-600 dark:text-blue-400 text-sm sm:text-base leading-none">
                    {student.score}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Marks</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Podium({ rank, name, score, height, badgeColor, rankTitle, isFirst }) {
  return (
    <div className="flex flex-col items-center text-center w-24 sm:w-32">
      {isFirst && <Crown size={22} className="text-amber-300 mb-1 animate-bounce" />}
      <span className="text-xs sm:text-sm font-bold truncate max-w-full px-1">{name}</span>
      <span className="text-xs text-blue-200 font-bold mb-2">{score} pts</span>
      
      <div className={`w-full ${height} rounded-t-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center p-2 shadow-inner`}>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm ${badgeColor}`}>
          {rank}
        </div>
        <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase mt-1 opacity-80">{rankTitle}</span>
      </div>
    </div>
  );
}