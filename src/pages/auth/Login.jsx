import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight, ShieldCheck, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">Loading...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'An error occurred');
        setLoading(false);
        return;
      }
      
      if (isLogin) {
        login(data.token, data.user);
        if (data.user.role === 'admin') navigate('/admin');
        else if (!data.user.profile_completed) navigate('/complete-profile');
        else navigate('/student');
      } else {
        // Automatically login after registration
        const loginRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.token, loginData.user);
          if (loginData.user.role === 'admin') navigate('/admin');
          else navigate('/complete-profile');
        }
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex w-full max-w-6xl h-auto min-h-[600px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-10 m-4">
        
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-blue-600 to-indigo-900 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <BookOpen className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight">RANKRISE</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Your Journey to DDCET Success Starts Here
            </h1>
            <p className="text-blue-100 text-lg opacity-90 leading-relaxed">
              Experience the most realistic mock tests, track your progress with advanced analytics, and conquer your exams with confidence.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-800 relative">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10 lg:text-left flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  {isLogin ? 'Welcome Back 👋' : 'Create an Account 🚀'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  {isLogin ? 'Sign in to your account to continue' : 'Join thousands of students preparing for DDCET'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-200 dark:border-red-800/50">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/50 outline-none" 
                    />
                  </div>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30 disabled:opacity-70 mt-8">
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={20} />}
              </button>
              
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm">
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
