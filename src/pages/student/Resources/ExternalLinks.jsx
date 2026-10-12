import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../store/AuthContext';
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    } catch (e) {
      setError('Unable to load external study resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getDomain = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch (e) {
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
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Curated External Study Links</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Verified external references, university portals, syllabus guides, and third-party educational materials.
            </p>
          </div>
          <button
            onClick={fetchLinks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Clear External Integration Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Third-Party Destination Notice:</p>
            <p className="leading-relaxed">
              Clicking these links will direct you outside DDCET RankRise in a new browser tab. 
              External materials, quizzes, and forms are hosted independently by their respective providers. 
              Activities or test scores on external websites are not tracked within your RankRise score or mistake book.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or domain (e.g. google.com)..."
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {/* Subject Filter */}
          <select
            className="px-3 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-medium"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="px-3 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-medium"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="question_paper">Question Papers</option>
            <option value="answer_key">Answer Keys</option>
            <option value="syllabus">Syllabus</option>
            <option value="general">General Study</option>
          </select>

          {/* Year Filter */}
          {uniqueYears.length > 0 && (
            <select
              className="px-3 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-medium"
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
              className="px-3 py-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 space-y-3">
          <RefreshCw size={28} className="animate-spin mx-auto text-indigo-500" />
          <p className="font-semibold text-sm">Loading external reference links...</p>
        </div>
      ) : (
        /* Links Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map(linkItem => {
            const domain = getDomain(linkItem.external_url);
            const subject = subjects.find(s => s.id === linkItem.subject_id);

            return (
              <div
                key={linkItem.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Tag size={12} /> {getCategoryLabel(linkItem.type)}
                    </span>
                    {linkItem.exam_year && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-semibold flex items-center gap-1">
                        <Calendar size={11} /> {linkItem.exam_year}
                      </span>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {linkItem.title}
                    </h2>
                    {subject && (
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium flex items-center gap-1">
                        <BookOpen size={12} /> {subject.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {linkItem.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {linkItem.description}
                    </p>
                  )}
                </div>

                {/* Card Footer: Domain pill & Open button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[180px] bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                      <Globe size={13} className="text-slate-400 shrink-0" />
                      {domain}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Leaves App ↗</span>
                  </div>

                  <a
                    href={linkItem.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>Visit External Resource</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}

          {filteredLinks.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
              <Globe size={40} className="mx-auto opacity-30 text-indigo-400" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-200">No external links found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No external study resources match your active filters. Try resetting the filters or check back later!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
