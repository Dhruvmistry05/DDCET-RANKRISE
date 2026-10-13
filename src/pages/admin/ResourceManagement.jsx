import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { 
  UploadCloud, FileText, Trash2, Search, 
  Edit3, RefreshCw, CheckCircle2, XCircle, Link as LinkIcon, Eye, X, AlertCircle
} from 'lucide-react';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  // Filters and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Creation form state
  const [resourceSource, setResourceSource] = useState('file'); // 'file' | 'url'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'question_paper',
    exam_year: '',
    paper_id: '',
    external_url: '',
    subject_id: '',
    chapter_id: '',
    topic_id: '',
    display_order: 0,
    published: true
  });
  const [file, setFile] = useState(null);

  // Edit Modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Replace File Modal state
  const [replacingItem, setReplacingItem] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, subs, chaps, tops] = await Promise.all([
        fetch(`${API_URL}/api/resources`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(resData)) setResources(resData);
      if (Array.isArray(subs)) setSubjects(subs);
      if (Array.isArray(chaps)) setChapters(chaps);
      if (Array.isArray(tops)) setTopics(tops);
    } catch (e) {
      setError('Failed to load resources: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const questionPapers = useMemo(() => {
    return resources.filter(r => r.type === 'question_paper');
  }, [resources]);

  const uniqueYears = useMemo(() => {
    const years = new Set(resources.map(r => r.exam_year).filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      const matchesSearch = 
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.exam_year && String(item.exam_year).includes(searchQuery));

      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'published' && item.published) || 
        (filterStatus === 'draft' && !item.published);
      const matchesYear = filterYear === 'all' || String(item.exam_year) === filterYear;

      return matchesSearch && matchesType && matchesStatus && matchesYear;
    });
  }, [resources, searchQuery, filterType, filterStatus, filterYear]);

  // Handle Form Submission (Create Resource)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (resourceSource === 'file' && !file) {
      setError("Please select a PDF file to upload.");
      return;
    }
    if (resourceSource === 'url' && !formData.external_url.trim()) {
      setError("Please provide a valid external URL.");
      return;
    }

    setActionLoading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description || '');
    data.append('type', formData.type);
    if (formData.exam_year) data.append('exam_year', formData.exam_year);
    if (formData.paper_id) data.append('paper_id', formData.paper_id);
    if (formData.subject_id) data.append('subject_id', formData.subject_id);
    if (formData.chapter_id) data.append('chapter_id', formData.chapter_id);
    if (formData.topic_id) data.append('topic_id', formData.topic_id);
    data.append('display_order', formData.display_order || 0);
    data.append('published', formData.published);

    if (resourceSource === 'file' && file) {
      data.append('file', file);
    } else if (resourceSource === 'url') {
      data.append('external_url', formData.external_url.trim());
    }

    try {
      const res = await fetch(`${API_URL}/api/resources`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create resource');
      }

      setSuccess(`Resource "${formData.title}" created successfully!`);
      setFormData({
        title: '', description: '', type: 'question_paper',
        exam_year: '', paper_id: '', external_url: '',
        subject_id: '', chapter_id: '', topic_id: '', display_order: 0, published: true
      });
      setFile(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Publication status
  const handleTogglePublish = async (id, currentStatus) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/resources/${id}/publish`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle publication');
      setResources(prev => prev.map(r => r.id === id ? { ...r, published: !currentStatus } : r));
      setSuccess(`Publication status updated.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Edit Metadata Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setError(null);
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/resources/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update metadata');

      setSuccess(`Resource metadata updated successfully!`);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Replace File Submit
  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replacingItem || !replaceFile) return;
    setError(null);
    setActionLoading(true);

    const data = new FormData();
    data.append('file', replaceFile);

    try {
      const res = await fetch(`${API_URL}/api/resources/${replacingItem.id}/replace-file`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to replace file');

      setSuccess(`File for "${replacingItem.title}" replaced successfully!`);
      setReplacingItem(null);
      setReplaceFile(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Resource
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/resources/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete resource');
      setSuccess(`Resource "${title}" deleted successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'question_paper': return 'Question Paper';
      case 'answer_key': return 'Answer Key';
      case 'syllabus': return 'Official Syllabus';
      case 'general': return 'Study Resource';
      default: return type;
    }
  };

  const resolveResourceLink = (item) => {
    if (item.external_url) return item.external_url;
    if (!item.file_path) return '#';
    if (item.file_path.startsWith('http://') || item.file_path.startsWith('https://')) {
      return item.file_path; // Supabase public URL
    }
    return `${API_URL}${item.file_path}`; // Local server path
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Official Resources Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Upload, verify, publish, and manage past papers, answer keys, and study materials.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Create Resource Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud size={18} className="text-[#2563EB]" /> New Resource
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResourceSource('file')}
                className={`px-2.5 py-1 rounded-md transition ${resourceSource === 'file' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                PDF File
              </button>
              <button
                type="button"
                onClick={() => setResourceSource('url')}
                className={`px-2.5 py-1 rounded-md transition ${resourceSource === 'url' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              >
                External URL
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Title *</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-600 outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. DDCET 2024 Question Paper"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Type *</label>
                <select
                  className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs focus:border-blue-600 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value, paper_id: '' })}
                >
                  <option value="question_paper">Paper</option>
                  <option value="answer_key">Key</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Exam Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2099"
                  className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-blue-600"
                  value={formData.exam_year}
                  onChange={e => setFormData({ ...formData, exam_year: e.target.value })}
                  placeholder="2024"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Order</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-blue-600"
                  value={formData.display_order}
                  onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {formData.type === 'answer_key' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Linked Question Paper</label>
                <select
                  className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-blue-600"
                  value={formData.paper_id}
                  onChange={e => setFormData({ ...formData, paper_id: e.target.value })}
                >
                  <option value="">-- Independent / None --</option>
                  {questionPapers.map(p => (
                    <option key={p.id} value={p.id}>{p.title} {p.exam_year ? `(${p.exam_year})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Syllabus Node linkage */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</label>
                <select
                  className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700"
                  value={formData.subject_id}
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value, chapter_id: '', topic_id: '' })}
                >
                  <option value="">None</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Chapter</label>
                <select
                  className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700"
                  value={formData.chapter_id}
                  onChange={e => setFormData({ ...formData, chapter_id: e.target.value, topic_id: '' })}
                >
                  <option value="">None</option>
                  {chapters.filter(c => !formData.subject_id || String(c.subject_id) === String(formData.subject_id)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Topic</label>
                <select
                  className="w-full p-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700"
                  value={formData.topic_id}
                  onChange={e => setFormData({ ...formData, topic_id: e.target.value })}
                >
                  <option value="">None</option>
                  {topics.filter(t => !formData.chapter_id || String(t.chapter_id) === String(formData.chapter_id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Description (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600"
                rows="2"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary or details about this document..."
              />
            </div>

            {resourceSource === 'file' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">PDF File (Max 15MB) *</label>
                <input
                  id="file-upload"
                  required
                  type="file"
                  accept=".pdf,application/pdf"
                  className="w-full p-2 border border-dashed rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">External Web URL *</label>
                <input
                  required
                  type="url"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-600"
                  value={formData.external_url}
                  onChange={e => setFormData({ ...formData, external_url: e.target.value })}
                  placeholder="https://drive.google.com/... or https://..."
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded"
                checked={formData.published}
                onChange={e => setFormData({ ...formData, published: e.target.checked })}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Publish Immediately</span>
            </label>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {actionLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Uploading & Processing...
                </>
              ) : (
                'Create Resource'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Search, Filters, and Resources Table */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-600 outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search resources by title or year..."
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <select
                className="px-2.5 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="question_paper">Papers</option>
                <option value="answer_key">Keys</option>
                <option value="syllabus">Syllabus</option>
                <option value="general">General</option>
              </select>

              <select
                className="px-2.5 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {uniqueYears.length > 0 && (
                <select
                  className="px-2.5 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {uniqueYears.map(yr => (
                    <option key={yr} value={String(yr)}>{yr}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Resources Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredResources.length} of {resources.length} resources</span>
              {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterYear !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterStatus('all'); setFilterYear('all'); }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Mobile Cards List (< md) */}
            <div className="block md:hidden p-3 space-y-3">
              {filteredResources.map(item => {
                const link = resolveResourceLink(item);
                return (
                  <div key={item.id} className="p-4 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 font-bold text-slate-900 dark:text-white text-sm">
                        {item.external_url ? (
                          <LinkIcon size={16} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileText size={16} className="text-indigo-500 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <button
                        onClick={() => handleTogglePublish(item.id, item.published)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                          item.published 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {item.published ? 'Published' : 'Draft'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {getTypeName(item.type)}
                      </span>
                      {item.exam_year && (
                        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {item.exam_year}
                        </span>
                      )}
                      {item.type === 'answer_key' && item.paper_id && (
                        <span className="text-indigo-500 truncate max-w-[180px]">
                          Linked ID #{item.paper_id}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 p-1.5 hover:underline"
                      >
                        <Eye size={14} /> Open
                      </a>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditFormData({
                              title: item.title,
                              description: item.description || '',
                              type: item.type,
                              exam_year: item.exam_year || '',
                              paper_id: item.paper_id || '',
                              external_url: item.external_url || '',
                              display_order: item.display_order ?? 0,
                              subject_id: item.subject_id || '',
                              chapter_id: item.chapter_id || '',
                              topic_id: item.topic_id || '',
                              published: item.published
                            });
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                          title="Edit Metadata"
                        >
                          <Edit3 size={15} />
                        </button>

                        {!item.external_url && (
                          <button
                            onClick={() => {
                              setReplacingItem(item);
                              setReplaceFile(null);
                            }}
                            className="p-2 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                            title="Replace File"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                          title="Delete Resource"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredResources.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No resources match the selected criteria.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-[11px] font-bold tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Resource</th>
                    <th className="px-6 py-4">Type & Year</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredResources.map(item => {
                    const link = resolveResourceLink(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {item.external_url ? (
                              <LinkIcon size={16} className="text-amber-500 shrink-0" title="External URL Resource" />
                            ) : (
                              <FileText size={16} className="text-indigo-500 shrink-0" title="Hosted PDF Resource" />
                            )}
                            <span>{item.title}</span>
                          </div>
                          {item.type === 'answer_key' && item.paper_id && (
                            <div className="text-xs text-indigo-500 mt-0.5">
                              Linked Paper: {questionPapers.find(p => p.id === item.paper_id)?.title || `ID #${item.paper_id}`}
                            </div>
                          )}
                          {item.description && (
                            <div className="text-xs text-slate-400 truncate max-w-md mt-0.5">{item.description}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                            {getTypeName(item.type)}
                          </span>
                          {item.exam_year && (
                            <span className="ml-2 text-xs text-slate-500 font-semibold">{item.exam_year}</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleTogglePublish(item.id, item.published)}
                            title="Click to toggle publish status"
                            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 mx-auto ${
                              item.published
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                            }`}
                          >
                            {item.published ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {item.published ? 'Published' : 'Draft'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View / Download */}
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition"
                              title="View Document"
                            >
                              <Eye size={18} />
                            </a>

                            {/* Edit Metadata */}
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setEditFormData({
                                  title: item.title,
                                  description: item.description || '',
                                  type: item.type,
                                  exam_year: item.exam_year || '',
                                  paper_id: item.paper_id || '',
                                  external_url: item.external_url || '',
                                  display_order: item.display_order ?? 0,
                                  subject_id: item.subject_id || '',
                                  chapter_id: item.chapter_id || '',
                                  topic_id: item.topic_id || '',
                                  published: item.published
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                              title="Edit Metadata"
                            >
                              <Edit3 size={18} />
                            </button>

                            {/* Replace File */}
                            {!item.external_url && (
                              <button
                                onClick={() => {
                                  setReplacingItem(item);
                                  setReplaceFile(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                                title="Replace PDF File"
                              >
                                <RefreshCw size={18} />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                              title="Delete Resource"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredResources.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        <FileText size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No resources found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Metadata Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={16} className="text-blue-600" /> Edit Metadata
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <select
                    className="w-full px-2 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                  >
                    <option value="question_paper">Paper</option>
                    <option value="answer_key">Key</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Exam Year</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                    value={editFormData.exam_year}
                    onChange={e => setEditFormData({ ...editFormData, exam_year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                    value={editFormData.display_order ?? 0}
                    onChange={e => setEditFormData({ ...editFormData, display_order: e.target.value })}
                  />
                </div>
              </div>

              {editFormData.type === 'answer_key' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Linked Paper</label>
                  <select
                    className="w-full px-2.5 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                    value={editFormData.paper_id}
                    onChange={e => setEditFormData({ ...editFormData, paper_id: e.target.value })}
                  >
                    <option value="">-- Independent / None --</option>
                    {questionPapers.filter(p => p.id !== editingItem.id).map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingItem.external_url !== null && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">External URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                    value={editFormData.external_url}
                    onChange={e => setEditFormData({ ...editFormData, external_url: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-600"
                  rows="2"
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded"
                  checked={editFormData.published}
                  onChange={e => setEditFormData({ ...editFormData, published: e.target.checked })}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Published to Students</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 border rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg font-semibold text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Replace File Modal */}
      {replacingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-600" /> Replace PDF Document
              </h3>
              <button onClick={() => setReplacingItem(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <p className="text-xs text-slate-500">
              Replacing PDF file for: <strong className="text-slate-800 dark:text-white">{replacingItem.title}</strong>.
            </p>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">New PDF File (Max 15MB) *</label>
                <input
                  required
                  type="file"
                  accept=".pdf,application/pdf"
                  className="w-full p-2 border border-dashed rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 text-xs"
                  onChange={e => setReplaceFile(e.target.files[0])}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReplacingItem(null)}
                  className="px-3.5 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !replaceFile}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Replacing...' : 'Replace File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
