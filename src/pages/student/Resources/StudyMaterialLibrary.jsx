import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { 
  FileText, Download, Eye, Calendar, Search, 
  RefreshCw, BookOpen, AlertCircle, FileCheck, Book,
  ChevronLeft, ChevronRight, X, Sparkles, 
  Layers, CheckCircle2, Clock, ArrowRight, ShieldCheck, PenTool
} from 'lucide-react';

export default function StudyMaterialLibrary({ defaultCategory = 'all' }) {
  const [searchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  // Categories: 'all' | 'papers_and_keys' | 'syllabus' | 'practice'
  const [activeCategory, setActiveCategory] = useState(
    defaultCategory === 'question_paper' || defaultCategory === 'answer_key' ? 'papers_and_keys' : defaultCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('order'); // 'order', 'year_desc', 'title_asc'

  // Sync URL search params (e.g. from global search bar)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const catParam = searchParams.get('category');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (catParam) {
      setActiveCategory(catParam);
    }
  }, [searchParams]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [previewPdfItem, setPreviewPdfItem] = useState(null);

  const { token, user } = useAuth();
  const isAuthenticated = Boolean(user && token);
  const API_URL = API_BASE_URL;

  // Fetch published resources, subjects, and chapters
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, subData, chapData] = await Promise.all([
        fetch(`${API_URL}/api/resources?publishedOnly=true`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(resData)) {
        // Filter out any external web links from Study Library as requested
        setResources(resData.filter(r => !r.external_url));
      } else {
        setResources([]);
      }
      if (Array.isArray(subData)) setSubjects(subData);
      if (Array.isArray(chapData)) setChapters(chapData);
    } catch {
      setError('Unable to load study materials. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format bytes to human readable string
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Resolve direct view URL
  const getViewUrl = (item) => {
    if (!item?.file_path) return '';
    if (item.file_path.startsWith('http')) return item.file_path;
    return `${API_URL}${item.file_path}`;
  };

  // Resolve safe download URL
  const getDownloadUrl = (item) => {
    if (!item?.id) return '';
    return `${API_URL}/api/resources/${item.id}/download`;
  };

  // Unique years available
  const availableYears = useMemo(() => {
    const years = resources.map(r => r.exam_year).filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [resources]);

  // Organize Question Papers with their matching Answer Keys together
  const { pairedPapers, standaloneAnswerKeys, syllabusItems, practiceItems } = useMemo(() => {
    const questionPapers = resources.filter(r => r.type === 'question_paper');
    const answerKeys = resources.filter(r => r.type === 'answer_key');
    const syllabusList = resources.filter(r => r.type === 'syllabus');
    const practiceList = resources.filter(r => r.type === 'general' || r.type === 'practice' || (!r.type && r.type !== 'question_paper' && r.type !== 'answer_key' && r.type !== 'syllabus'));

    const matchedKeyIds = new Set();

    const paired = questionPapers.map(paper => {
      // 1. Match by paper_id === paper.id
      let match = answerKeys.find(k => String(k.paper_id) === String(paper.id));
      
      // 2. Fallback: match by exam_year
      if (!match && paper.exam_year) {
        match = answerKeys.find(k => String(k.exam_year) === String(paper.exam_year));
      }

      // 3. Fallback: match by title keywords (e.g. "2023" in both titles)
      if (!match && paper.title) {
        const yearInTitle = paper.title.match(/20\d\d/);
        if (yearInTitle) {
          match = answerKeys.find(k => k.title && k.title.includes(yearInTitle[0]));
        }
      }

      if (match) {
        matchedKeyIds.add(match.id);
      }

      return {
        ...paper,
        matching_answer_key: match || null
      };
    });

    // Any answer keys not matched to a question paper
    const standaloneKeys = answerKeys.filter(k => !matchedKeyIds.has(k.id));

    return {
      pairedPapers: paired,
      standaloneAnswerKeys: standaloneKeys,
      syllabusItems: syllabusList,
      practiceItems: practiceList
    };
  }, [resources]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: pairedPapers.length + standaloneAnswerKeys.length + syllabusItems.length + practiceItems.length,
      papers_and_keys: pairedPapers.length + standaloneAnswerKeys.length,
      syllabus: syllabusItems.length,
      practice: practiceItems.length
    };
  }, [pairedPapers, standaloneAnswerKeys, syllabusItems, practiceItems]);

  // Combined Unified Items List for Display
  const allUnifiedItems = useMemo(() => {
    let items = [];

    if (activeCategory === 'all' || activeCategory === 'papers_and_keys') {
      // Add paired question papers
      items = items.concat(pairedPapers.map(p => ({ ...p, displayCategory: 'paired_paper' })));
      // Add standalone answer keys if any
      items = items.concat(standaloneAnswerKeys.map(k => ({ ...k, displayCategory: 'standalone_key' })));
    }

    if (activeCategory === 'all' || activeCategory === 'syllabus') {
      items = items.concat(syllabusItems.map(s => ({ ...s, displayCategory: 'syllabus' })));
    }

    if (activeCategory === 'all' || activeCategory === 'practice') {
      items = items.concat(practiceItems.map(pr => ({ ...pr, displayCategory: 'practice' })));
    }

    // Apply Filters: Subject, Chapter, Year, Search
    return items.filter(item => {
      // Subject Filter
      if (selectedSubject !== 'all' && String(item.subject_id) !== String(selectedSubject)) return false;

      // Chapter Filter
      if (selectedChapter !== 'all' && String(item.chapter_id) !== String(selectedChapter)) return false;

      // Exam Year Filter
      if (selectedYear !== 'all' && String(item.exam_year) !== String(selectedYear)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const keyMatch = item.matching_answer_key?.title?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !keyMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'year_desc') {
        return (b.exam_year || 0) - (a.exam_year || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if ((a.display_order || 0) !== (b.display_order || 0)) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return (b.exam_year || 0) - (a.exam_year || 0);
    });
  }, [pairedPapers, standaloneAnswerKeys, syllabusItems, practiceItems, activeCategory, selectedSubject, selectedChapter, selectedYear, searchQuery, sortBy]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSubject, selectedChapter, selectedYear, searchQuery, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(allUnifiedItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allUnifiedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [allUnifiedItems, currentPage, itemsPerPage]);

  const resetAllFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedChapter('all');
    setSelectedYear('all');
    setSortBy('order');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedSubject !== 'all' || selectedChapter !== 'all' || selectedYear !== 'all' || activeCategory !== 'all';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#1E3A8A] text-white border border-blue-900 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-blue-100 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            <span>Official Examination Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            DDCET Study Material Library
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
            Access previous year question papers together with their official answer keys, certified syllabus blueprints, and practice materials in one unified place.
          </p>
        </div>
      </div>

      {/* Guest Mode Notice */}
      {!isAuthenticated && (
        <div className="p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#1E3A8A] text-white shrink-0 mt-0.5">
              <Sparkles size={14} />
            </span>
            <div className="text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Open Access Library: </span>
              All official GTU papers, paired answer keys, and syllabus blueprints are free to view and download. Sign in or sign up to practice individual questions in the interactive lab.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-blue-600 font-bold transition shadow-2xs text-xs"
            >
              Log In
            </Link>
            <Link
              to="/login?mode=signup"
              className="px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold transition shadow-xs text-xs"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      )}

      {/* Category Tabs: Cleaned up, Study Links removed, Question Papers & Keys paired */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Resources', icon: Layers, count: categoryCounts.all },
          { key: 'papers_and_keys', label: 'Question Papers & Answer Keys', icon: FileCheck, count: categoryCounts.papers_and_keys },
          { key: 'syllabus', label: 'Official Syllabus', icon: Book, count: categoryCounts.syllabus },
          { key: 'practice', label: 'Practice PDFs & Notes', icon: BookOpen, count: categoryCounts.practice }
        ].map(tab => {
          const isActive = activeCategory === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question papers, answer keys, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Exam Year Filter */}
          <div className="w-full sm:w-40 shrink-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Exam Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={String(yr)}>{yr} Exam</option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 rounded-lg text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="order">Featured / Default</option>
              <option value="year_desc">Latest Year First</option>
              <option value="title_asc">Title (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-750 text-xs">
            <span className="text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{allUnifiedItems.length}</span> matching materials
            </span>
            <button
              onClick={resetAllFilters}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[35vh]">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Loading certified study materials and answer keys...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && paginatedItems.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No resources found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No study materials match your current filter selections. Try resetting filters or searching with different terms.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Unified Resource Cards Grid */}
      {!loading && paginatedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {paginatedItems.map((item) => {
            const isPairedPaper = item.displayCategory === 'paired_paper';
            const matchingKey = item.matching_answer_key;

            return (
              <div
                key={`${item.displayCategory}-${item.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top: Header & Badges */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.exam_year && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{item.exam_year} Exam</span>
                        </span>
                      )}

                      {isPairedPaper ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Question Paper & Answer Key
                        </span>
                      ) : item.displayCategory === 'standalone_key' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Official Answer Key
                        </span>
                      ) : item.displayCategory === 'syllabus' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Exam Syllabus Blueprint
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          Practice Material
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-bold uppercase text-slate-400">PDF</span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Primary Item (Question Paper or General Material) Download & View Row */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {isPairedPaper ? 'Question Paper (Official)' : item.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {formatFileSize(item.file_size) || 'Certified PDF'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewPdfItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                        title="View PDF Document"
                      >
                        <Eye size={13} />
                        <span className="hidden xs:inline">Preview</span>
                      </button>

                      <a
                        href={getDownloadUrl(item)}
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs"
                        title="Download PDF Document"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  {/* Paired Matching Answer Key Section (Requirement 2 & 3: Organized Together!) */}
                  {isPairedPaper && (
                    <div className="pt-1">
                      {matchingKey ? (
                        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                              <FileCheck size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                                  {matchingKey.title || 'Official Answer Key'}
                                </span>
                                <span className="text-[9px] font-bold bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200 px-1.5 py-0.2 rounded">
                                  Verified Key
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                Matching answer key for {item.exam_year || ''} paper
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreviewPdfItem(matchingKey)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold hover:bg-emerald-50 transition cursor-pointer"
                              title="View Answer Key PDF"
                            >
                              <Eye size={13} />
                              <span className="hidden xs:inline">Preview</span>
                            </button>

                            <a
                              href={getDownloadUrl(matchingKey)}
                              download
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                              title="Download Answer Key PDF"
                            >
                              <Download size={13} />
                              <span>Key</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750/30 border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-400 text-xs">
                          <Clock size={14} className="text-slate-400 shrink-0" />
                          <span className="text-[11px]">Official answer key will be published once released.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Practice Paper as Interactive MCQs Button */}
                  {isPairedPaper && (
                    <div className="pt-2">
                      <Link
                        to={`/student/pyq?year=${item.exam_year || 2026}`}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PenTool size={13} />
                        <span>Practice This Paper as Interactive MCQs</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata Tag */}
                <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-750/30 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Official Verified Document</span>
                  </span>
                  <span>DDCET Portal</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-500">
            Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen PDF Preview Modal */}
      {previewPdfItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <FileText size={18} className="text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {previewPdfItem.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {previewPdfItem.exam_year ? `${previewPdfItem.exam_year} Examination Document` : 'DDCET Resource'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getDownloadUrl(previewPdfItem)}
                  download
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </a>

                <button
                  onClick={() => setPreviewPdfItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  aria-label="Close PDF Viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Preview */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950">
              <iframe
                src={getViewUrl(previewPdfItem)}
                title={previewPdfItem.title}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
