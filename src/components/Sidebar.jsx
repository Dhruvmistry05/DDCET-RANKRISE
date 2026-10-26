import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, PenTool, ClipboardCheck, History, PieChart, 
  AlertTriangle, Book, MessageCircle, LogOut, X, Sparkles, ShieldCheck, User, Lock, Trophy
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  // Strictly compute roles based on active authenticated session
  const isAuthenticated = Boolean(user && token);
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');
  const isSuperAdmin = isAuthenticated && (user?.role === 'superadmin' || (user?.email && user.email.toLowerCase() === 'dhruvmistry0511@gmail.com'));

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const guestLinks = [
    { name: 'Overview / Home', path: '/', icon: Home },
    { name: 'Study Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Practice Lab', path: '/student/practice', icon: PenTool, requiresAuth: true },
    { name: 'Mock Tests', path: '/student/mock', icon: ClipboardCheck, requiresAuth: true },
    { name: 'Analytics', path: '/student/analytics', icon: PieChart, requiresAuth: true },
    { name: 'Mistake Book', path: '/student/mistakes', icon: AlertTriangle, requiresAuth: true },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy, requiresAuth: true },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Study Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Practice', path: '/student/practice', icon: PenTool },
    { name: 'Mock Test', path: '/student/mock', icon: ClipboardCheck },
    { name: 'Generative Quiz', path: '/student/quiz', icon: Sparkles },
    { name: 'Analytics', path: '/student/analytics', icon: PieChart },
    { name: 'Mistake Book', path: '/student/mistakes', icon: AlertTriangle },
    { name: 'AI Mentor', path: '/student/mentor', icon: MessageCircle },
    { name: 'My Profile', path: '/student/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    ...(isSuperAdmin ? [{ name: 'Admins', path: '/admin/admins', icon: ShieldCheck }] : []),
    { name: 'Syllabus', path: '/admin/syllabus', icon: BookOpen },
    { name: 'Materials', path: '/admin/materials', icon: Book },
    { name: 'PDF Resources', path: '/admin/resources', icon: History },
    { name: 'Question Bank', path: '/admin/questions', icon: ClipboardCheck },
    { name: 'Live Tests', path: '/admin/tests', icon: PenTool },
    { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
  ];

  const links = isAdmin ? adminLinks : (isAuthenticated ? studentLinks : guestLinks);

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
              {isAdmin ? 'Admin Console' : 'Academic Portal'}
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
          {isAdmin ? 'Administration' : 'Learning Resources'}
        </div>

        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={handleNavClick}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-[#1E3A8A] text-white font-semibold shadow-xs' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <link.icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{link.name}</span>
              </div>
              {link.requiresAuth && !isAuthenticated && (
                <Lock size={12} className="text-slate-400 shrink-0 ml-1.5 opacity-70" title="Sign in required" />
              )}
            </Link>
          );
        })}

        {isAdmin && (
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
        {isAuthenticated ? (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <Link
              to={isAdmin ? '/admin' : '/student/profile'}
              onClick={handleNavClick}
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition group cursor-pointer"
              title="View My Profile"
            >
              <div className="w-8 h-8 rounded-md bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0 group-hover:border-blue-500 transition">
                {isAdmin 
                  ? (isSuperAdmin ? 'SA' : 'A') 
                  : (user?.name ? user.name[0].toUpperCase() : 'S')}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs text-slate-200 font-semibold truncate leading-tight group-hover:text-blue-300 transition">
                  {isAdmin 
                    ? (user?.name || (isSuperAdmin ? 'Super Admin' : 'Administrator')) 
                    : (user?.name || 'Student')}
                </span>
                <span className="block text-slate-400 text-[11px] truncate mt-0.5">
                  {isAdmin ? (user?.email || 'Admin Access') : (user?.email || 'DDCET Aspirant')}
                </span>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors shrink-0 cursor-pointer"
              title="Log Out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="text-[11px] text-slate-300 font-medium leading-snug">
              Sign in to track progress, take tests, and save bookmarks.
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                onClick={handleNavClick}
                className="flex-1 py-1.5 text-center text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition shadow-2xs"
              >
                Log In
              </Link>
              <Link
                to="/login?mode=signup"
                onClick={handleNavClick}
                className="flex-1 py-1.5 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
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
