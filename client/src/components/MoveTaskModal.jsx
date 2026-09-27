import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowRight, Calendar } from 'lucide-react';

export default function MoveTaskModal() {
  const { activeMoveTask, setActiveMoveTask, moveTask } = useApp();
  const [newDate, setNewDate] = useState(activeMoveTask?.date || '');
  const [moving, setMoving] = useState(false);

  if (!activeMoveTask) return null;

  const handleMove = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    setMoving(true);
    try {
      await moveTask(activeMoveTask._id, newDate);
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Move Task
            </h3>
          </div>
          <button
            onClick={() => setActiveMoveTask(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleMove} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Moving <span className="font-semibold text-slate-900 dark:text-white">"{activeMoveTask.title}"</span> from {activeMoveTask.date}.
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Select New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveMoveTask(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={moving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{moving ? 'Moving...' : 'Confirm Move'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
