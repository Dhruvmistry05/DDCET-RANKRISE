import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, X, BookOpen, Layers, FileText, CheckCircle2, 
  Clock, ArrowRight, CornerDownLeft, Sparkles, Filter, 
  ExternalLink, Loader2, HelpCircle, ChevronRight, PenTool
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function SearchBar({ isMobile = false, onCloseMobile = null }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'subjects' | 'chapters' | 'topics' | 'resources' | 'tests'
  const [results, setResults] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0, subjects: 0, chapters: 0, topics: 0, resources: 0, tests: 0 });
  const [popularSearches, setPopularSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Perform search against backend API
  const fetchSearchResults = useCallback(async (searchQuery, categoryFilter) => {
    setIsLoading(true);
    try {
      const catParam = categoryFilter !== 'all' ? `&category=${encodeURIComponent(categoryFilter)}` : '';
      const endpoint = `${API_BASE_URL}/api/search?q=${encodeURIComponent(searchQuery || '')}${catParam}&limit=25`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if (data.categoryCounts) {
          setCategoryCounts(data.categoryCounts);
        }
        if (data.popularSearches && Array.isArray(data.popularSearches)) {
          setPopularSearches(data.popularSearches);
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search request error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isOpen) return;

    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(query, activeCategory);
    }, query.trim() ? 180 : 0);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, activeCategory, isOpen, fetchSearchResults]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (onCloseMobile) onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onCloseMobile]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectResult(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      } else if (query.trim()) {
        // Fallback: Jump to study library or syllabus with search term
        navigate(`/student/resources?search=${encodeURIComponent(query.trim())}`);
        handleClose();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      if (onCloseMobile) onCloseMobile();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectResult = (item) => {
    if (!item) return;
    handleClose();
    if (item.url) {
      navigate(item.url);
    }
  };

  const handleSelectSuggestion = (suggestedQuery, category = 'all') => {
    setQuery(suggestedQuery);
    if (category && category !== 'all') {
      setActiveCategory(category);
    }
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    setActiveCategory('all');
    inputRef.current?.focus();
  };

  // Helper icons per category
  const getCategoryIcon = (category, type) => {
    switch (category) {
      case 'subjects':
        return <BookOpen size={16} className="text-blue-500 shrink-0" />;
      case 'chapters':
        return <Layers size={16} className="text-indigo-500 shrink-0" />;
      case 'topics':
        return <ChevronRight size={16} className="text-emerald-500 shrink-0" />;
      case 'resources':
        return <FileText size={16} className="text-amber-500 shrink-0" />;
      case 'tests':
        return <Clock size={16} className="text-purple-500 shrink-0" />;
      default:
        return <HelpCircle size={16} className="text-slate-400 shrink-0" />;
    }
  };

  // Categories for filter tabs
  const filterTabs = [
    { id: 'all', label: 'All', count: categoryCounts.all },
    { id: 'subjects', label: 'Subjects', count: categoryCounts.subjects },
    { id: 'chapters', label: 'Chapters', count: categoryCounts.chapters },
    { id: 'topics', label: 'Topics', count: categoryCounts.topics },
    { id: 'resources', label: 'Papers & Keys', count: categoryCounts.resources },
    { id: 'tests', label: 'Mock Tests', count: categoryCounts.tests }
  ];

  return (
    <div ref={containerRef} className={`relative ${isMobile ? 'w-full' : 'w-full max-w-sm lg:max-w-md'}`}>
      
      {/* 1. Main Search Bar Input Field */}
      <div 
        className={`flex items-center gap-2 bg-[#F8FAFC] dark:bg-slate-800 border rounded-lg px-3 py-1.5 transition-all ${
          isOpen 
            ? 'border-[#2563EB] bg-white dark:bg-slate-850 ring-2 ring-[#2563EB]/20 shadow-xs' 
            : 'border-[#E2E8F0] dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {isLoading ? (
          <Loader2 size={15} className="text-[#2563EB] animate-spin shrink-0" />
        ) : (
          <Search size={15} className="text-slate-400 shrink-0" />
        )}

        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search subjects, topics, or papers..." 
          className="bg-transparent border-none outline-none w-full text-xs sm:text-sm placeholder:text-slate-400 text-slate-900 dark:text-white"
          autoComplete="off"
          spellCheck="false"
        />

        {query && (
          <button 
            type="button"
            onClick={clearSearch}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Clear search"
            aria-label="Clear search input"
          >
            <X size={13} />
          </button>
        )}

        {!isMobile && !query && (
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shrink-0">
            <span className="text-[11px]">Ctrl</span> K
          </kbd>
        )}
      </div>

      {/* 2. Floating Search Results & Suggestions Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans max-h-[85vh] sm:max-h-[520px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ minWidth: isMobile ? '100%' : '380px' }}
        >
          
          {/* Category Filter Tabs Bar (Shown when search query exists or multiple items available) */}
          {(query.trim() || results.length > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 overflow-x-auto scrollbar-none text-xs shrink-0">
              {filterTabs.map(tab => {
                const isActive = activeCategory === tab.id;
                // Only show tabs that have results or if it is 'all'
                if (tab.id !== 'all' && query.trim() && tab.count === 0) return null;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-[#1E3A8A] text-white shadow-2xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && tab.count > 0 && (
                      <span className={`text-[10px] px-1 py-0.1 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-300'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body Content Container */}
          <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-slate-800/80">
            
            {/* A. Loading State */}
            {isLoading && results.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <Loader2 size={24} className="text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Searching DDCET database...</p>
              </div>
            )}

            {/* B. Empty Input State: Suggestions & Quick Navigation */}
            {!query.trim() && !isLoading && (
              <div className="p-4 space-y-4">
                
                {/* Popular Suggested Searches */}
                {popularSearches.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Popular Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSearches.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(s.query, s.category || 'all')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 text-left"
                        >
                          <Search size={11} className="text-slate-400" />
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core DDCET Subjects Quick Access */}
                {results.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} className="text-blue-500" />
                      <span>Core Subjects & Resources</span>
                    </div>
                    <div className="space-y-1">
                      {results.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectResult(item)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
                              {getCategoryIcon(item.category, item.badge)}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {item.title}
                              </span>
                              <span className="block text-[11px] text-slate-400 truncate">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                            {item.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* C. Results List (When Query Is Active) */}
            {query.trim() && results.length > 0 && (
              <div className="p-2 space-y-1">
                {results.map((item, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer group ${
                        isHighlighted 
                          ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          item.category === 'resources' 
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                            : item.category === 'subjects'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                            : item.category === 'chapters'
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                            : item.category === 'topics'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                            : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600'
                        }`}>
                          {getCategoryIcon(item.category, item.badge)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                              {item.categoryLabel}
                            </span>
                          </div>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Right Action Pill */}
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.practiceUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClose();
                              navigate(item.practiceUrl);
                            }}
                            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 rounded-md transition border border-blue-200 dark:border-blue-900/60"
                            title="Start Practice in Lab"
                          >
                            <PenTool size={10} />
                            <span>Practice</span>
                          </button>
                        )}
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* D. No Results Found State */}
            {query.trim() && !isLoading && results.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No results found for &ldquo;{query}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Check spelling, or try searching for core subjects like &ldquo;Mathematics&rdquo;, &ldquo;Physics&rdquo;, or &ldquo;2023 Question Paper&rdquo;.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Clear Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      navigate('/student/resources');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#1E3A8A]/90 transition"
                  >
                    Browse Library
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 3. Dropdown Footer with keyboard shortcuts & destination hints */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[10px]">↑</kbd>
                <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[10px]">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[10px]">↵</kbd>
                <span>Open</span>
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 rounded text-[10px]">ESC</kbd>
                <span>Close</span>
              </span>
            </div>

            {results.length > 0 && query.trim() && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate(`/student/resources?search=${encodeURIComponent(query.trim())}`);
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View all in Library</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
