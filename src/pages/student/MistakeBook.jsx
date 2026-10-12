import { useState, useEffect } from 'react';
import { getProgressStore, saveProgressStore } from '../../store/mockData';
import { AlertTriangle, Trash2, ArrowRight, BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default function MistakeBook() {
  const [mistakes, setMistakes] = useState([]);

  useEffect(() => {
    const store = getProgressStore();
    setMistakes(store.mistakes || []);
  }, []);

  const handleRemove = (qid) => {
    const store = getProgressStore();
    store.mistakes = store.mistakes.filter(m => m.qid !== qid);
    saveProgressStore(store);
    setMistakes(store.mistakes);
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 font-sans animate-fade-in">
      <div className="space-y-1">
        <div className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
          <AlertTriangle size={15} /> Error Diagnostics & Revision
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Mistake Notebook
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Every question you answered incorrectly during live mock tests is cataloged here for revision.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        {mistakes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Your Mistake Book is Empty!</h3>
            <p className="text-xs sm:text-sm max-w-sm mx-auto text-slate-500">
              Great job! Whenever you attempt a live assessment, questions requiring revision will be added here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {mistakes.map(m => (
              <div key={m.qid} className="p-4 sm:p-6 space-y-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-750/40 transition-colors">
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                      {m.topic || 'General Practice'}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {m.question}
                    </h2>
                  </div>

                  <button 
                    onClick={() => handleRemove(m.qid)}
                    className="self-end sm:self-auto p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
                    title="Remove from notebook"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Answers Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl p-3">
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <XCircle size={12} /> Marked Incorrectly
                    </div>
                    <div className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 font-medium">
                      {m.selected}
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
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
