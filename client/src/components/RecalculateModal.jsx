import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

export default function RecalculateModal() {
  const { isRecalculateModalOpen, setIsRecalculateModalOpen, recalculateSchedule, selectedDate } = useApp();
  const [fromDate, setFromDate] = useState(selectedDate);
  const [recalculating, setRecalculating] = useState(false);

  if (!isRecalculateModalOpen) return null;

  const handleConfirm = async () => {
    setRecalculating(true);
    try {
      await recalculateSchedule(fromDate);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Recalculate Study Schedule
            </h3>
          </div>
          <button
            onClick={() => setIsRecalculateModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 text-xs text-violet-900 dark:text-violet-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-violet-600 mt-0.5" />
            <span>
              This will rebalance all future uncompleted lectures and revision sessions evenly across remaining available study days while strictly preserving all your past completed work.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Rebalance Future Tasks Starting From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsRecalculateModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={recalculating}
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Confirm & Rebalance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
