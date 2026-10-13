import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { 
  FileText, Download, Eye, Calendar, Search, 
  RefreshCw, Globe, BookOpen, AlertCircle, FileCheck, Book,
  ExternalLink, ChevronLeft, ChevronRight, X, Sparkles, 
  Layers, HardDrive
} from 'lucide-react';

export default function StudyMaterialLibrary({ defaultCategory = 'all' }) {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [activeCategory, setActiveCategory] = useState(defaultCategory); // 'all', 'syllabus', 'question_paper', 'answer_key', 'practice', 'external'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all'); // 'all', 'pdf', 'url'
  const [sortBy, setSortBy] = useState('order'); // 'order', 'year_desc', 'title_asc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Modal States
  const [previewPdfItem, setPreviewPdfItem] = useState(null);
  const [externalRedirectItem, setExternalRedirectItem] = useState(null);

  const { token } = useAuth();
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
        setResources(resData);
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

  // Extract clean domain from external URL
  const getDomain = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return 'external-site';
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
    if (item.external_url) return item.external_url;
    if (!item.file_path) return '';
    if (item.file_path.startsWith('http')) return item.file_path;
    return `${API_URL}${item.file_path}`;
  };

  // Resolve safe download URL
  const getDownloadUrl = (item) => {
    return `${API_URL}/api/resources/${item.id}/download`;
  };

  // Filter chapters based on selected subject
  const availableChapters = useMemo(() => {
    if (selectedSubject === 'all') return chapters;
    return chapters.filter(c => String(c.subject_id) === String(selectedSubject));
  }, [chapters, selectedSubject]);

  // Unique years available
  const availableYears = useMemo(() => {
    const years = resources.map(r => r.exam_year).filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [resources]);

  // Compute counts per category for the tabs
  const categoryCounts = useMemo(() => {
    const counts = {
      all: resources.length,
      syllabus: 0,
      question_paper: 0,
      answer_key: 0,
      practice: 0,
      external: 0
    };

    resources.forEach(r => {
      if (r.external_url) counts.external++;
      if (r.type === 'syllabus') counts.syllabus++;
      if (r.type === 'question_paper') counts.question_paper++;
      if (r.type === 'answer_key') counts.answer_key++;
      if (r.type === 'general' && !r.external_url) counts.practice++;
    });

    return counts;
  }, [resources]);

  // Filtered & Sorted resources
  const filteredResources = useMemo(() => {
    let result = resources.filter(item => {
      // Category Tab Filter
      if (activeCategory === 'syllabus' && item.type !== 'syllabus') return false;
      if (activeCategory === 'question_paper' && item.type !== 'question_paper') return false;
      if (activeCategory === 'answer_key' && item.type !== 'answer_key') return false;
      if (activeCategory === 'practice' && (item.type !== 'general' || item.external_url)) return false;
      if (activeCategory === 'external' && !item.external_url) return false;

      // Subject Filter
      if (selectedSubject !== 'all' && String(item.subject_id) !== String(selectedSubject)) return false;

      // Chapter Filter
      if (selectedChapter !== 'all' && String(item.chapter_id) !== String(selectedChapter)) return false;

      // Exam Year Filter
      if (selectedYear !== 'all' && String(item.exam_year) !== String(selectedYear)) return false;

      // Format Filter
      if (selectedFormat === 'pdf' && item.external_url) return false;
      if (selectedFormat === 'url' && !item.external_url) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const domainMatch = item.external_url ? getDomain(item.external_url).toLowerCase().includes(query) : false;
        if (!titleMatch && !descMatch && !domainMatch) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'year_desc') {
        return (b.exam_year || 0) - (a.exam_year || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // Default: display_order ASC, then exam_year DESC
      if ((a.display_order || 0) !== (b.display_order || 0)) {
        return (a.display_order || 0) - (b.display_order || 0);
      }
      return (b.exam_year || 0) - (a.exam_year || 0);
    });
  }, [resources, activeCategory, selectedSubject, selectedChapter, selectedYear, selectedFormat, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSubject, selectedChapter, selectedYear, selectedFormat, searchQuery, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResources, currentPage, itemsPerPage]);

  const resetAllFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedChapter('all');
    setSelectedYear('all');
    setSelectedFormat('all');
    setSortBy('order');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedSubject !== 'all' || selectedChapter !== 'all' || selectedYear !== 'all' || selectedFormat !== 'all' || activeCategory !== 'all';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Header Banner */}
      <div className="bg-[#1E3A8A] text-white border border-blue-900 rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-blue-100 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            <span>Official Examination Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            DDCET Study Material Library
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
            Access certified syllabus blueprints, archived previous year question papers, official answer keys, practice PDFs, and verified study portals in one place.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Materials', icon: Layers, count: categoryCounts.all },
          { key: 'question_paper', label: 'Previous Papers', icon: FileText, count: categoryCounts.question_paper },
          { key: 'answer_key', label: 'Answer Keys', icon: FileCheck, count: categoryCounts.answer_key },
          { key: 'syllabus', label: 'Syllabus', icon: Book, count: categoryCounts.syllabus },
          { key: 'practice', label: 'Practice PDFs', icon: BookOpen, count: categoryCounts.practice },
          { key: 'external', label: 'Study Links', icon: Globe, count: categoryCounts.external }
        ].map(tab => {
          const isActive = activeCategory === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-750 border border-[#E2E8F0] dark:border-slate-700'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-3">
        {/* Search input + Format selector */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, description or keyword..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-xs sm:text-sm focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#2563EB]"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF Documents</option>
              <option value="url">External Web Links</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="order">Featured Order</option>
              <option value="year_desc">Exam Year (Newest)</option>
              <option value="title_asc">Title (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Cascading metadata filters: Subject, Chapter, Year */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedChapter('all');
              }}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Chapter</label>
            <select
              value={selectedChapter}
              onChange={e => setSelectedChapter(e.target.value)}
              disabled={selectedSubject === 'all' && availableChapters.length === 0}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 disabled:opacity-50"
            >
              <option value="all">All Chapters</option>
              {availableChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Exam Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <option value="all">All Exam Years</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="w-full py-2 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center space-y-3">
          <AlertCircle size={36} className="mx-auto text-red-500" />
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Failed to load study materials</h3>
          <p className="text-sm text-red-600/80 dark:text-red-300 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Content Grid */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <b className="text-slate-800 dark:text-slate-200">
                {filteredResources.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredResources.length)}
              </b> of <b className="text-slate-800 dark:text-slate-200">{filteredResources.length}</b> verified materials
            </span>

            {totalPages > 1 && (
              <span className="font-medium">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResources.map(item => {
              const isExternal = Boolean(item.external_url);
              const downloadUrl = getDownloadUrl(item);
              const subjectName = subjects.find(s => s.id === item.subject_id)?.name;
              const chapterName = chapters.find(c => c.id === item.chapter_id)?.name;

              // Type badge styles
              let typeLabel = 'General Material';
              let badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
              let CardIcon = FileText;

              if (isExternal) {
                typeLabel = 'External Link';
                badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                CardIcon = Globe;
              } else if (item.type === 'question_paper') {
                typeLabel = 'Question Paper';
                badgeColor = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
                CardIcon = FileText;
              } else if (item.type === 'answer_key') {
                typeLabel = 'Answer Key';
                badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
                CardIcon = FileCheck;
              } else if (item.type === 'syllabus') {
                typeLabel = 'Official Syllabus';
                badgeColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800';
                CardIcon = Book;
              }

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        <CardIcon size={12} />
                        {typeLabel}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.exam_year && (
                          <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Calendar size={11} /> {item.exam_year}
                          </span>
                        )}

                        {formatFileSize(item.file_size) && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400" title="File Size">
                            <HardDrive size={11} /> {formatFileSize(item.file_size)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Subject / Chapter / Linked Paper tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subjectName && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {subjectName}
                        </span>
                      )}
                      {chapterName && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[160px]">
                          {chapterName}
                        </span>
                      )}
                      {isExternal && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 truncate max-w-[160px]">
                          {getDomain(item.external_url)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    {isExternal ? (
                      <button
                        onClick={() => setExternalRedirectItem(item)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-lg transition"
                      >
                        <ExternalLink size={14} /> Open Link
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setPreviewPdfItem(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-xs rounded-lg transition"
                        >
                          <Eye size={14} /> View
                        </button>

                        <a
                          href={downloadUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download size={14} /> Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredResources.length === 0 && (
            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No study materials match your filters</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Try searching with different terms or reset your filters to view all verified materials.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition ${
                    currentPage === num
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: In-Page Embedded PDF Previewer */}
      {previewPdfItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="text-indigo-600 shrink-0" size={24} />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {previewPdfItem.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {previewPdfItem.exam_year ? `Year ${previewPdfItem.exam_year} • ` : ''}
                    {formatFileSize(previewPdfItem.file_size) || 'PDF Document'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getDownloadUrl(previewPdfItem)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                >
                  <Download size={14} /> Download
                </a>

                <a
                  href={getViewUrl(previewPdfItem)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} />
                </a>

                <button
                  onClick={() => setPreviewPdfItem(null)}
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                  title="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Embedded PDF Viewer Body */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative">
              <object
                data={getViewUrl(previewPdfItem)}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <FileText size={48} className="text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">
                    Browser preview is not available for this document.
                  </p>
                  <a
                    href={getViewUrl(previewPdfItem)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: External Redirection Departure Notice */}
      {externalRedirectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Globe size={28} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Leaving DDCET RankRise
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              You are navigating to an external portal:
              <br />
              <b className="font-mono text-slate-800 dark:text-slate-200 break-all text-xs bg-slate-100 dark:bg-slate-700/60 px-2 py-1 rounded inline-block mt-1">
                {getDomain(externalRedirectItem.external_url)}
              </b>
            </p>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 text-left">
              RankRise progress tracking and mock tests are NOT integrated with third-party portals.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExternalRedirectItem(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              <a
                href={externalRedirectItem.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setExternalRedirectItem(null)}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5"
              >
                Continue <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
