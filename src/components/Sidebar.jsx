import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, PenTool, ClipboardCheck, History, PieChart, 
  AlertTriangle, Book, MessageCircle, LogOut, Globe, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || localStorage.getItem('userRole');

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a152e] text-slate-300">
      {/* Brand Logo & Close Button */}
      <div className="flex items-center justify-between p-6 sm:p-7 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/25">
            RR
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs tracking-widest text-blue-400 font-extrabold uppercase">DDCET</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="block text-white font-black tracking-wide text-xl leading-tight">RANKRISE</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={22} />
          </button>
        )}
      </div>

      {/* Navigation Links List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overscroll-contain">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
          {role === 'admin' ? 'Administration' : 'Student Learning Hub'}
        </div>

        {studentLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
              }`}
            >
              <link.icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-300'}`} />
              <span className="text-sm tracking-normal">{link.name}</span>
            </Link>
          );
        })}

        {role === 'admin' && (
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 px-3">
              Admin Controls
            </div>
            {adminLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-emerald-600/15 text-emerald-400 font-bold border border-emerald-500/20 shadow-sm' 
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-300'
                  }`}
                >
                  <link.icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'}`} />
                  <span className="text-sm tracking-normal">{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070e20]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-sm">
            {user?.name ? user.name[0] : (role === 'admin' ? 'A' : 'S')}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm text-white font-bold truncate leading-tight">
              {user?.name || (role === 'admin' ? 'Administrator' : 'Student')}
            </span>
            <span className="block text-slate-400 text-xs truncate">
              {user?.email || 'Active Account'}
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            title="Log Out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 z-30 border-r border-slate-800 shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 transition-transform duration-300 ease-in-out transform">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
