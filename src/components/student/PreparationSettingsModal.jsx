import { useState, useEffect } from 'react';
import { 
  X, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, 
  History, Calendar, Target, BookOpen, Clock, ArrowRight, Sparkles, Layers 
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function PreparationSettingsModal({ isOpen, onClose, token, onRestartSuccess }) {
  const [loading, setLoading] = useState(true);
  const [cycleData, setCycleData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [restartReason, setRestartReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCycleData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/student/preparation/cycle`, { headers });
      if (res.ok) {
        const json = await res.json();
        setCycleData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to load preparation cycle info');
      }
    } catch (err) {
      console.error('Error fetching cycle info:', err);
      setError('Network error loading preparation settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
      setConfirmText('');
      setRestartReason('');
      setError('');
      setSuccessMsg('');
      fetchCycleData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCycle = cycleData?.current_cycle_number || 1;
  const cycles = cycleData?.cycles || [];
  const restartHistory = cycleData?.restart_history || [];

  const handleRestartSubmit = async () => {
    setActionLoading(true);
    setError('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/student/preparation/restart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: restartReason || 'Student self-restart' })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to restart preparation.');
      }

      setSuccessMsg(`🎉 Preparation successfully restarted! You are now on Cycle ${json.new_cycle_number}.`);
      setIsConfirming(false);
      
      // Notify parent to refresh stats
      if (onRestartSuccess) onRestartSuccess(json);

      // Trigger global update events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('rankrise_test_submitted'));
      }

      // Refresh local cycle info
      await fetchCycleData();
    } catch (err) {
      setError(err.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/60 shadow-2xs">
              <RotateCcw size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Preparation Settings & Cycles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your DDCET preparation lifecycle and restarts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent" />
              <p className="text-xs mt-2">Loading preparation details...</p>
            </div>
          ) : isConfirming ? (
            /* Confirmation Step */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm mb-1.5">
                  <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                  <span>Restart DDCET Preparation (Cycle {currentCycle} → Cycle {currentCycle + 1})</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Restarting begins a brand-new preparation cycle for your account. Please review what changes:
                </p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/80 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      🔄 What Resets for Cycle {currentCycle + 1}:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Syllabus topic completion resets to <strong>0%</strong> for fresh tracking.</li>
                      <li>Test completed indicators reset so you can re-attempt all subject & chapter tests fresh.</li>
                      <li>Active dashboard test counters and average scores reset for the new cycle.</li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      🛡️ What Remains Permanently Preserved:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-emerald-700 dark:text-emerald-400">
                      <li>All past test scores, detailed answer sheets, and test result history remain completely saved.</li>
                      <li>Analytics history and Mistake Book revisions are permanently kept.</li>
                      <li>Daily study streaks and longest streak record are <strong>100% preserved</strong>.</li>
                      <li>Your login password, mobile, email, and profile details remain unchanged.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Optional Reason Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for restarting (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Starting 2nd revision round, DDCET exam sprint..."
                  value={restartReason}
                  onChange={(e) => setRestartReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestartSubmit}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span>Starting Cycle {currentCycle + 1}...</span>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Confirm & Start Cycle {currentCycle + 1}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Main Overview Step */
            <div className="space-y-4">
              {/* Active Cycle Hero Box */}
              <div className="p-4 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-slate-850 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    C{currentCycle}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Preparation Cycle {currentCycle}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Active Cycle
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Started on {formatDate(cycleData?.active_cycle?.started_at)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsConfirming(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>Restart Preparation</span>
                </button>
              </div>

              {/* Information Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>How Preparation Cycles Work</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Whenever you feel the need to start afresh (e.g. after completing a syllabus revision or taking diagnostic tests), you can restart your preparation. A new cycle tracks fresh progress while keeping your complete test history, scores, and streak permanently intact.
                </p>
              </div>

              {/* Cycle & Restart History */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <History size={14} className="text-slate-500" />
                  <span>Cycle & Restart History ({cycles.length} Total)</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cycles.map((c) => {
                    const isCurrent = c.cycle_number === currentCycle;
                    return (
                      <div 
                        key={c.id || c.cycle_number}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isCurrent 
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60' 
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {c.cycle_number}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Cycle {c.cycle_number} {isCurrent ? '(Active)' : '(Archived)'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {formatDate(c.started_at)} {c.ended_at ? `– ${formatDate(c.ended_at)}` : '– Present'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {c.status || (isCurrent ? 'Active' : 'Archived')}
                          </span>
                          {c.snapshot_stats?.tests_completed_in_cycle !== undefined && (
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.snapshot_stats.tests_completed_in_cycle} tests completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit logs of restarts if any */}
              {restartHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-750">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Recent Restart Logs
                  </span>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {restartHistory.slice(0, 3).map((h, i) => (
                      <div key={h.id || i} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <span>Cycle {h.from_cycle} → Cycle {h.to_cycle} ({h.action_performed})</span>
                        <span className="text-slate-400 text-[10px]">{formatDate(h.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Current: <strong>Cycle {currentCycle}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
