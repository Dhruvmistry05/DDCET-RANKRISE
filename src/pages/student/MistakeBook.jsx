import { useState, useEffect } from 'react';
import { getProgressStore, saveProgressStore } from '../../store/mockData';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

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
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="text-primary font-bold text-sm tracking-wider uppercase mb-1">Learning from mistakes</div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Mistake Book</h1>
          <p className="text-slate-500 mt-2">Every wrong practice answer is saved here for review.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {mistakes.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <AlertTriangle size={48} className="mb-4 text-slate-300" />
              <p>No mistakes yet. Start practice and your incorrect answers will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {mistakes.map(m => (
                <div key={m.qid} className="p-6 flex items-start justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{m.question}</h3>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">{m.topic}</div>
                    
                    <div className="flex gap-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 flex-1">
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold mb-1 uppercase tracking-wide">Your Answer</div>
                        <div className="text-red-800 dark:text-red-300 font-medium">{m.selected}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-lg p-3 flex-1">
                        <div className="text-xs text-green-600 dark:text-green-400 font-bold mb-1 uppercase tracking-wide">Correct Answer</div>
                        <div className="text-green-800 dark:text-green-300 font-medium">{m.correct}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    <button className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      Review <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => handleRemove(m.qid)}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
