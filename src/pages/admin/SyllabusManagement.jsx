import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, CheckCircle, XCircle, BookOpen, Layers, Bookmark, 
  ArrowLeft, Search, RefreshCw, X, Check, Filter
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Link } from 'react-router-dom';

export default function SyllabusManagement() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);

  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'chapters' | 'topics'
  const [sectionFilter, setSectionFilter] = useState('ALL'); // 'ALL' | 'BE-01' | 'BE-02'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  const { token } = useAuth();
  const API_URL = API_BASE_URL;

  // Form states
  const initialForm = {
    name: '',
    section_code: 'BE-01',
    section_name: 'Basics of Science & Engineering',
    subject_id: '',
    chapter_id: '',
    chapter_number: '',
    weightage: '12%',
    description: '',
    display_order: 1,
    published: true
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, chapRes, topRes] = await Promise.all([
        fetch(`${API_URL}/api/subjects`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/api/chapters`).then(res => res.json()).catch(() => []),
        fetch(`${API_URL}/api/topics`).then(res => res.json()).catch(() => [])
      ]);
      if (Array.isArray(subRes)) setSubjects(subRes);
      if (Array.isArray(chapRes)) setChapters(chapRes);
      if (Array.isArray(topRes)) setTopics(topRes);
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Failed to load syllabus items.' });
    }
    setLoading(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    if (activeTab === 'subjects') {
      setFormData({
        name: item.name || '',
        section_code: item.section_code || 'BE-01',
        section_name: item.section_name || 'Basics of Science & Engineering',
        subject_id: '',
        chapter_id: '',
        chapter_number: '',
        weightage: '',
        description: '',
        display_order: item.display_order || 0,
        published: item.published !== false
      });
    } else if (activeTab === 'chapters') {
      setFormData({
        name: item.name || '',
        section_code: 'BE-01',
        section_name: '',
        subject_id: String(item.subject_id || ''),
        chapter_id: '',
        chapter_number: item.chapter_number || '',
        weightage: item.weightage || '',
        description: item.description || '',
        display_order: item.display_order || 0,
        published: item.published !== false
      });
    } else if (activeTab === 'topics') {
      setFormData({
        name: item.name || '',
        section_code: 'BE-01',
        section_name: '',
        subject_id: '',
        chapter_id: String(item.chapter_id || ''),
        chapter_number: '',
        weightage: '',
        description: item.description || '',
        display_order: item.display_order || 0,
        published: item.published !== false
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    const isEdit = !!editingId;
    const endpoint = isEdit ? `${API_URL}/api/${activeTab}/${editingId}` : `${API_URL}/api/${activeTab}`;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      name: formData.name,
      display_order: parseInt(formData.display_order) || 0,
      published: formData.published ? true : false
    };

    if (activeTab === 'subjects') {
      payload.section_code = formData.section_code;
      payload.section_name = formData.section_code === 'BE-02' 
        ? 'Aptitude Test (Mathematics & Soft Skill)' 
        : 'Basics of Science & Engineering';
    } else if (activeTab === 'chapters') {
      payload.subject_id = parseInt(formData.subject_id) || formData.subject_id;
      payload.chapter_number = parseInt(formData.chapter_number) || null;
      payload.weightage = formData.weightage || null;
      payload.description = formData.description || null;
    } else if (activeTab === 'topics') {
      payload.chapter_id = parseInt(formData.chapter_id) || formData.chapter_id;
      payload.description = formData.description || null;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to save ${activeTab.slice(0, -1)}`);
      }

      setStatusMessage({ 
        type: 'success', 
        text: `Successfully ${isEdit ? 'updated' : 'created'} ${activeTab.slice(0, -1)}.` 
      });
      cancelEdit();
      fetchData();
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Operation failed.' });
    }
  };

  const handleDelete = async (id) => {
    const itemType = activeTab.slice(0, -1);
    if (!window.confirm(`Are you sure you want to delete this ${itemType}? Child records will be affected.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to delete ${itemType}`);
      }

      setStatusMessage({ type: 'success', text: `Successfully deleted ${itemType}.` });
      fetchData();
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Failed to delete.' });
    }
  };

  // Filtered List based on tab, section filter and search
  const filteredList = useMemo(() => {
    let list = activeTab === 'subjects' ? subjects : activeTab === 'chapters' ? chapters : topics;

    // Filter by Section
    if (sectionFilter !== 'ALL') {
      if (activeTab === 'subjects') {
        list = list.filter(s => (s.section_code || '').toUpperCase() === sectionFilter);
      } else if (activeTab === 'chapters') {
        const matchingSubIds = new Set(subjects.filter(s => (s.section_code || '').toUpperCase() === sectionFilter).map(s => String(s.id)));
        list = list.filter(c => matchingSubIds.has(String(c.subject_id)));
      } else if (activeTab === 'topics') {
        const matchingSubIds = new Set(subjects.filter(s => (s.section_code || '').toUpperCase() === sectionFilter).map(s => String(s.id)));
        const matchingChapIds = new Set(chapters.filter(c => matchingSubIds.has(String(c.subject_id))).map(c => String(c.id)));
        list = list.filter(t => matchingChapIds.has(String(t.chapter_id)));
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const matchName = item.name && item.name.toLowerCase().includes(q);
        const matchWeightage = item.weightage && item.weightage.toLowerCase().includes(q);
        return matchName || matchWeightage;
      });
    }

    return list;
  }, [activeTab, subjects, chapters, topics, sectionFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                Curriculum Structure
              </span>
              <span className="text-xs text-slate-500 font-medium">GTU DDCET 2027 Blueprint</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Syllabus & Blueprint Management
            </h1>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between border shadow-xs ${
          statusMessage.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="font-medium">{statusMessage.text}</div>
          <button 
            onClick={() => setStatusMessage({ type: '', text: '' })}
            className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Section Switcher Tabs & Level Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Level Tabs (Subjects / Chapters / Topics) */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit border border-slate-200">
          {[
            { key: 'subjects', label: 'Subjects', icon: BookOpen, count: subjects.length },
            { key: 'chapters', label: 'Chapters', icon: Layers, count: chapters.length },
            { key: 'topics', label: 'Topics', icon: Bookmark, count: topics.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button 
                key={tab.key} 
                onClick={() => { setActiveTab(tab.key); cancelEdit(); }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition ${
                  isActive 
                    ? 'bg-[#1E3A8A] text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={13} /> Section:
          </span>
          {[
            { key: 'ALL', label: 'All Sections' },
            { key: 'BE-01', label: 'BE-01 Science' },
            { key: 'BE-02', label: 'BE-02 Aptitude' },
          ].map(sec => (
            <button
              key={sec.key}
              onClick={() => setSectionFilter(sec.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                sectionFilter === sec.key
                  ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form (Col 1) and Table (Col 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD / EDIT FORM COLUMN */}
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 h-fit space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {editingId ? <Edit2 size={16} className="text-blue-600" /> : <Plus size={16} className="text-[#1E3A8A]" />}
              <span>{editingId ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</span>
            </h2>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Subject Section Selection (When adding subject) */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Examination Section *
                </label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                  value={formData.section_code}
                  onChange={e => {
                    const code = e.target.value;
                    setFormData({
                      ...formData,
                      section_code: code,
                      section_name: code === 'BE-02' ? 'Aptitude Test (Mathematics & Soft Skill)' : 'Basics of Science & Engineering'
                    });
                  }}
                >
                  <option value="BE-01">BE-01: Basics of Science & Engineering (50 Qs • 100 Marks)</option>
                  <option value="BE-02">BE-02: Aptitude Test (Mathematics & Soft Skill) (50 Qs • 100 Marks)</option>
                </select>
              </div>
            )}

            {/* Parent Subject (When adding chapter) */}
            {activeTab === 'chapters' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Parent Subject *
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                  required 
                  value={formData.subject_id} 
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.section_code || 'BE-01'}] {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parent Chapter (When adding topic) */}
            {activeTab === 'topics' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Parent Chapter *
                </label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                  required 
                  value={formData.chapter_id} 
                  onChange={e => setFormData({ ...formData, chapter_id: e.target.value })}
                >
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => {
                    const pSub = subjects.find(s => String(s.id) === String(c.subject_id));
                    return (
                      <option key={c.id} value={c.id}>
                        {pSub ? `[${pSub.name}] ` : ''}Unit {c.chapter_number || ''}: {c.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Unit Number & Weightage (When adding chapter) */}
            {activeTab === 'chapters' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Unit Number #
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1"
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                    value={formData.chapter_number}
                    onChange={e => setFormData({ ...formData, chapter_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Weightage *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12%"
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition"
                    value={formData.weightage}
                    onChange={e => setFormData({ ...formData, weightage: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Name / Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {activeTab === 'topics' ? 'Topic / Important Point' : `${activeTab.slice(0, -1)} Name`} *
              </label>
              <input 
                type="text" 
                required 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder={`Enter ${activeTab.slice(0, -1)} title...`}
              />
            </div>

            {/* Description (Chapters & Topics) */}
            {activeTab !== 'subjects' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Context (Optional)
                </label>
                <textarea 
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                  rows="2"
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Optional explanatory notes..."
                />
              </div>
            )}

            {/* Display Order */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Display Order
              </label>
              <input 
                type="number" 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm outline-none focus:border-blue-600 transition" 
                value={formData.display_order} 
                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} 
              />
            </div>

            {/* Published Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded" 
                checked={formData.published} 
                onChange={e => setFormData({ ...formData, published: e.target.checked })} 
              />
              <span className="text-xs font-semibold text-slate-700">Published in Student Syllabus</span>
            </label>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              <span>{editingId ? 'Update' : 'Save'} {activeTab.slice(0, -1)}</span>
            </button>
          </form>
        </div>

        {/* LIST / TABLE COLUMN */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Search bar for items */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-600 transition"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
              Loading syllabus catalog...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
              No {activeTab} match your current filter.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
              {filteredList.map((item, idx) => {
                const parentSub = activeTab === 'chapters' 
                  ? subjects.find(s => String(s.id) === String(item.subject_id)) 
                  : null;
                const parentChap = activeTab === 'topics' 
                  ? chapters.find(c => String(c.id) === String(item.chapter_id)) 
                  : null;

                return (
                  <div 
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {item.chapter_number ? String(item.chapter_number).padStart(2, '0') : String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {item.name}
                          </h4>
                          {item.weightage && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] border border-blue-200">
                              {item.weightage}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                            item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {item.published ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          {activeTab === 'subjects' && item.section_code && (
                            <span className="font-semibold text-[#1E3A8A] bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                              {item.section_code}
                            </span>
                          )}
                          {parentSub && (
                            <span>Subject: <strong className="text-slate-700">{parentSub.name}</strong></span>
                          )}
                          {parentChap && (
                            <span>Chapter: <strong className="text-slate-700">{parentChap.name}</strong></span>
                          )}
                          <span>Order: {item.display_order || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
