import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Shield, UserPlus, UserMinus, Users, Search, 
  CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Sparkles, Mail, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { getApiUrl } from '../../config/api';

export default function AdminManagement() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState({
    admins: [],
    students: [],
    currentCount: 1,
    maxAdmins: 3,
    canPromote: true
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [confirmDemoteId, setConfirmDemoteId] = useState(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(getApiUrl('/api/admin/system-admins'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch administrators (${res.status})`);
      }

      const resData = await res.json();
      setData(resData);
    } catch (err) {
      setError(err.message || 'Error loading administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const handlePromote = async (studentId) => {
    const idToPromote = studentId || selectedStudentId;
    if (!idToPromote) {
      setError('Please select a student to promote to Administrator.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(getApiUrl('/api/admin/promote-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: idToPromote })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to promote candidate.');
      }

      setSuccess(resData.message || 'Student successfully promoted to Administrator.');
      setSelectedStudentId('');
      setStudentSearch('');
      await fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to promote student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async (adminId) => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(getApiUrl('/api/admin/demote-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to demote administrator.');
      }

      setSuccess(resData.message || 'Administrator has been demoted to Student.');
      setConfirmDemoteId(null);
      await fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to demote administrator.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return data.students.slice(0, 15);
    const q = studentSearch.toLowerCase().trim();
    return data.students.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.branch && s.branch.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [data.students, studentSearch]);

  const superAdmin = data.admins.find(a => a.isSuperAdmin);
  const secondaryAdmins = data.admins.filter(a => !a.isSuperAdmin);
  const maxSlots = data.maxAdmins || 3;
  const emptySlotsCount = Math.max(0, maxSlots - data.admins.length);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Top Navigation & Header */}
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
                Security & Roles
              </span>
              <span className="text-xs text-slate-500 font-medium">Super Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Administrator Management
            </h1>
          </div>
        </div>

        <button
          onClick={fetchAdmins}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button 
            onClick={() => setError('')} 
            className="text-rose-500 hover:text-rose-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-medium">{success}</div>
          <button 
            onClick={() => setSuccess('')} 
            className="text-emerald-500 hover:text-emerald-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Capacity & Security Policy Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#1E3A8A]" />
            <h2 className="text-base font-bold text-slate-900">
              Three-Administrator Capacity Policy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            DDCET RankRise enforces a strict policy of at most <strong className="text-slate-900">3 administrators</strong>: exactly 1 permanent Super Administrator and up to 2 trusted Administrators. This limit is enforced both at the application level and via PostgreSQL database triggers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Admin Capacity
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1">
              <span>{data.currentCount}</span>
              <span className="text-sm font-medium text-slate-400">/ {data.maxAdmins} slots</span>
            </div>
          </div>
          <div className="sm:border-l sm:border-slate-300 sm:pl-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              data.canPromote 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${data.canPromote ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              {data.canPromote ? `${(data.maxAdmins || 3) - data.currentCount} Slot${((data.maxAdmins || 3) - data.currentCount) > 1 ? 's' : ''} Open` : 'Capacity Full (3/3)'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Administrators Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-slate-600" />
          Active Administrators ({data.admins.length} / {data.maxAdmins || 3})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Super Admin */}
          <div className="p-5 rounded-2xl bg-white border-2 border-blue-600/40 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#1E3A8A] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-xs">
              <ShieldCheck size={12} /> Super Admin
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {superAdmin?.name ? superAdmin.name[0] : 'SA'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {superAdmin?.name || 'Dhruv Mistry'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Mail size={12} className="text-slate-400" />
                    <span>{superAdmin?.email || 'dhruvmistry0511@gmail.com'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Privileges:</span>
                  <span className="font-semibold text-slate-700">Full System & Role Authority</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Permanent Primary Admin
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 italic">
                * Protected system account. Cannot be deleted or demoted.
              </span>
            </div>
          </div>

          {/* Cards for Trusted Secondary Administrators */}
          {secondaryAdmins.map((secAdmin) => (
            <div key={secAdmin.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                      {secAdmin.name ? secAdmin.name[0] : 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">
                          {secAdmin.name || 'Administrator'}
                        </h4>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                          Admin
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Mail size={12} className="text-slate-400" />
                        <span>{secAdmin.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch / College:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={`${secAdmin.branch || 'Engineering'} • ${secAdmin.college || ''}`}>
                      {secAdmin.branch || 'Engineering'} {secAdmin.college ? `• ${secAdmin.college}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Access:</span>
                    <span className="font-semibold text-slate-700">Tests, MCQs, Materials, PDFs</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                {confirmDemoteId === secAdmin.id ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-rose-800">
                      Are you sure you want to demote {secAdmin.name || secAdmin.email} back to Student?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDemote(secAdmin.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
                      >
                        {actionLoading ? 'Demoting...' : 'Confirm Demote'}
                      </button>
                      <button
                        onClick={() => setConfirmDemoteId(null)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDemoteId(secAdmin.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                  >
                    <UserMinus size={14} />
                    <span>Demote to Student</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Cards for Available Open Slots */}
          {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
            <div 
              key={`empty-slot-${slotIdx}`}
              className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <UserPlus size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Available Administrator Slot {emptySlotsCount > 1 ? `(#${data.admins.length + slotIdx + 1})` : ''}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Open administrator slot. You can promote a trusted registered student account to Administrator below.
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* Promotion Section */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#1E3A8A]" />
            <h3 className="text-base font-bold text-slate-900">
              Promote Registered Student to Admin
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Search for an existing registered student account to elevate their privileges to Administrator.
          </p>
        </div>

        {!data.canPromote ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div>
              <strong>Administrator limit reached (3/3).</strong> To promote a different student, first demote one of the current administrators using the demote button above.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Search filter input */}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search registered student by name or email..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Students list */}
            {data.students.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No registered student accounts found in the database.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No students match "{studentSearch}".
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentId === String(student.id);
                  return (
                    <div 
                      key={student.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name ? student.name[0] : 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {student.name || 'Candidate Student'}
                          </div>
                          <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                            <span>{student.email}</span>
                            {student.branch && (
                              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                                • {student.branch}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePromote(student.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 shrink-0 self-end sm:self-auto"
                      >
                        <Shield size={13} />
                        <span>Promote to Admin</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
