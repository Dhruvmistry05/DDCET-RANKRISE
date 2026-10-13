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
    <div className="flex flex-col h-full bg-[#0b1329] text-slate-300 border-r border-slate-800">
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs border border-blue-600/30">
            RR
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">DDCET</span>
              <span className="text-[11px] text-slate-400 font-normal">RankRise</span>
            </div>
            <span className="block text-white font-bold tracking-tight text-base leading-tight">
              Academic Portal
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
          {role === 'admin' ? 'Administration' : 'Learning Resources'}
        </div>

        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-[#1E3A8A] text-white font-semibold shadow-xs' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <link.icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{link.name}</span>
            </Link>
          );
        })}

        {role === 'admin' && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
              Student View
            </div>
            {studentLinks.slice(0, 4).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive 
                      ? 'bg-slate-800 text-blue-300 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <link.icon size={16} className="shrink-0 text-slate-500" />
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-3.5 border-t border-slate-800 bg-[#080e1c]">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="w-8 h-8 rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.name ? user.name[0] : (role === 'admin' ? 'A' : 'S')}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs text-slate-200 font-semibold truncate leading-tight">
              {user?.name || (role === 'admin' ? 'Administrator' : 'Student')}
            </span>
            <span className="block text-slate-400 text-[11px] truncate mt-0.5">
              {user?.email || 'Active Session'}
            </span>
          </div>
          {user ? (
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors shrink-0"
              title="Log Out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Link 
              to="/login"
              onClick={handleNavClick}
              className="px-2 py-1 text-xs font-semibold text-blue-400 hover:text-white rounded transition-colors shrink-0"
            >
              Log in
            </Link>
          )}
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
