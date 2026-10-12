import { Link } from 'react-router-dom';
import { Trophy, Medal, Star } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'Rahul Sharma', score: 98.5, accuracy: 99 },
  { rank: 2, name: 'Priya Patel', score: 95.0, accuracy: 96 },
  { rank: 3, name: 'Amit Kumar', score: 92.5, accuracy: 94 },
  { rank: 4, name: 'Neha Gupta', score: 89.0, accuracy: 90 },
  { rank: 5, name: 'Vikram Singh', score: 85.5, accuracy: 88 },
];

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="text-accent" size={32} />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Global Leaderboard</h1>
          </div>
          <Link to="/student" className="text-primary hover:underline font-medium">Back to Home</Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Top 3 Podium Mock */}
          <div className="bg-gradient-to-b from-blue-900 to-primary p-8 flex justify-center items-end gap-6 text-white pb-12">
            <Podium rank={2} name="Priya Patel" score="95.0" height="h-32" color="bg-slate-300 text-slate-800 dark:text-white" />
            <Podium rank={1} name="Rahul Sharma" score="98.5" height="h-40" color="bg-yellow-400 text-yellow-900" />
            <Podium rank={3} name="Amit Kumar" score="92.5" height="h-24" color="bg-orange-300 text-orange-900" />
          </div>

          <table className="w-full text-left border-t border-blue-800">
            <thead className="bg-slate-100 dark:bg-slate-800/50">
              <tr>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Rank</th>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Student Name</th>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Score</th>
                <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map(student => (
                <tr key={student.rank} className="border-b border-slate-100 hover:bg-slate-50 dark:bg-slate-900">
                  <td className="p-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${student.rank <= 3 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 dark:text-slate-300'}`}>
                      {student.rank}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-800 dark:text-white">{student.name}</td>
                  <td className="p-4 text-primary font-bold">{student.score}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{student.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Podium({ rank, name, score, height, color }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-2">
        <div className="font-bold">{name}</div>
        <div className="text-sm opacity-80">{score} pts</div>
      </div>
      <div className={`w-24 ${height} ${color} rounded-t-xl flex justify-center pt-4 shadow-lg border-2 border-white/20`}>
        <span className="text-2xl font-black">{rank}</span>
      </div>
    </div>
  );
}