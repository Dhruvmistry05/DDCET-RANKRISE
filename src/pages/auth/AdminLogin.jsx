import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';
import PasswordInput from '../../components/PasswordInput';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, token, loading: authLoading } = useAuth();

  // Redirect if already logged in as admin or superadmin
  useEffect(() => {
    if (user && token && (user.role === 'admin' || user.role === 'superadmin')) {
      navigate('/admin');
    }
  }, [user, token, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = getApiUrl('/api/auth/login');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' })
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
        } else if (res.status === 401) {
          setError('Invalid administrator email or password.');
        } else if (res.status === 403) {
          setError('Access forbidden. Your account lacks administrator privileges.');
        } else {
          setError(`Authentication failed with status ${res.status}. Please try again.`);
        }
        setLoading(false);
        return;
      }

      if (data?.token && data?.user) {
        // Enforce admin or superadmin role
        if (data.user.role === 'admin' || data.user.role === 'superadmin') {
          login(data.token, data.user);
          navigate('/admin');
        } else {
          // Reject student accounts attempting to log in on /admin-login
          setError('Access denied. This account does not have administrator privileges. Please use the Student Login.');
        }
      } else {
        setError('Received invalid response from server. Please try again.');
      }
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setError('Unable to reach the authentication server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred during authentication. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Main Admin Auth Card */}
      <div className="flex w-full max-w-4xl bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden font-sans">
        
        {/* Left Brand Column (Desktop) */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#0B1536] p-10 text-white border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/30 flex items-center justify-center p-1.5 shadow-md border border-blue-400/30 shrink-0">
                <img 
                  src="/logo-icon-white.png" 
                  alt="DDCET RankRise Admin" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">DDCET 2027</span>
                <span className="block text-lg font-bold text-white leading-none">RankRise Admin</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20">
                <ShieldCheck size={13} />
                Management & Faculty Console
              </span>
              <h1 className="text-2xl font-bold text-white leading-snug">
                Administrative portal for curriculum & test controls.
              </h1>
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                Authorized access for educators, question setters, and portal administrators. Manage syllabus, question banks, mock exams, and resources.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>© 2027 DDCET RankRise</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={13} /> Secure Zone
            </span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 pb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-950/80 flex items-center justify-center p-1 border border-blue-500/30 shrink-0">
                <img 
                  src="/logo-icon-white.png" 
                  alt="RankRise Admin" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">DDCET ADMIN</span>
                <span className="block font-bold text-white text-base leading-none">RankRise</span>
              </div>
            </div>

            {/* Back to Student Portal Link */}
            <div>
              <Link 
                to="/student"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
              >
                <ArrowLeft size={14} />
                <span>Back to Student Portal</span>
              </Link>
            </div>

            {/* Heading */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-[11px] font-semibold mb-2">
                <ShieldCheck size={12} />
                Authorized Admin Sign In
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Admin Control Access
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your administrative credentials to manage DDCET RankRise.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-950/50 text-rose-300 p-3.5 rounded-lg text-xs font-medium border border-rose-800/60 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rankrise.edu"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-700 rounded-lg bg-slate-800/80 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <PasswordInput 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>

              {/* Submit Button */}
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating Admin...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Admin Panel</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Security Notice */}
              <p className="text-[11px] text-center text-slate-500 pt-3">
                Restricted to authorized personnel. All login attempts are recorded for system security.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
