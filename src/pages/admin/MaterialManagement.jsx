import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { 
  FileText, Trash2, ExternalLink, Plus, BookOpen, Layers, 
  Video, Edit3, Eye, Download, CheckCircle, AlertCircle, X, Search, Filter 
} from 'lucide-react';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  const [formData, setFormData] = useState({
    title: '',
    type: 'pdf',
    description: '',
    reference_url: '',
    subject_id: '',
    chapter_id: '',
    topic_id: '',
    published: true
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Filters for materials table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mat, sub, chap, top] = await Promise.all([
        fetch(`${API_URL}/api/materials`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/subjects`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(mat)) setMaterials(mat);
      if (Array.isArray(sub)) setSubjects(sub);
      if (Array.isArray(chap)) setChapters(chap);
      if (Array.isArray(top)) setTopics(top);
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      type: item.type || (item.file_path ? 'pdf' : 'link'),
      description: item.description || '',
      reference_url: item.reference_url || '',
      subject_id: item.subject_id ? String(item.subject_id) : '',
      chapter_id: item.chapter_id ? String(item.chapter_id) : '',
      topic_id: item.topic_id ? String(item.topic_id) : '',
      published: item.published !== false
    });
    setFile(null);
    setStatusMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      type: 'pdf',
      description: '',
      reference_url: '',
      subject_id: '',
      chapter_id: '',
      topic_id: '',
      published: true
    });
    setFile(null);
    setStatusMessage({ type: '', text: '' });
  };

  const togglePublish = async (item) => {
    try {
      const newStatus = !item.published;
      const res = await fetch(`${API_URL}/api/materials/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ published: newStatus })
      });
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `"${item.title}" is now ${newStatus ? 'Published' : 'Draft (Unpublished)'}.`
        });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to update status.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error toggling publish status.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!formData.title.trim()) {
      setStatusMessage({ type: 'error', text: 'Document title is required.' });
      return;
    }
    if (!formData.subject_id) {
      setStatusMessage({ type: 'error', text: 'Please select a Subject.' });
      return;
    }
    if (formData.type === 'pdf') {
      if (!formData.chapter_id) {
        setStatusMessage({ type: 'error', text: 'Please select a Chapter for this chapter PDF note.' });
        return;
      }
      if (!editingId && !file) {
        setStatusMessage({ type: 'error', text: 'Please select a PDF file to upload.' });
        return;
      }
      if (file) {
        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        if (!isPdf) {
          setStatusMessage({ type: 'error', text: 'Only PDF documents (.pdf) are allowed.' });
          return;
        }
        if (file.size > 25 * 1024 * 1024) {
          setStatusMessage({ type: 'error', text: 'File size exceeds limit: PDF must be 25MB or less.' });
          return;
        }
      }
    } else {
      if (!formData.reference_url.trim()) {
        setStatusMessage({ type: 'error', text: 'Please provide an external URL for this resource.' });
        return;
      }
    }

    setLoading(true);
    const data = new FormData();
    const cleanFormData = { ...formData };
    if (cleanFormData.reference_url) {
      const match = cleanFormData.reference_url.match(/(https?:\/\/[^\s]+)/i);
      cleanFormData.reference_url = match ? match[1].trim() : cleanFormData.reference_url.trim();
    }

    Object.keys(cleanFormData).forEach(key => {
      if (cleanFormData[key] !== null && cleanFormData[key] !== undefined) {
        data.append(key, cleanFormData[key]);
      }
    });
    if (file) data.append('file', file);

    const isEdit = !!editingId;
    const url = isEdit ? `${API_URL}/api/materials/${editingId}` : `${API_URL}/api/materials`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save material.');
      }
      setStatusMessage({
        type: 'success',
        text: isEdit ? 'Study material updated successfully!' : 'Chapter PDF note uploaded and saved successfully!'
      });
      setFormData({
        title: '',
        type: 'pdf',
        description: '',
        reference_url: '',
        subject_id: formData.subject_id,
        chapter_id: formData.chapter_id,
        topic_id: '',
        published: true
      });
      setFile(null);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study material? The attached file will also be removed from storage.")) return;
    try {
      const res = await fetch(`${API_URL}/api/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Material deleted successfully.' });
        if (editingId === id) cancelEdit();
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to delete material.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error deleting material.' });
    }
  };

  // Filtered materials for table display
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      if (filterSubjectId !== 'ALL' && String(item.subject_id) !== String(filterSubjectId)) {
        return false;
      }
      if (filterType !== 'ALL') {
        if (filterType === 'pdf' && !item.file_path && item.type !== 'pdf') return false;
        if (filterType === 'video' && item.type !== 'video' && (!item.reference_url || !/youtube|youtu\.be|vimeo/i.test(item.reference_url))) return false;
      }
      if (filterStatus !== 'ALL') {
        const isPub = filterStatus === 'published';
        if (Boolean(item.published) !== isPub) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title && item.title.toLowerCase().includes(q);
        const matchDesc = item.description && item.description.toLowerCase().includes(q);
        return matchTitle || matchDesc;
      }
      return true;
    });
  }, [materials, filterSubjectId, filterType, filterStatus, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#1E3A8A] rounded-md text-xs font-semibold mb-1.5 border border-blue-200">
            <BookOpen size={13} className="text-[#2563EB]" />
            <span>Curriculum Resource Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Chapter PDF Notes & Materials Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Upload chapter-wise revision sheets, formula guides, and video tutorial links for students.
          </p>
        </div>
      </div>

      {/* Global Status Message Banner */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            {statusMessage.type === 'success' ? (
              <CheckCircle size={17} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={17} className="text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage({ type: '', text: '' })} 
            className="p-1 hover:opacity-75 transition"
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ADD / EDIT MATERIAL FORM */}
        <div className="xl:col-span-1 bg-white p-5 rounded-xl shadow-xs border border-slate-200 h-fit space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 size={17} className="text-[#1E3A8A]" />
                  <span>Edit Material</span>
                </>
              ) : (
                <>
                  <Plus size={17} className="text-[#2563EB]" />
                  <span>Upload Chapter Material</span>
                </>
              )}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Document Title *
              </label>
              <input 
                required 
                type="text" 
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Unit 01 - Matrix Revision & Formula Sheet" 
              />
            </div>

            {/* Format & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Format *
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition font-medium" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="pdf">📄 Chapter PDF Note</option>
                  <option value="video">📹 Video Tutorial</option>
                  <option value="link">🔗 Web Reference Link</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject *
                </label>
                <select 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition font-medium" 
                  value={formData.subject_id} 
                  onChange={e => setFormData({...formData, subject_id: e.target.value, chapter_id: '', topic_id: ''})}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Chapter & Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Chapter {formData.type === 'pdf' ? '*' : '(Optional)'}
                </label>
                <select 
                  required={formData.type === 'pdf'}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition font-medium" 
                  value={formData.chapter_id} 
                  onChange={e => setFormData({...formData, chapter_id: e.target.value, topic_id: ''})}
                >
                  <option value="">Select Chapter</option>
                  {chapters
                    .filter(c => !formData.subject_id || String(c.subject_id) === String(formData.subject_id))
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.chapter_number ? `${String(c.chapter_number).padStart(2, '0')}. ` : ''}{c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Topic (Optional)
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={formData.topic_id} 
                  onChange={e => setFormData({...formData, topic_id: e.target.value})}
                >
                  <option value="">None (Chapter-Level Note)</option>
                  {topics
                    .filter(t => !formData.chapter_id || String(t.chapter_id) === String(formData.chapter_id))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea 
                rows="2"
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition leading-relaxed resize-none" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Brief summary of topics covered in this PDF note..."
              />
            </div>

            {/* File upload for PDF or URL input for Video/Link */}
            {formData.type === 'pdf' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    PDF Document File {editingId ? '(Optional if keeping current)' : '*'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Max 25MB</span>
                </div>
                
                <input 
                  required={!editingId}
                  type="file" 
                  accept=".pdf,application/pdf" 
                  className="w-full p-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" 
                  onChange={e => setFile(e.target.files[0] || null)} 
                />

                {editingId && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Leave file empty to preserve existing uploaded PDF document.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  External URL / YouTube Link *
                </label>
                <input 
                  required 
                  type="url" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  value={formData.reference_url} 
                  onChange={e => setFormData({...formData, reference_url: e.target.value})} 
                  placeholder="https://youtu.be/..." 
                />
              </div>
            )}

            {/* Publish Toggle Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                checked={formData.published} 
                onChange={e => setFormData({...formData, published: e.target.checked})} 
              />
              <span className="text-xs font-semibold text-slate-800">
                Publish Immediately (Visible to students)
              </span>
            </label>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Material...</span>
                  </>
                ) : editingId ? (
                  <>
                    <CheckCircle size={15} />
                    <span>Update Material</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Save & Publish Material</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* MATERIALS LIST COLUMN */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search materials by title or topic..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-600 transition"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Subject Filter */}
              <select
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {/* Format Filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Formats</option>
                <option value="pdf">PDF Notes</option>
                <option value="video">Videos</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Document Title</th>
                  <th className="px-5 py-3">Subject & Chapter</th>
                  <th className="px-5 py-3">Resource File / Link</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map(item => {
                  const subjectName = subjects.find(s => String(s.id) === String(item.subject_id))?.name || 'General';
                  const chapterObj = chapters.find(c => String(c.id) === String(item.chapter_id));
                  const chapterName = chapterObj?.name || 'No Chapter';
                  const topicName = topics.find(t => String(t.id) === String(item.topic_id))?.name;
                  const isPdf = item.file_path || item.type === 'pdf';
                  const isVideo = item.type === 'video' || (item.reference_url && /youtube|youtu\.be|vimeo/i.test(item.reference_url));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Title & Description */}
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {isPdf ? (
                            <FileText size={15} className="text-blue-600 shrink-0" />
                          ) : (
                            <Video size={15} className="text-rose-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-[220px]">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Location: Subject & Chapter */}
                      <td className="px-5 py-3 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800">{subjectName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {chapterName}
                        </div>
                        <div className="mt-0.5">
                          {topicName ? (
                            <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded truncate max-w-[160px]">
                              Topic: {topicName}
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              Chapter PDF Note
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Resource Link / File */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {item.file_path && (
                            <>
                              <a 
                                href={item.file_path.startsWith('http') ? item.file_path : `${API_URL}${item.file_path}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                title="Open PDF in new tab"
                              >
                                <Eye size={12}/> View
                              </a>
                              <span className="text-slate-300">•</span>
                              <a 
                                href={`${API_URL}/api/materials/${item.id}/download`} 
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                                title="Download PDF document"
                              >
                                <Download size={12}/> Download
                              </a>
                            </>
                          )}
                          {item.reference_url && (
                            <a 
                              href={item.reference_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={isVideo ? "inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline" : "inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"}
                              title="Open external link"
                            >
                              {isVideo ? <Video size={12}/> : <ExternalLink size={12}/>}
                              <span>{isVideo ? 'Watch Video' : 'Link'}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Published Status Toggle */}
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePublish(item)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition cursor-pointer border ${
                            item.published 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle Published / Draft status"
                        >
                          {item.published ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => startEdit(item)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Material"
                          >
                            <Edit3 size={15}/>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Material"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-500 text-xs">
                      No materials found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredMaterials.map(item => {
              const subjectName = subjects.find(s => String(s.id) === String(item.subject_id))?.name || 'General';
              const chapterObj = chapters.find(c => String(c.id) === String(item.chapter_id));
              const chapterName = chapterObj?.name || 'No Chapter';
              const isPdf = item.file_path || item.type === 'pdf';
              const isVideo = item.type === 'video' || (item.reference_url && /youtube|youtu\.be|vimeo/i.test(item.reference_url));

              return (
                <div 
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPdf ? <FileText size={16} className="text-blue-600 shrink-0" /> : <Video size={16} className="text-rose-600 shrink-0" />}
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {item.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => togglePublish(item)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        item.published 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.published ? 'Published' : 'Draft'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{subjectName}</span>
                    <span> • {chapterName}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      {item.file_path && (
                        <>
                          <a 
                            href={item.file_path.startsWith('http') ? item.file_path : `${API_URL}${item.file_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 font-semibold text-xs flex items-center gap-1 hover:underline"
                          >
                            <Eye size={12}/> View
                          </a>
                          <a 
                            href={`${API_URL}/api/materials/${item.id}/download`}
                            className="text-slate-600 font-semibold text-xs flex items-center gap-1 hover:underline"
                          >
                            <Download size={12}/> Download
                          </a>
                        </>
                      )}
                      {item.reference_url && (
                        <a 
                          href={item.reference_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={isVideo ? "text-rose-600 font-semibold text-xs flex items-center gap-1 hover:underline" : "text-blue-600 font-semibold text-xs flex items-center gap-1 hover:underline"}
                        >
                          {isVideo ? <Video size={13}/> : <ExternalLink size={13}/>}
                          <span>{isVideo ? 'Watch Video' : 'Open Link'}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEdit(item)} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Edit3 size={15}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMaterials.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                No materials found matching your filters.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
