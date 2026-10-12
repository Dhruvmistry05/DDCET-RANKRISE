import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { Search, Menu, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-ink dark:text-slate-100 font-sans">
      <Sidebar />
      
      <main className="flex-1 ml-72 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 w-full max-w-lg focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search subjects, topics, questions..." 
                className="bg-transparent border-none outline-none w-full text-sm placeholder:text-slate-400 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-medium text-sm transition-colors">
              <LogOut size={18} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      <ThemeToggle />
    </div>
  );
}
