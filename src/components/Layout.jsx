import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { 
  Search, Menu, LogOut, Home, BookOpen, Book, 
  Trophy, MoreHorizontal, Layers, ClipboardCheck, PenTool, FileText
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || localStorage.getItem('userRole');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Student bottom nav items (Top 4 destinations + More menu toggle)
  const studentBottomNav = [
    { name: 'Home', path: '/student', icon: Home },
    { name: 'Library', path: '/student/resources', icon: BookOpen },
    { name: 'Syllabus', path: '/student/syllabus', icon: Book },
    { name: 'Ranks', path: '/student/leaderboard', icon: Trophy },
  ];

  // Admin bottom nav items
  const adminBottomNav = [
    { name: 'Overview', path: '/admin', icon: Home },
    { name: 'Tests', path: '/admin/tests', icon: PenTool },
    { name: 'MCQs', path: '/admin/questions', icon: ClipboardCheck },
    { name: 'PDFs', path: '/admin/resources', icon: FileText },
  ];

  const bottomNavItems = role === 'admin' ? adminBottomNav : studentBottomNav;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar (Desktop Persistent + Mobile Slide Drawer) */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-w-0 pb-20 lg:pb-0">
        
        {/* Top App Bar Header */}
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-all">
          
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Hamburger Button (Mobile Only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Mobile Brand Title (When Sidebar is Hidden) */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                RR
              </div>
              <span className="font-black text-slate-900 dark:text-white text-base tracking-tight truncate">
                RankRise
              </span>
            </div>

            {/* Search Bar (Tablet & Desktop) */}
            <div className="hidden md:flex items-center gap-2.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-4 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search subjects, topics, or papers..." 
                className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-400 dark:text-white"
              />
            </div>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Switcher between Admin and Student Preview */}
            {location.pathname.startsWith('/admin') ? (
              <button
                onClick={() => navigate('/student')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all border border-blue-200/80 dark:border-blue-800/80 shadow-xs"
                title="Preview Student Experience"
              >
                <span>Preview Student View</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs"
                title="Manage Syllabus, Materials & Tests"
              >
                <span>Admin Panel</span>
              </button>
            )}

            {user?.name && (
              <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200/60 dark:border-slate-700">
                {user.name.split(' ')[0]}
              </span>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-medium text-xs sm:text-sm transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
              <span className="hidden xs:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav 
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl px-2 py-1.5 flex items-center justify-around"
        aria-label="Mobile Bottom Navigation"
      >
        {bottomNavItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] min-h-[44px] ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Button: More Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px] min-h-[44px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 ${
            isMobileMenuOpen ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
          }`}
          aria-label="More menu items"
        >
          <div className="p-1 rounded-lg">
            <MoreHorizontal size={20} />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            More
          </span>
        </button>
      </nav>

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
