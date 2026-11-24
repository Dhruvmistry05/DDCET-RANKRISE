import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, RotateCcw, Search, ShieldCheck, History, AlertTriangle, 
  CheckCircle2, ArrowLeft, RefreshCw, Calendar, Clock, Layers, Filter 
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { API_BASE_URL } from '../../config/api';

export default function StudentCyclesManagement() {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [restartReason, setRestartReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const effectiveToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const headers = effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/admin/students/cycles`, { headers });
      if (res.ok) {
        const json = await res.json();
        setStudents(json.students || []);
      }
    } catch (err) {
      console.error('Error fetching students cycle overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [effectiveToken]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.mobile || '').includes(q)
    );
  }, [students, searchQuery]);

  const handleAdminRestart = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setNotification({ type: '', message: '' });
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(effectiveToken ? { 'Authorization': `Bearer ${effectiveToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/restart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: restartReason || `Admin reset by ${user?.email}` })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to restart student preparation.');
      }

      setNotification({
        type: 'success',
        message: `Successfully restarted preparation for ${selectedStudent.name || selectedStudent.email}. Student is now on Cycle ${json.new_cycle_number}.`
      });

      setIsRestartModalOpen(false);
      setRestartReason('');
      await fetchStudents();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E3A8A] p-6 sm:p-8 rounded-xl text-white border border-blue-900 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-blue-100 text-xs font-semibold border border-white/15">
            <ShieldCheck size={14} className="text-blue-200" /> Administrative Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Student Preparation Cycles & Restarts
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
            Monitor student cycle numbers, restart histories, and safely reset student preparation cycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Admin Dashboard</span>
          </Link>
          <button
            onClick={fetchStudents}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification.message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification({ type: '', message: '' })} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Controls Strip: Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> Registered Candidates
        </div>
      </div>

      {/* Students Cycles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Active Cycle</th>
                <th className="px-4 py-3.5">Tests (Active / All-Time)</th>
                <th className="px-4 py-3.5">Restarts</th>
                <th className="px-4 py-3.5">Last Restart</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading student cycles...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No students match your query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.name || 'Student Candidate'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.email} {s.mobile ? `• ${s.mobile}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900 text-xs">
                        <Layers size={13} />
                        <span>Cycle {s.current_cycle_number}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{s.current_cycle_tests_count}</span>
                      <span className="text-slate-400 text-[11px]"> in cycle / </span>
                      <span className="font-bold">{s.all_time_tests_count}</span>
                      <span className="text-slate-400 text-[11px]"> total</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.total_restarts > 0 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {s.total_restarts} {s.total_restarts === 1 ? 'restart' : 'restarts'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                      {s.last_restart ? (
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatDate(s.last_restart.created_at)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            by {s.last_restart.performed_by_role}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Never restarted</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsHistoryModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
                      >
                        History
                      </button>

                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsRestartModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Restart</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Admin Restart Confirmation Dialog */}
      {isRestartModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Restart Preparation for {selectedStudent.name || selectedStudent.email}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current: Cycle {selectedStudent.current_cycle_number} → Next: Cycle {selectedStudent.current_cycle_number + 1}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <p>• Starts a new preparation cycle for this candidate.</p>
              <p>• Resets syllabus progress to 0% and test attempt flags for the new cycle.</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                • 100% Safe: All past attempts ({selectedStudent.all_time_tests_count}), scores, answer sheets, and daily study streaks are permanently preserved.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Administrative Reason / Ticket Note:
              </label>
              <input
                type="text"
                placeholder="e.g., Reset requested via student support, 2nd preparation round..."
                value={restartReason}
                onChange={(e) => setRestartReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRestartModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminRestart}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Restarting...' : `Confirm & Advance to Cycle ${selectedStudent.current_cycle_number + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Candidate Cycle History & Audit Log */}
      {isHistoryModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Cycle & Audit History: {selectedStudent.name || selectedStudent.email}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.email} • Current: Cycle {selectedStudent.current_cycle_number}
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Recorded Preparation Cycles
              </h4>
              <div className="space-y-2">
                {(selectedStudent.cycles || []).map((c) => (
                  <div key={c.id || c.cycle_number} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Cycle {c.cycle_number}</span>
                      <span className="text-slate-400 text-[11px] block">{formatDate(c.started_at)} – {c.ended_at ? formatDate(c.ended_at) : 'Active'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
