import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight, ShieldCheck, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';
import PasswordInput from '../../components/PasswordInput';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, token, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && token) {
      if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin');
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

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

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
          if (data.user.role === 'admin' || data.user.role === 'superadmin') navigate('/admin');
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
            if (loginData.user.role === 'admin' || loginData.user.role === 'superadmin') navigate('/admin');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Main Responsive Auth Card */}
      <div className="flex w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-[#E2E8F0] dark:border-slate-800 overflow-hidden font-sans">
        
        {/* Left Brand Column (Desktop) */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#1E3A8A] p-10 text-white border-r border-blue-900">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold text-white text-base tracking-tight border border-white/20">
                RR
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">DDCET 2027</span>
                <span className="block text-lg font-bold text-white leading-none">RankRise</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-blue-100 text-xs font-semibold border border-white/15">
                Diploma to Degree Portal
              </span>
              <h1 className="text-2xl font-bold text-white leading-snug">
                Structured preparation for DDCET aspirants.
              </h1>
              <p className="text-blue-100/90 text-xs leading-relaxed font-medium">
                Access official past papers, chapter notes, structured question banks, and live mock tests tailored for Gujarat diploma students.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-800/80 text-[11px] text-blue-200 flex items-center justify-between">
            <span>© 2027 DDCET RankRise</span>
            <span className="flex items-center gap-1 text-blue-200"><ShieldCheck size={13} /> Secured Portal</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 pb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                RR
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">DDCET</span>
                <span className="block font-bold text-slate-900 dark:text-white text-base leading-none">RankRise</span>
              </div>
            </div>

            {/* Back Link */}
            <div>
              <Link 
                to="/create-profile"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
              >
                <ArrowLeft size={14} />
                <span>New Student? Create Profile</span>
              </Link>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isLogin ? 'Sign In to Portal' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isLogin 
                  ? 'Enter your registered credentials to access your dashboard.'
                  : 'Register your email to start preparing for DDCET.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                {error}
              </div>
            )}

            {/* Role Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap size={15} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck size={15} />
                <span>Admin</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <PasswordInput 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter password" : "Create a password"}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Confirm Password
                  </label>
                  <PasswordInput 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-sm transition shadow-xs active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Mode Toggle */}
              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  {isLogin 
                    ? "Need a new account? Register here" 
                    : "Already registered? Sign in with password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
