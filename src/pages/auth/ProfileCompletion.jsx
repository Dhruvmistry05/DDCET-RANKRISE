import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';
import { User, Phone, Calendar, BookOpen, CheckCircle, GraduationCap, ArrowRight } from 'lucide-react';

export default function ProfileCompletion() {
  const { user, token, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', mobile: '', dob: '', branch: '', gender: '', college: '', semester: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.profile_completed) {
      navigate((user.role === 'admin' || user.role === 'superadmin') ? '/admin' : '/student');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validations
    if (formData.mobile.length < 10) {
      return setError('Please enter a valid 10-digit mobile number');
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.error || `Failed to save profile (${res.status})`);
      
      await fetchProfile(token); // Update context
      navigate((data.role === 'admin' || data.role === 'superadmin') ? '/admin' : '/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/60 mb-1">
            <GraduationCap size={14} /> Profile Onboarding
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Complete Your Student Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Please enter your diploma engineering information to personalize your syllabus, question banks, and cutoff predictions.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-900/60">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Enter your full name" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="tel" 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})} 
                  placeholder="10-digit mobile" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="date" 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                  value={formData.dob} 
                  onChange={e => setFormData({...formData, dob: e.target.value})} 
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Diploma Branch *
              </label>
              <div className="relative">
                <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  required 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  value={formData.branch} 
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                >
                  <option value="">Select Branch</option>
                  <option value="Computer">Computer Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Chemical">Chemical Engineering</option>
                  <option value="EC">Electronics & Communication</option>
                  <option value="Automobile">Automobile Engineering</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Gender
              </label>
              <select 
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Current Semester
              </label>
              <select 
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                value={formData.semester} 
                onChange={e => setFormData({...formData, semester: e.target.value})}
              >
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Polytechnic / College Name
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                value={formData.college} 
                onChange={e => setFormData({...formData, college: e.target.value})} 
                placeholder="e.g. Government Polytechnic Gandhinagar" 
              />
            </div>
            
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full mt-3 py-3 px-5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold rounded-lg transition shadow-xs active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <span>Saving details...</span>
            ) : (
              <>
                <span>Complete Profile & Open Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
