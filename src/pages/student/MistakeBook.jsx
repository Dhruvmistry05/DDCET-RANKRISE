import { useState, useEffect } from 'react';
import { getProgressStore, saveProgressStore } from '../../store/mockData';
import { AlertTriangle, Trash2, ArrowRight, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { logPortalActivity } from '../../utils/activityTracker';

export default function MistakeBook() {
  const [mistakes, setMistakes] = useState([]);

  useEffect(() => {
    const store = getProgressStore();
    setMistakes(store.mistakes || []);
    logPortalActivity({
      type: 'mistake_review',
      action_name: 'Reviewed Mistake Notebook'
    });
  }, []);

  const handleRemove = (qid) => {
    const store = getProgressStore();
    store.mistakes = store.mistakes.filter(m => m.qid !== qid);
    saveProgressStore(store);
    setMistakes(store.mistakes);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 font-sans">
      <div className="space-y-0.5">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Diagnostic Revision Log
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Weak Spot
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Every question answered incorrectly during live mock tests is cataloged here for focused revision.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
        {mistakes.length === 0 ? (
          <div className="p-10 text-center text-slate-500 flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Your Weak Spot is Empty</h3>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Whenever you attempt a live assessment, questions requiring revision will be added here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
            {mistakes.map(m => (
              <div key={m.qid} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      {m.topic || 'General Practice'}
                    </span>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                      {m.question}
                    </h2>
                  </div>

                  <button 
                    onClick={() => handleRemove(m.qid)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors shrink-0"
                    title="Remove from Weak Spot"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                
                {/* Answers Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg p-3">
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <XCircle size={12} /> Marked Answer
                    </div>
                    <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 font-medium">
                      {m.selected}
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3">
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Correct Solution
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-medium">
                      {m.correct}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
