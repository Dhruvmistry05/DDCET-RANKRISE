import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import { 
  Search, Menu, LogOut, Home, BookOpen, Book, 
  Trophy, MoreHorizontal, Layers, ClipboardCheck, PenTool, FileText, User, X
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  
  // Strictly compute authenticated roles
  const isAuthenticated = Boolean(user && token);
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');
  const isSuperAdmin = isAuthenticated && (user?.role === 'superadmin' || (user?.email && user.email.toLowerCase() === 'dhruvmistry0511@gmail.com'));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Guest bottom nav items (for public visitors exploring the platform)
  const guestBottomNav = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Log in', path: '/login', icon: User },
  ];

  // Student bottom nav items
  const studentBottomNav = [
    { name: 'Home', path: '/student', icon: Home },
    { name: 'Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Ranks', path: '/student/leaderboard', icon: Trophy },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  // Admin bottom nav items
  const adminBottomNav = [
    { name: 'Overview', path: '/admin', icon: Home },
    { name: 'Tests', path: '/admin/tests', icon: PenTool },
    { name: 'MCQs', path: '/admin/questions', icon: ClipboardCheck },
    { name: 'PDFs', path: '/admin/resources', icon: FileText },
  ];

  const bottomNavItems = isAdmin 
    ? adminBottomNav 
    : (isAuthenticated ? studentBottomNav : guestBottomNav);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar (Desktop Persistent + Mobile Slide Drawer) */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-w-0 pb-20 lg:pb-8">
        
        {/* Top App Bar Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger Button (Mobile Only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/40"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Brand Title (When Sidebar is Hidden) */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center p-1 border border-blue-200 dark:border-blue-900 shadow-xs">
                <img 
                  src="/logo-icon.png" 
                  alt="RankRise Logo" 
                  className="w-full h-full object-contain dark:hidden" 
                />
                <img 
                  src="/logo-icon-white.png" 
                  alt="RankRise Logo" 
                  className="w-full h-full object-contain hidden dark:block" 
                />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                RankRise
              </span>
            </div>

            {/* Search Bar (Tablet & Desktop) */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
              <SearchBar />
            </div>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/40"
              aria-label="Open search bar"
              title="Search subjects, topics, or papers"
            >
              <Search size={18} />
            </button>
            {isAdmin ? (
              <span className="text-[11px] font-semibold text-[#1E3A8A] dark:text-blue-300 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                DDCET
              </span>
            )}

            {isAuthenticated && user?.name && (
              <Link
                to={isAdmin ? '/admin' : '/student/profile'}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="View My Profile"
              >
                <div className="w-5 h-5 rounded-md bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">{user.name}</span>
              </Link>
            )}

            {isAuthenticated ? (
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut size={15} />
                <span className="hidden xs:inline">Log out</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Log in
                </Link>
                <Link 
                  to="/login?mode=signup"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Search Overlay Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden sticky top-14 inset-x-0 z-35 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2.5 shadow-md flex items-center gap-2 animate-in slide-in-from-top-1">
            <div className="flex-1">
              <SearchBar isMobile={true} onCloseMobile={() => setIsMobileSearchOpen(false)} />
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Close mobile search"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav 
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-[#E2E8F0] dark:border-slate-800 px-2 py-1 flex items-center justify-around h-14"
        aria-label="Mobile Bottom Navigation"
      >
        {bottomNavItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive 
                  ? 'text-[#1E3A8A] dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
