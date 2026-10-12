import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, BarChart, Library, FileQuestion, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { token, user } = useAuth();
  const API_URL = API_BASE_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [token]);

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-sans animate-fade-in">
      
      {/* Admin Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-5 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <ShieldCheck size={13} /> Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            System Overview & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Welcome back, {user?.name || 'Administrator'}. Monitor active tests, students, and question banks.
          </p>
        </div>

        <Link
          to="/admin/tests/create"
          className="self-start sm:self-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all active:scale-95 min-h-[44px]"
        >
          <span>Create New Test</span>
        </Link>
      </div>

      {/* Metric Cards Grid (2-columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
        <DashboardCard title="Students" value={stats?.students} icon={Users} color="from-blue-600 to-indigo-700" to="/admin" />
        <DashboardCard title="Assessments" value={stats?.tests} icon={FileText} color="from-purple-600 to-indigo-700" to="/admin/tests" />
        <DashboardCard title="Question Bank" value={stats?.questions} icon={FileQuestion} color="from-amber-600 to-orange-600" to="/admin/questions" />
        <DashboardCard title="Subjects" value={stats?.subjects} icon={Library} color="from-emerald-600 to-teal-700" to="/admin/syllabus" />
        <DashboardCard title="Chapters" value={stats?.chapters} icon={BookOpen} color="from-teal-600 to-cyan-700" to="/admin/syllabus" />
        <DashboardCard title="Materials" value={stats?.materials} icon={GraduationCap} color="from-indigo-600 to-blue-800" to="/admin/materials" />
        <DashboardCard title="Cloud PDFs" value="Manage" icon={FileText} color="from-rose-600 to-pink-700" to="/admin/resources" />
        <DashboardCard title="Analytics" value="View" icon={BarChart} color="from-slate-700 to-slate-900" to="/admin/analytics" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color, to }) {
  return (
    <Link 
      to={to} 
      className={`group relative overflow-hidden block p-4 sm:p-6 rounded-2xl shadow-xs text-white hover:shadow-lg transition-all active:scale-[0.98] bg-gradient-to-br ${color} min-h-[110px] sm:min-h-[130px] flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-white">
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        <span className="text-xl sm:text-3xl font-black tracking-tight">
          {value !== undefined ? value : '...'}
        </span>
      </div>

      <div className="mt-2">
        <h2 className="text-xs sm:text-sm font-bold tracking-tight opacity-90 truncate">
          {title}
        </h2>
      </div>
    </Link>
  );
}
