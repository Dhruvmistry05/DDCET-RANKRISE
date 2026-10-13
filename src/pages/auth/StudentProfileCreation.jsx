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
      if (user.role === 'admin') {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      {/* Subtle decorative background ambient glow */}
      <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Visual Brand & Student Value Proposition (Desktop & Tablet) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-6 sm:p-10 rounded-3xl text-white shadow-xl">
          <div className="space-y-6">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div>
                <span className="text-[10px] tracking-widest text-blue-200 font-extrabold uppercase">DDCET 2026</span>
                <span className="block text-2xl font-black tracking-tight leading-none">RANKRISE</span>
              </div>
            </div>

            {/* Headline */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30 mb-3">
                <Sparkles size={13} className="text-amber-300" /> Diploma to Degree Engineering
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                Create Your DDCET Student Profile
              </h1>
              <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed mt-2">
                Set up your diploma profile once to instantly access tailored DDCET syllabus, official past papers, chapter-wise MCQs, and timed live mock tests.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={16} className="text-blue-200" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold">Branch-Specific Study Hub</h2>
                  <p className="text-[11px] sm:text-xs text-blue-100/80">Syllabus & resources customized to your diploma engineering stream.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={16} className="text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold">Live Tests & Answer Keys</h2>
                  <p className="text-[11px] sm:text-xs text-blue-100/80">Realistic mock tests, negative-marking scoring, and official PYQ answer keys.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck size={16} className="text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold">Cut-off & Rank Predictions</h2>
                  <p className="text-[11px] sm:text-xs text-blue-100/80">Track performance metrics and predict your degree college cut-off rank.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
            <span>© 2026 DDCET RankRise</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-400" /> Verified Student Portal
            </span>
          </div>
        </div>

        {/* Right Column: Modern Student Profile Creation Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80">
          
          {/* Header */}
          <div className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Step 1 of 1 • Student Onboarding
              </span>
              <Link 
                to="/login"
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Existing User? Sign In →
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Create Student Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Please enter your academic details below. All fields are required for your student dashboard setup.
            </p>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Profile Created Successfully!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-300">Welcome to DDCET RankRise. Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold">{submitError}</p>
                {emailCheckState.exists && (
                  <p className="mt-1">
                    <Link to="/login" className="underline font-semibold text-blue-600 dark:text-blue-400">
                      Click here to sign in with your password →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Dhruv Mistry"
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.name 
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  {emailCheckState.loading && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {!emailCheckState.loading && emailCheckState.checked && !emailCheckState.exists && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Available
                    </span>
                  )}
                  {!emailCheckState.loading && emailCheckState.checked && emailCheckState.exists && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle size={13} /> Already registered
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={(e) => handleEmailCheck(e.target.value)}
                    placeholder="student@example.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.email || (emailCheckState.checked && emailCheckState.exists)
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email}</p>}
                {emailCheckState.checked && emailCheckState.exists && (
                  <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium flex items-center justify-between">
                    <span>This email is already in use.</span>
                    <Link to="/login" className="underline font-bold text-blue-600 dark:text-blue-400 ml-1">
                      Sign in with password
                    </Link>
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="10-digit number"
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.mobile 
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.mobile && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.mobile}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Date of Birth *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.dob 
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.dob && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.dob}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Gender *
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full px-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                    errors.gender 
                      ? 'border-rose-500 ring-1 ring-rose-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.gender}</p>}
              </div>

              {/* Current Semester */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Semester *
                </label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className={`w-full px-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                    errors.semester 
                      ? 'border-rose-500 ring-1 ring-rose-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
                {errors.semester && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.semester}</p>}
              </div>

              {/* Diploma Branch */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Diploma Engineering Branch *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen size={18} />
                  </div>
                  <select
                    required
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.branch 
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
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
                {errors.branch && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.branch}</p>}
              </div>

              {/* Diploma College Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Diploma College Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    placeholder="e.g. Government Polytechnic Gandhinagar"
                    className={`w-full pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all min-h-[44px] ${
                      errors.college 
                        ? 'border-rose-500 ring-1 ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.college && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.college}</p>}
              </div>

            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || (emailCheckState.checked && emailCheckState.exists)}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2.5 min-h-[50px] text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2.5">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Your Profile...</span>
                  </span>
                ) : (
                  <>
                    <span>Create My Profile</span>
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </div>

            {/* Secondary navigation to Sign In & Admin */}
            <div className="text-center pt-2 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered or have an account?{' '}
                <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Sign In with Password
                </Link>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Are you an educator or site administrator?{' '}
                <Link to="/admin/login" className="font-semibold text-slate-600 dark:text-slate-400 hover:underline">
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
