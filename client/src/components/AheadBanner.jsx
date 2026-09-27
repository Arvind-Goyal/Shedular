import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AheadBanner() {
  const { scheduleData, optimizeSchedule, setIsRecalculateModalOpen } = useApp();
  const scheduleStatus = scheduleData?.scheduleStatus;

  if (!scheduleStatus) return null;

  // Ahead of schedule banner
  if (scheduleStatus.status === 'ahead') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-violet-500/10 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              🎉 You're ahead of schedule!
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              You completed extra lectures ahead of the plan! You can now relax your future workload or finish earlier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => optimizeSchedule('keep')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Keep Current Schedule
          </button>
          <button
            onClick={() => optimizeSchedule('reduce_hours')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            Optimize Schedule
          </button>
        </div>
      </div>
    );
  }

  // Behind schedule notification
  if (scheduleStatus.status === 'behind') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
              {scheduleStatus.behindLectures} Missed Lecture{scheduleStatus.behindLectures > 1 ? 's' : ''} Detected
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
              {scheduleStatus.message}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRecalculateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm flex-shrink-0"
        >
          <span>Auto-Rebalance Future Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
