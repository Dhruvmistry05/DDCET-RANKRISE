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
              <div className="w-7 h-7 rounded-md bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                RR
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                RankRise
              </span>
            </div>

            {/* Search Bar (Tablet & Desktop) */}
            <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-3 py-1.5 w-full max-w-sm focus-within:border-[#2563EB] focus-within:bg-white dark:focus-within:bg-slate-850 focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search subjects, topics, or papers..." 
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm placeholder:text-slate-400 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {role === 'admin' ? (
              <span className="text-[11px] font-semibold text-[#1E3A8A] dark:text-blue-300 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                Admin
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700">
                DDCET
              </span>
            )}

            {user?.name && (
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {user.name}
              </span>
            )}

            {user ? (
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md text-xs font-medium transition-colors"
                title="Log Out"
              >
                <LogOut size={15} />
                <span className="hidden xs:inline">Log out</span>
              </button>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#1E3A8A] dark:text-blue-400 hover:underline rounded-md text-xs font-semibold transition-colors"
              >
                <span>Log in</span>
              </Link>
            )}
          </div>
        </header>

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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[50px] min-h-[44px] ${
                isActive 
                  ? 'text-[#1E3A8A] dark:text-blue-400 font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#1E3A8A] dark:text-blue-400' : ''} />
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Button: More Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[50px] min-h-[44px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 ${
            isMobileMenuOpen ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
          }`}
          aria-label="More menu items"
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">
            More
          </span>
        </button>
      </nav>

      {/* Floating Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
