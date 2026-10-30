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

  const isSuperAdmin = user?.role === 'superadmin' || (user?.email && user.email.toLowerCase() === 'dhruvmistry0511@gmail.com');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Admin Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E3A8A] p-6 sm:p-8 rounded-xl text-white border border-blue-900 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-blue-100 text-xs font-semibold border border-white/15">
            <ShieldCheck size={14} className="text-blue-200" /> {isSuperAdmin ? 'Super Administrator Console' : 'Administrative Portal'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            System Overview & Management
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
            Welcome back, {user?.name || (isSuperAdmin ? 'Super Admin' : 'Administrator')}. {isSuperAdmin ? 'Full administrative access, role elevation, and question banks.' : 'Monitor registered candidates, question banks, and live tests.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isSuperAdmin && (
            <Link
              to="/admin/admins"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition shadow-xs border border-white/20"
            >
              <ShieldCheck size={16} />
              <span>Manage Admins ({stats?.admins || 1}/2)</span>
            </Link>
          )}

          <Link
            to="/admin/tests/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs sm:text-sm transition shadow-xs active:scale-[0.98]"
          >
            <span>Create New Test</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isSuperAdmin && (
          <DashboardCard title="Administrators" value={`${stats?.admins || 1} / 3 Active`} icon={ShieldCheck} to="/admin/admins" />
        )}
        <DashboardCard title="Students" value={stats?.students} icon={Users} to="/admin" />
        <DashboardCard title="Assessments" value={stats?.tests} icon={FileText} to="/admin/tests" />
        <DashboardCard title="Question Bank" value={stats?.questions} icon={FileQuestion} to="/admin/questions" />
        <DashboardCard title="Subjects" value={stats?.subjects} icon={Library} to="/admin/syllabus" />
        <DashboardCard title="Chapters" value={stats?.chapters} icon={BookOpen} to="/admin/syllabus" />
        <DashboardCard title="Materials" value={stats?.materials} icon={GraduationCap} to="/admin/materials" />
        <DashboardCard title="Cloud PDFs" value="Manage" icon={FileText} to="/admin/resources" />
        <DashboardCard title="Analytics" value="View" icon={BarChart} to="/admin/analytics" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, to }) {
  return (
    <Link 
      to={to} 
      className="group block p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 transition shadow-xs flex flex-col justify-between min-h-[110px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value !== undefined ? value : '...'}
        </span>
      </div>
    </Link>
  );
}
