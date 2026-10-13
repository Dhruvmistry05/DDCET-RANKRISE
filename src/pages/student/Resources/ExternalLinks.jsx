import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../store/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { 
  ExternalLink, Search, Globe, BookOpen, AlertCircle, 
  RefreshCw, Calendar, Tag, ShieldAlert
} from 'lucide-react';

export default function ExternalLinks() {
  const [links, setLinks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, subData] = await Promise.all([
        fetch(`${API_URL}/api/resources?publishedOnly=true&externalOnly=true`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(resData)) {
        setLinks(resData);
      } else {
        setLinks([]);
      }
      if (Array.isArray(subData)) {
        setSubjects(subData);
      }
    } catch {
      setError('Unable to load external study resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getDomain = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return 'external-site';
    }
  };

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'question_paper': return 'Past Paper Link';
      case 'answer_key': return 'Official Key Link';
      case 'syllabus': return 'Syllabus Link';
      case 'general': return 'Study Resource';
      default: return type || 'Reference Link';
    }
  };

  const uniqueYears = useMemo(() => {
    const years = new Set(links.map(l => l.exam_year).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const domainMatch = getDomain(item.external_url).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = !searchQuery.trim() || titleMatch || descMatch || domainMatch;

      const matchesSubject = selectedSubject === 'all' || String(item.subject_id) === selectedSubject;
      const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
      const matchesYear = selectedYear === 'all' || String(item.exam_year) === selectedYear;

      return matchesSearch && matchesSubject && matchesCategory && matchesYear;
    });
  }, [links, searchQuery, selectedSubject, selectedCategory, selectedYear]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Curated External Study Links</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verified external references, ACPC portal guides, official circulars, and educational tools.
            </p>
          </div>
          <button
            onClick={fetchLinks}
            disabled={loading}
            className="self-start sm:self-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Third-Party Destination Notice */}
        <div className="mt-4 p-3.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
          <ShieldAlert size={18} className="shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900 dark:text-white">External Destination Notice</p>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              External resources open in a new tab and are hosted independently by their respective institutions. Mock tests and activities completed externally are not scored in RankRise.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-600 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search external links by title or domain..."
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs">
          <select
            className="px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="question_paper">Question Papers</option>
            <option value="answer_key">Answer Keys</option>
            <option value="syllabus">Syllabus</option>
            <option value="general">General Study</option>
          </select>

          {uniqueYears.length > 0 && (
            <select
              className="px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
          )}

          {(searchQuery || selectedSubject !== 'all' || selectedCategory !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedCategory('all');
                setSelectedYear('all');
              }}
              className="col-span-2 sm:col-span-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center justify-center text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <RefreshCw size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="font-semibold text-xs">Loading study links...</p>
        </div>
      ) : (
        /* Links Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map(linkItem => {
            const domain = getDomain(linkItem.external_url);
            const subject = subjects.find(s => s.id === linkItem.subject_id);

            return (
              <div
                key={linkItem.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 rounded text-[11px] font-semibold flex items-center gap-1 border border-blue-100 dark:border-blue-900">
                      <Tag size={11} /> {getCategoryLabel(linkItem.type)}
                    </span>
                    {linkItem.exam_year && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded text-[11px] font-medium flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-700">
                        <Calendar size={11} /> {linkItem.exam_year}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition">
                      {linkItem.title}
                    </h2>
                    {subject && (
                      <p className="text-xs text-[#2563EB] dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
                        <BookOpen size={12} /> {subject.name}
                      </p>
                    )}
                  </div>

                  {linkItem.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                      {linkItem.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[180px] bg-[#F8FAFC] dark:bg-slate-850 px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-slate-800">
                      <Globe size={12} className="text-slate-400 shrink-0" />
                      {domain}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">External ↗</span>
                  </div>

                  <a
                    href={linkItem.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Visit Resource</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
              <Globe size={32} className="mx-auto opacity-30 text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No external links found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No external resources match the selected criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
