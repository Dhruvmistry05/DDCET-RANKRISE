import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, PenTool, ClipboardCheck, History, PieChart, AlertTriangle, Book, MessageCircle, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || localStorage.getItem('userRole');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Study Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Past Papers', path: '/student/resources/papers', icon: History },
    { name: 'Answer Keys', path: '/student/resources/keys', icon: ClipboardCheck },
    { name: 'Official Syllabus', path: '/student/resources/official-syllabus', icon: Book },
    { name: 'Study Links', path: '/student/resources/links', icon: Globe },
    { name: 'Practice', path: '/student/practice', icon: PenTool },
    { name: 'Mock Test', path: '/student/mock', icon: ClipboardCheck },
    { name: 'Analytics', path: '/student/analytics', icon: PieChart },
    { name: 'Mistake Book', path: '/student/mistakes', icon: AlertTriangle },
    { name: 'AI Mentor', path: '/student/mentor', icon: MessageCircle },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Syllabus', path: '/admin/syllabus', icon: BookOpen },
    { name: 'Materials', path: '/admin/materials', icon: Book },
    { name: 'PDF Resources', path: '/admin/resources', icon: History },
    { name: 'Question Bank', path: '/admin/questions', icon: ClipboardCheck },
    { name: 'Live Tests', path: '/admin/tests', icon: PenTool },
    { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-72 bg-[#0a152e] text-slate-300 flex flex-col fixed h-full z-20 border-r border-slate-800 shadow-2xl">
      <div className="flex items-center gap-4 p-8 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
          RR
        </div>
        <div>
          <strong className="block text-sm tracking-widest text-slate-400 font-bold uppercase">DDCET</strong>
          <span className="block text-white font-black tracking-wide text-2xl leading-none">RANKRISE</span>
        </div>
      </div>

      <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto pb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-4">Student Portal</div>
        {studentLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]' 
                  : 'hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-800'
              }`}
            >
              <link.icon size={22} className={`transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400'}`} />
              <span className="text-[15px]">{link.name}</span>
            </Link>
          );
        })}

        {role === 'admin' && (
          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 px-4">Admin Controls</div>
            {adminLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-emerald-600/10 text-emerald-400 font-bold border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                      : 'hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-800'
                  }`}
                >
                  <link.icon size={22} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                  <span className="text-[15px]">{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-800/80 bg-[#070e20]">
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 text-white flex items-center justify-center font-black shadow-inner uppercase">
            {user?.name ? user.name[0] : (role === 'admin' ? 'A' : 'S')}
          </div>
          <div className="flex-1 min-w-0">
            <b className="block text-[15px] text-white tracking-wide truncate">{user?.name || (role === 'admin' ? 'System Admin' : 'Student')}</b>
            <small className="text-blue-400 font-medium text-xs truncate">{user?.email || 'Premium Plan'}</small>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
