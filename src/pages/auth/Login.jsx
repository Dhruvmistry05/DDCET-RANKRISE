import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight, ShieldCheck, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, token, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && token) {
      if (user.role === 'admin') navigate('/admin');
      else if (!user.profile_completed) navigate('/complete-profile');
      else navigate('/student');
    }
  }, [user, token, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = getApiUrl(`/api/auth/${isLogin ? 'login' : 'register'}`);
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }
      
      if (!res.ok) {
        if (data?.error) {
          setError(data.error);
        } else if (res.status === 400) {
          setError('Invalid input. Please verify your email and password.');
        } else if (res.status === 401) {
          setError('Invalid email or password.');
        } else if (res.status === 403) {
          setError('Access forbidden by server security policy.');
        } else if (res.status === 404) {
          setError('Authentication service is currently unreachable (404). Please try again later.');
        } else if (res.status >= 500) {
          setError('The authentication server encountered a temporary error. Please try again shortly.');
        } else {
          setError(`Request failed with status ${res.status}. Please try again.`);
        }
        setLoading(false);
        return;
      }
      
      if (isLogin) {
        if (data?.token && data?.user) {
          login(data.token, data.user);
          if (data.user.role === 'admin') navigate('/admin');
          else if (!data.user.profile_completed) navigate('/complete-profile');
          else navigate('/student');
        } else {
          setError('Received invalid response from server. Please try again.');
        }
      } else {
        // Automatically login after successful registration
        try {
          const loginRes = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          let loginData = null;
          const loginContentType = loginRes.headers.get('content-type') || '';
          if (loginContentType.includes('application/json')) {
            loginData = await loginRes.json();
          }

          if (loginRes.ok && loginData?.token) {
            login(loginData.token, loginData.user);
            if (loginData.user.role === 'admin') navigate('/admin');
            else navigate('/complete-profile');
          } else {
            setIsLogin(true);
            setError('Account registered successfully! Please sign in with your password.');
          }
        } catch {
          setIsLogin(true);
          setError('Account registered! Please sign in with your credentials.');
        }
      }
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError('Unable to reach the authentication server. Please check your internet connection or verify the server is running.');
      } else {
        setError('An unexpected error occurred during authentication. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-3 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle background glow accents */}
      <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Auth Card */}
      <div className="flex w-full max-w-5xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden z-10">
        
        {/* Left Visual Column (Desktop & Tablet Wide) */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-10 xl:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <BookOpen className="text-white" size={22} />
              </div>
              <div>
                <span className="text-xs tracking-widest text-blue-200 font-extrabold uppercase">DDCET</span>
                <span className="block text-2xl font-black tracking-tight leading-none">RANKRISE</span>
              </div>
            </div>

            <div className="pt-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30 mb-4">
                <Sparkles size={13} className="text-amber-300" /> Diploma to Degree Engineering
              </span>
              <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
                Master DDCET with Realistic Practice & Resources
              </h1>
            </div>

            <p className="text-blue-100/90 text-sm xl:text-base leading-relaxed">
              Complete syllabus coverage, full-length live tests, official past papers, and comprehensive analytics built specifically for diploma engineers.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-blue-200 flex items-center justify-between">
            <span>© 2026 DDCET RankRise</span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure Access</span>
          </div>
        </div>

        {/* Right Form Column (All Screen Sizes) */}
        <div className="w-full lg:w-7/12 p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 pb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                RR
              </div>
              <div>
                <span className="text-[10px] tracking-widest text-blue-600 dark:text-blue-400 font-black uppercase">DDCET</span>
                <span className="block font-black text-slate-900 dark:text-white text-lg leading-none">RANKRISE</span>
              </div>
            </div>

            {/* Back to Profile Creation */}
            <div>
              <Link 
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowLeft size={14} />
                <span>New Student? Go to Profile Creation</span>
              </Link>
            </div>

            {/* Greeting & Header */}
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Sign In to Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your DDCET RankRise dashboard.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl text-xs sm:text-sm font-medium border border-rose-200 dark:border-rose-900/60 animate-shake">
                {error}
              </div>
            )}

            {/* Role Selector (Student vs Admin) */}
            <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 min-h-[40px] ${
                  role === 'student'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap size={16} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 min-h-[40px] ${
                  role === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Admin</span>
              </button>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all min-h-[44px]" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all min-h-[44px]" 
                  />
                </div>
              </div>

              {/* Action Button */}
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm sm:text-base transition-all active:scale-[0.99] shadow-md shadow-blue-600/25 disabled:opacity-60 min-h-[48px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In to Portal' : 'Create Student Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Mode Toggle */}
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[40px] px-2"
                >
                  {isLogin 
                    ? "New to DDCET RankRise? Create an account" 
                    : "Already registered? Sign in here"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
