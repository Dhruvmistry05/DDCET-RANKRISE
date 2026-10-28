import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, GraduationCap, BookOpen, 
  Layers, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, 
  Sparkles, Check
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';

export default function StudentProfileCreation() {
  const navigate = useNavigate();
  const { login, user, token, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
    college: '',
    branch: '',
    semester: ''
  });

  const [errors, setErrors] = useState({});
  const [emailCheckState, setEmailCheckState] = useState({
    loading: false,
    checked: false,
    exists: false,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // If already authenticated and profile completed, redirect to appropriate dashboard
  useEffect(() => {
    if (user && token) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin');
      } else if (!user.profile_completed) {
        navigate('/complete-profile');
      } else {
        navigate('/student');
      }
    }
  }, [user, token, navigate]);

  // Debounced/OnBlur Email availability check
  const handleEmailCheck = async (emailToTest) => {
    const cleanEmail = (emailToTest || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEmailCheckState({ loading: false, checked: false, exists: false, message: '' });
      return;
    }

    setEmailCheckState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(getApiUrl('/api/auth/check-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      if (res.ok) {
        const data = await res.json();
        setEmailCheckState({
          loading: false,
          checked: true,
          exists: Boolean(data.exists),
          message: data.message || (data.exists ? 'Email is already registered.' : 'Email is available.')
        });
      } else {
        setEmailCheckState({ loading: false, checked: false, exists: false, message: '' });
      }
    } catch {
      setEmailCheckState({ loading: false, checked: false, exists: false, message: '' });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear individual field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }

    // Reset email check status if user modifies email
    if (field === 'email') {
      setEmailCheckState({ loading: false, checked: false, exists: false, message: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanMobile = formData.mobile.replace(/\D/g, '');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    } else if (emailCheckState.checked && emailCheckState.exists) {
      newErrors.email = 'This email is already registered in DDCET RankRise.';
    }

    if (!cleanMobile) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (cleanMobile.length !== 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender.';
    }

    if (!formData.college.trim()) {
      newErrors.college = 'Diploma college name is required.';
    }

    if (!formData.branch) {
      newErrors.branch = 'Please select your diploma branch.';
    }

    if (!formData.semester) {
      newErrors.semester = 'Please select your current semester.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.replace(/\D/g, ''),
        dob: formData.dob,
        gender: formData.gender,
        college: formData.college.trim(),
        branch: formData.branch,
        semester: String(formData.semester)
      };

      const res = await fetch(getApiUrl('/api/auth/student-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        if (res.status === 409) {
          setEmailCheckState({
            loading: false,
            checked: true,
            exists: true,
            message: 'This email is already registered in DDCET RankRise.'
          });
          setSubmitError(data?.error || 'This email is already registered. Please sign in with your credentials.');
        } else if (data?.error) {
          setSubmitError(data.error);
        } else if (res.status === 400) {
          setSubmitError('Please verify all form fields and try again.');
        } else if (res.status >= 500) {
          setSubmitError('Server is currently experiencing high load. Please try again in a few moments.');
        } else {
          setSubmitError(`Registration failed (Status ${res.status}). Please try again.`);
        }
        setIsSubmitting(false);
        return;
      }

      if (data?.token && data?.user) {
        setSubmitSuccess(true);
        login(data.token, data.user);
        
        // Brief delay so student sees the confirmed success state
        setTimeout(() => {
          navigate('/student');
        }, 1200);
      } else {
        setSubmitError('Received unexpected server response. Please try signing in.');
        setIsSubmitting(false);
      }
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network')) {
        setSubmitError('Unable to reach the server. Please check your internet connection.');
      } else {
        setSubmitError('An unexpected error occurred while creating your profile. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 font-medium">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading DDCET RankRise...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Visual Brand & Student Value Proposition */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-[#1E3A8A] p-6 sm:p-8 rounded-xl text-white border border-blue-900 shadow-xs">
          <div className="space-y-5">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1.5 shadow-xs border border-white/20 shrink-0">
                <img 
                  src="/logo-icon-white.png" 
                  alt="DDCET RankRise" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <span className="text-[11px] tracking-wider text-blue-200 font-semibold uppercase">DDCET 2027</span>
                <span className="block text-lg font-bold tracking-tight text-white leading-tight">RankRise</span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-blue-100 text-xs font-semibold border border-white/15 mb-2">
                Diploma to Degree Entrance Prep
              </span>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-white">
                Create Student Profile
              </h1>
              <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed mt-2 font-medium">
                Set up your diploma profile once to access the official DDCET syllabus, previous year question papers, chapter MCQs, and timed mock tests.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/15">
                <BookOpen size={16} className="text-blue-200 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-white">Branch-Specific Study Hub</h2>
                  <p className="text-[11px] text-blue-100/80">Syllabus & resources tailored to your diploma engineering stream.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/15">
                <Layers size={16} className="text-blue-200 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-white">Live Mock Tests & Answer Keys</h2>
                  <p className="text-[11px] text-blue-100/80">Real-time assessments, negative marking simulation, and official answer keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg border border-white/15">
                <ShieldCheck size={16} className="text-blue-200 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-white">Statewide Performance Analytics</h2>
                  <p className="text-[11px] text-blue-100/80">Track accuracy rates, identify weak topics, and evaluate merit ranks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>© 2027 DDCET RankRise</span>
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 size={13} className="text-emerald-400" /> Verified Portal
            </span>
          </div>
        </div>

        {/* Right Column: Student Profile Creation Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          
          {/* Header */}
          <div className="mb-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Student Registration
              </span>
              <Link 
                to="/login"
                className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
              >
                Existing User? Sign In →
              </Link>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please enter your diploma engineering information below.
            </p>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">Profile Created Successfully</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Welcome to DDCET RankRise. Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-semibold">{submitError}</p>
                {emailCheckState.exists && (
                  <p className="mt-1">
                    <Link to="/login" className="underline font-medium text-blue-600 dark:text-blue-400">
                      Sign in with your password →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.name 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  {emailCheckState.loading && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Checking...
                    </span>
                  )}
                  {!emailCheckState.loading && emailCheckState.checked && !emailCheckState.exists && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Available
                    </span>
                  )}
                  {!emailCheckState.loading && emailCheckState.checked && emailCheckState.exists && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> Already registered
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={(e) => handleEmailCheck(e.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.email || (emailCheckState.checked && emailCheckState.exists)
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                {emailCheckState.checked && emailCheckState.exists && (
                  <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium flex items-center justify-between">
                    <span>This email is already in use.</span>
                    <Link to="/login" className="underline font-medium text-blue-600 dark:text-blue-400 ml-1">
                      Sign in with password
                    </Link>
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="10-digit number"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.mobile 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  />
                </div>
                {errors.mobile && <p className="text-rose-500 text-xs mt-1">{errors.mobile}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.dob 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  />
                </div>
                {errors.dob && <p className="text-rose-500 text-xs mt-1">{errors.dob}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Gender *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                    errors.gender 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-rose-500 text-xs mt-1">{errors.gender}</p>}
              </div>

              {/* Current Semester */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Current Semester *
                </label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                    errors.semester 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                  }`}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-rose-500 text-xs mt-1">{errors.semester}</p>}
              </div>

              {/* Diploma Branch */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Diploma Engineering Branch *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <BookOpen size={16} />
                  </div>
                  <select
                    required
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.branch 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  >
                    <option value="">Select Engineering Branch</option>
                    <option value="Computer">Computer Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Chemical">Chemical Engineering</option>
                    <option value="EC">Electronics & Communication (EC)</option>
                    <option value="Automobile">Automobile Engineering</option>
                    <option value="Other">Other Engineering Stream</option>
                  </select>
                </div>
                {errors.branch && <p className="text-rose-500 text-xs mt-1">{errors.branch}</p>}
              </div>

              {/* Diploma College Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Diploma College Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    placeholder="e.g. Government Polytechnic Gandhinagar"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm outline-none transition-colors ${
                      errors.college 
                        ? 'border-rose-500 focus:border-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-850'
                    }`}
                  />
                </div>
                {errors.college && <p className="text-rose-500 text-xs mt-1">{errors.college}</p>}
              </div>

            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || (emailCheckState.checked && emailCheckState.exists)}
                className="w-full py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Profile...</span>
                  </span>
                ) : (
                  <>
                    <span>Create My Profile</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Secondary links */}
            <div className="text-center pt-2 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered or have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Sign In with Password
                </Link>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Educator or administrator?{' '}
                <Link to="/admin-login" className="text-slate-600 dark:text-slate-400 hover:underline">
                  Admin Sign In
                </Link>
              </p>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
