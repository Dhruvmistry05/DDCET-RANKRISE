import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, FileText, CheckCircle2, 
  ArrowRight, ShieldCheck, Trophy, Sparkles, Download, 
  Eye, Clock, BarChart2, Zap, HelpCircle, ChevronRight, 
  Layers, Lock, Compass, User, LogIn, UserPlus, CheckCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

export default function LandingPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(user && token);
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin');

  // Load public subjects & resources for visitors
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subjects`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSubjects(data);
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/resources?publishedOnly=true`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter papers and answer keys
          setFeaturedResources(data.filter(r => !r.external_url).slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const ddcetSubjects = [
    {
      name: 'Mathematics',
      code: 'BE-01',
      mcqCount: '820+ MCQs',
      topicsCount: '41 Topics',
      description: 'Matrices, Determinants, Differentiation, Integration, Vectors, and Coordinate Geometry.',
      color: 'from-blue-600 to-indigo-700',
      tag: 'Section 1'
    },
    {
      name: 'Physics',
      code: 'BE-01',
      mcqCount: '780+ MCQs',
      topicsCount: '26 Topics',
      description: 'Units & Measurements, Mechanics, Wave Optics, Current Electricity, and Modern Physics.',
      color: 'from-indigo-600 to-purple-700',
      tag: 'Section 1'
    },
    {
      name: 'Chemistry',
      code: 'BE-01',
      mcqCount: '360+ MCQs',
      topicsCount: '12 Topics',
      description: 'Atomic Structure, Chemical Bonding, Electrochemistry, Solutions, and Metallurgy.',
      color: 'from-teal-600 to-emerald-700',
      tag: 'Section 1'
    },
    {
      name: 'English / Soft Skills',
      code: 'BE-02',
      mcqCount: '360+ MCQs',
      topicsCount: '13 Topics',
      description: 'Grammar, Professional Vocabulary, Reading Comprehension, and Communication Skills.',
      color: 'from-amber-600 to-orange-700',
      tag: 'Section 2'
    },
    {
      name: 'Environmental Sciences',
      code: 'BE-02',
      mcqCount: '120+ MCQs',
      topicsCount: '4 Topics',
      description: 'Ecosystems, Environmental Pollution, Natural Resources, and Sustainable Engineering.',
      color: 'from-emerald-600 to-teal-700',
      tag: 'Section 2'
    },
    {
      name: 'Computer Fundamentals',
      code: 'BE-02',
      mcqCount: '90+ MCQs',
      topicsCount: '3 Topics',
      description: 'Digital Computer Architecture, Algorithms, Flowcharts, and Number Systems.',
      color: 'from-cyan-600 to-blue-700',
      tag: 'Section 2'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. Public Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white font-black text-base shadow-sm border border-blue-600/30 group-hover:scale-105 transition-transform">
              RR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">DDCET</span>
                <span className="text-xs font-medium text-slate-500">2027</span>
              </div>
              <span className="block text-slate-900 dark:text-white font-bold text-base leading-none">
                RankRise
              </span>
            </div>
          </Link>

          {/* Navigation Links (Public Exploration) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Features
            </a>
            <a href="#subjects" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Subjects
            </a>
            <Link to="/student/syllabus" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Syllabus
            </Link>
            <Link to="/student/resources" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Study Library & PYQs
            </Link>
            <a href="#exam-pattern" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Exam Pattern
            </a>
          </nav>

          {/* Navbar Right Actions: Clearly visible Login and Sign Up buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={isAdmin ? '/admin' : '/student'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Log in
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200 dark:border-slate-800 bg-radial from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-[#1E3A8A] dark:text-blue-300 text-xs font-bold shadow-2xs">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            <span>Official Preparation Portal for DDCET 2027 Aspirants</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">DDCET Exam</span> with Confidence.
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The complete academic platform for Gujarat Diploma-to-Degree engineering entrance. Practice 2,530+ verified MCQs, download past papers with official answer keys, and simulate full timed mock exams.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/student/resources"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-sm font-bold transition shadow-md"
            >
              <BookOpen size={16} />
              <span>Explore Study Library & Papers</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/student/syllabus"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-sm font-bold transition shadow-xs"
            >
              <FileText size={16} className="text-blue-600" />
              <span>View Full Syllabus</span>
            </Link>

            <Link
              to="/login?mode=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition shadow-md"
            >
              <UserPlus size={16} />
              <span>Start Free Practice</span>
            </Link>
          </div>

          {/* 4 Core Platform Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-8 max-w-4xl mx-auto text-left">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Question Bank</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">2,530+ MCQs</p>
              <span className="text-[11px] text-blue-600 font-medium">Topic & chapter mapped</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Curriculum Scope</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">99 Topics</p>
              <span className="text-[11px] text-emerald-600 font-medium">Across all 6 subjects</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Past Papers</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">Paired Keys</p>
              <span className="text-[11px] text-purple-600 font-medium">Official verified PDFs</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-slate-400">Exam Simulator</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">100 MCQs / 90m</p>
              <span className="text-[11px] text-rose-600 font-medium">-0.25 Negative marking</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. DDCET 2027 Preparation Features Section */}
      <section id="features" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Complete Academic Suite</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Engineered Specifically for DDCET Success
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Everything a diploma candidate needs to transition to premier degree engineering colleges like LD, VGEC, BVM, and Nirma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Topic & Chapter Practice Lab
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Target individual subjects, chapters, or specific topics. Practice 30-MCQ sessions with detailed step-by-step explanations and immediate score calculations.
            </p>
            <div className="pt-2">
              <Link to="/student/practice" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                <span>Start Practice</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Study Library (Papers & Answer Keys)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Question papers paired with their matching official answer keys in one organized view. Preview and download certified PDFs freely with zero login requirement.
            </p>
            <div className="pt-2">
              <Link to="/student/resources" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
                <span>Browse Library</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Full-Length Timed Mock Tests
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Simulate actual GTU/ACPC exam hall conditions. 90-minute countdown, 100 questions, palette navigation, and official negative marking calculation.
            </p>
            <div className="pt-2">
              <Link to="/student/mock" className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline">
                <span>Simulate Exam</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              DDCET Readiness Indicator & Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track your exam readiness percentage (0–100%) across 5 status tiers. Diagnose strong and weak chapters based purely on your real recorded test attempts.
            </p>
            <div className="pt-2">
              <Link to="/student/analytics" className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline">
                <span>Explore Analytics</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Trophy size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Real Statewide Leaderboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Compare your scores, accuracy, and test count with other diploma candidates across Gujarat polytechnic colleges with zero fabricated bots.
            </p>
            <div className="pt-2">
              <Link to="/student/leaderboard" className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                <span>View Ranks</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center font-bold">
              <Compass size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Interactive Syllabus & Blueprint
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Section BE-01 (Science & Engineering) and BE-02 (Soft Skills) mapped down to individual concepts. Mark completion as you cover topics in college.
            </p>
            <div className="pt-2">
              <Link to="/student/syllabus" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:underline">
                <span>Explore Syllabus</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 4. All 6 DDCET Subjects Showcase */}
      <section id="subjects" className="py-16 bg-slate-100/70 dark:bg-slate-850/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Syllabus Breakdown</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                6 Core DDCET Subjects Covered
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Explore topic counts, question bank volume, and curriculum scope without logging in.
              </p>
            </div>

            <Link
              to="/student/syllabus"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
            >
              <span>Explore Complete Syllabus Tracker</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ddcetSubjects.map((sub, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {sub.code} • {sub.tag}
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {sub.mcqCount}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">{sub.topicsCount}</span>
                  <Link
                    to="/student/syllabus"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>View Topics</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Study Library & Question Papers Showcase */}
      <section id="papers" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Open Study Library</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Official Question Papers & Verified Answer Keys
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organized together so you can download and cross-verify actual DDCET past exams freely.
            </p>
          </div>

          <Link
            to="/student/resources"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>Open Study Library</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Highlighted Paired Paper & Answer Key Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  2023 Official Examination
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  Matching Answer Key Available
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                DDCET Official Question Paper & Complete Verified Answer Key
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Original state entrance examination paper covering Mathematics, Physics, Chemistry, English, and Engineering basics.
              </p>
            </div>

            <Link
              to="/student/resources"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shrink-0 self-start lg:self-auto"
            >
              <span>View in Study Library</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Paper Preview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">DDCET 2023 Question Paper</p>
                  <span className="text-[11px] text-slate-400">100 Questions • Official PDF</span>
                </div>
              </div>
              <Link
                to="/student/resources"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                <Download size={13} />
                <span>PDF</span>
              </Link>
            </div>

            {/* Answer Key Preview */}
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Official Answer Key</p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Question-by-Question Key</span>
                </div>
              </div>
              <Link
                to="/student/resources"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
              >
                <Download size={13} />
                <span>Key PDF</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DDCET Exam Pattern & Blueprint */}
      <section id="exam-pattern" className="py-16 bg-slate-100/70 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Official Exam Format</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              DDCET Examination Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Diploma to Degree Common Entrance Test pattern mandated by Gujarat Education Department.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <span className="text-3xl font-black text-[#1E3A8A] dark:text-blue-400">100</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Multiple Choice Questions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Objective MCQs covering Basic Sciences, Engineering concepts, Soft Skills, and Mathematics.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <span className="text-3xl font-black text-[#1E3A8A] dark:text-blue-400">90 Mins</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Total Time Allocation</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pacing benchmark is exactly 54 seconds per question to complete all 100 questions.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-center">
              <span className="text-3xl font-black text-rose-600">-0.25</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Negative Marking</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penalty for incorrect answers. Avoid blind guesses to protect your net merit rank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call to Action Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0b1329] via-[#1E3A8A] to-[#1e293b] rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl border border-slate-800">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Claim Your Merit Rank in DDCET 2027?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Create your student profile to save your practice history, track test analytics, and revise from your personalized mistake notebook.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login?mode=signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md"
            >
              <UserPlus size={16} />
              <span>Sign Up for Free</span>
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition border border-white/20"
            >
              <LogIn size={16} />
              <span>Log In to Existing Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Public Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <div className="w-6 h-6 rounded-md bg-[#1E3A8A] flex items-center justify-center text-white text-[10px] font-black">
                  RR
                </div>
                <span>DDCET RankRise Academic Portal</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dedicated entrance preparation system for Gujarat Diploma to Degree admissions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <Link to="/student/syllabus" className="hover:text-blue-600">Syllabus</Link>
              <Link to="/student/resources" className="hover:text-blue-600">Study Library</Link>
              <Link to="/login" className="hover:text-blue-600">Student Login</Link>
              <Link to="/login?mode=signup" className="hover:text-blue-600">Sign Up</Link>
              <Link to="/admin-login" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Admin Console</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© 2026-2027 DDCET RankRise. All study materials, question papers & blueprints for educational use.</span>
            <span>Independent Academic Portal for Gujarat Diploma Students</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
