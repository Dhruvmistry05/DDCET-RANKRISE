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
      navigate(user.role === 'admin' ? '/admin' : '/student');
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
      navigate(data.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6 bg-white dark:bg-slate-800 p-5 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-1">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Complete Your Student Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Please provide your details so we can tailor the DDCET syllabus, tests, and cut-off predictions to your diploma branch.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3.5 rounded-xl text-xs sm:text-sm font-medium border border-rose-200 dark:border-rose-900/60">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            
            {/* Required Section Header */}
            <div className="sm:col-span-2 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                <CheckCircle size={15} className="text-blue-500" /> Mandatory Information
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Dhruv Mistry" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="tel" 
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.mobile} 
                  onChange={e => setFormData({...formData, mobile: e.target.value})} 
                  placeholder="10-digit mobile number" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <input 
                  required 
                  type="date" 
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                  value={formData.dob} 
                  onChange={e => setFormData({...formData, dob: e.target.value})} 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Diploma Branch *
              </label>
              <div className="relative">
                <BookOpen size={18} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <select 
                  required 
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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

            {/* Optional Section */}
            <div className="sm:col-span-2 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2">
                College & Academic Details
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <select 
                className="w-full px-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Current Semester
              </label>
              <select 
                className="w-full px-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                value={formData.semester} 
                onChange={e => setFormData({...formData, semester: e.target.value})}
              >
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Polytechnic / College Name
              </label>
              <input 
                type="text" 
                className="w-full px-3.5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]" 
                value={formData.college} 
                onChange={e => setFormData({...formData, college: e.target.value})} 
                placeholder="e.g. Government Polytechnic Gandhinagar" 
              />
            </div>
            
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] disabled:opacity-70 min-h-[48px] flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <span>Saving details...</span>
            ) : (
              <>
                <span>Complete Profile & Go to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
