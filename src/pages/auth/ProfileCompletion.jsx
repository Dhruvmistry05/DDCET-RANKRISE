import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { User, Phone, Calendar, BookOpen, CheckCircle } from 'lucide-react';

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
      return setError('Please enter a valid mobile number');
    }

    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      
      await fetchProfile(token); // Update context
      navigate(data.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Tell us a bit about yourself before you jump in.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-200">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Required Fields */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-500" /> Required Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="text" className="w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dhruv Mistry" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="tel" className="w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="10-digit number" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input required type="date" className="w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diploma Branch *</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select required className="w-full pl-10 pr-3 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                  <option value="">Select Branch</option>
                  <option value="Computer">Computer Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                </select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
                Optional Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Semester</label>
              <select className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Name</label>
              <input type="text" className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} placeholder="e.g. Government Polytechnic" />
            </div>
            
          </div>

          <button disabled={loading} type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 mt-6">
            {loading ? 'Saving...' : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

