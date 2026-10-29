import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { 
  User, Mail, Phone, Calendar, BookOpen, GraduationCap, 
  CheckCircle2, ShieldCheck, Edit3, X, Save, 
  RefreshCw, Trophy, ArrowLeft, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentProfile() {
  const { user, token, fetchProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    dob: '',
    branch: '',
    gender: '',
    college: '',
    semester: ''
  });

  const loadProfileAndStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [profRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/profile`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE_URL}/api/student/dashboard-stats`, { headers }).then(r => r.ok ? r.json() : null)
      ]);

      const activeUser = profRes || user;
      setProfileData(activeUser);
      if (statsRes) setStats(statsRes);

      if (activeUser) {
        setFormData({
          name: activeUser.name || '',
          mobile: activeUser.mobile || '',
          dob: activeUser.dob ? activeUser.dob.split('T')[0] : '',
          branch: activeUser.branch || '',
          gender: activeUser.gender || 'Male',
          college: activeUser.college || '',
          semester: activeUser.semester ? String(activeUser.semester) : '6'
        });
      }
    } catch {
      setError('Failed to fetch profile details. Using cached session data.');
      if (user) {
        setProfileData(user);
        setFormData({
          name: user.name || '',
          mobile: user.mobile || '',
          dob: user.dob ? user.dob.split('T')[0] : '',
          branch: user.branch || '',
          gender: user.gender || 'Male',
          college: user.college || '',
          semester: user.semester ? String(user.semester) : '6'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Load fresh profile & stats
  useEffect(() => {
    loadProfileAndStats();
  }, [loadProfileAndStats]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return setError('Full name must be at least 2 characters long.');
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return setError('Please enter a valid 10-digit mobile number.');
    }

    if (!formData.dob) {
      return setError('Please select your Date of Birth.');
    }

    if (!formData.branch) {
      return setError('Please select your diploma engineering branch.');
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: cleanMobile,
          dob: formData.dob,
          branch: formData.branch,
          gender: formData.gender,
          college: formData.college.trim(),
          semester: formData.semester
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update profile.');
      }

      const updated = await res.json();
      setProfileData(updated);
      setIsEditing(false);
      setSuccessMsg('Your student profile was updated successfully.');

      // Refresh global AuthContext state so top bar and sidebar reflect changes immediately
      if (fetchProfile && token) {
        await fetchProfile(token);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentInfo = profileData || user || {};

  // Compute initials for avatar
  const getInitials = (nameStr) => {
    if (!nameStr) return 'ST';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  const DIPLOMA_BRANCHES = [
    'Computer Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Electronics & Communication (EC)',
    'Automobile Engineering',
    'Instrumentation & Control (IC)',
    'Other Engineering Diploma'
  ];

  if (loading && !profileData && !user) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Loading student profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          to="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>

        <span className="text-xs text-slate-400">
          Student ID: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">#{currentInfo.id || 'Candidate'}</span>
        </span>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#1E3A8A] to-[#1e293b] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-tight shadow-inner shrink-0">
              {getInitials(currentInfo.name)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {currentInfo.name || 'DDCET Candidate'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  <ShieldCheck size={11} className="text-blue-300" />
                  <span>Verified Student</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80 flex items-center gap-1.5">
                <Mail size={13} className="text-blue-300" />
                <span>{currentInfo.email || 'student@rankrise.edu'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-blue-200/90 font-medium">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">
                  {currentInfo.branch || 'Engineering Branch'}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">
                  Semester {currentInfo.semester || '6'}
                </span>
                {currentInfo.college && (
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 truncate max-w-xs">
                    {currentInfo.college}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="self-start sm:self-center">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-blue-50 transition shadow-xs cursor-pointer"
              >
                <Edit3 size={14} className="text-[#1E3A8A]" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition cursor-pointer"
              >
                <X size={14} />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: View Profile vs Edit Profile */}
      {!isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal & Academic Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Details Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-750 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <span>Personal Information</span>
                </h2>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                  Profile Completed (100%)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentInfo.name || '-'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{currentInfo.email || '-'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Phone size={11} className="text-blue-500" />
                    <span>Mobile Number</span>
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentInfo.mobile ? `+91 ${currentInfo.mobile}` : '-'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Calendar size={11} className="text-blue-500" />
                    <span>Date of Birth</span>
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentInfo.dob ? new Date(currentInfo.dob).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentInfo.gender || 'Not specified'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Member Since</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentInfo.created_at ? new Date(currentInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026 Season'}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-750 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={16} className="text-blue-600" />
                  <span>Academic & Polytechnic Details</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Diploma Engineering Branch</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>{currentInfo.branch || 'Not configured'}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">College / Polytechnic Institute</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{currentInfo.college || 'Government Polytechnic'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Diploma Semester</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Semester {currentInfo.semester || '6'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700 space-y-0.5 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Examination</span>
                  <p className="font-bold text-[#1E3A8A] dark:text-blue-400 text-sm">
                    DDCET (Diploma to Degree Common Entrance Test) - Gujarat
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Preparation Stats & Profile Summary (1 Col) */}
          <div className="space-y-6">
            
            {/* Preparation Summary Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                <span>Performance Snapshot</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Current State Rank</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {stats?.current_rank !== '-' && stats?.current_rank ? stats.current_rank : 'Unranked'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Average Test Score</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {stats?.average_score || '0%'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Assessments Submitted</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {stats?.tests_completed || 0} Tests
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Questions Attempted</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {stats?.questions_attempted || 0} MCQs
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500">Syllabus Coverage</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {stats?.syllabus_progress || '0%'}
                  </span>
                </div>
              </div>

              <Link
                to="/student/analytics"
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition border border-blue-200 dark:border-blue-900"
              >
                <span>View Full Analytics Dashboard →</span>
              </Link>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to="/student/practice"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <span>Practice Lab (MCQs)</span>
                  <span className="text-blue-600 font-bold">Start →</span>
                </Link>
                <Link
                  to="/student/resources"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <span>Study Library</span>
                  <span className="text-blue-600 font-bold">Browse →</span>
                </Link>
                <Link
                  to="/student/mistakes"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <span>Weak Spot</span>
                  <span className="text-rose-600 font-bold">Review →</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Edit Profile Form */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-750 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" />
                <span>Edit Student Profile Information</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Keep your diploma academic records and mobile contact up to date for DDCET counselling.
              </p>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Yash Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Diploma Branch */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Diploma Engineering Branch <span className="text-rose-500">*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Diploma Branch</option>
                  {DIPLOMA_BRANCHES.map((b, idx) => (
                    <option key={idx} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* College Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  College / Polytechnic Institute Name
                </label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  placeholder="e.g. Government Polytechnic, Ahmedabad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Current Semester */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Current Diploma Semester
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="Completed">Diploma Completed / Passout</option>
                </select>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-750">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
