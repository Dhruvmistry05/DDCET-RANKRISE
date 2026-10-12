import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, BarChart, Library, FileQuestion, GraduationCap } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [token]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Registered Students" value={stats?.students} icon={Users} color="bg-blue-600" to="#" />
        <DashboardCard title="Live Tests" value={stats?.tests} icon={FileText} color="bg-purple-600" to="/admin/tests" />
        <DashboardCard title="Question Bank" value={stats?.questions} icon={FileQuestion} color="bg-orange-500" to="/admin/questions" />
        <DashboardCard title="Syllabus Subjects" value={stats?.subjects} icon={Library} color="bg-green-600" to="/admin/syllabus" />
        <DashboardCard title="Chapters" value={stats?.chapters} icon={BookOpen} color="bg-emerald-600" to="/admin/syllabus" />
        <DashboardCard title="Study Materials" value={stats?.materials} icon={GraduationCap} color="bg-indigo-600" to="/admin/materials" />
        <DashboardCard title="Results & Analytics" value="View" icon={BarChart} color="bg-rose-600" to="/admin/analytics" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color, to }) {
  return (
    <Link to={to} className={`relative overflow-hidden block p-6 rounded-2xl shadow-sm text-white hover:-translate-y-1 transition-transform ${color}`}>
      <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
        <Icon size={120} />
      </div>
      <div className="relative z-10 flex flex-col space-y-2">
        <Icon size={32} className="mb-2 opacity-80" />
        <h2 className="text-lg font-medium opacity-90">{title}</h2>
        <span className="text-4xl font-black">{value !== undefined ? value : '...'}</span>
      </div>
    </Link>
  );
}
