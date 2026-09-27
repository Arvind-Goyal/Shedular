import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Flame, 
  RefreshCw, 
  PlusCircle, 
  Moon, 
  Sun, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

export default function Navbar() {
  const { 
    user, 
    scheduleData, 
    selectedDate, 
    setSelectedDate, 
    darkMode, 
    setDarkMode, 
    setIsQuickLogOpen, 
    setIsRecalculateModalOpen,
    notification
  } = useApp();

  const streak = scheduleData?.progress?.overall?.streak?.current || user?.streak?.current || 0;
  const status = scheduleData?.scheduleStatus?.status;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand title & Exam Goal */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold shadow-sm shadow-violet-500/20">
            CHSL
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
              SSC CHSL Maths Todo Planner
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Starts 28 Sep • End Sem Break: 4–27 Oct • Resumes 28 Oct
            </p>
          </div>
        </div>

        {/* Center/Status Pills */}
        <div className="hidden md:flex items-center gap-2">
          {/* Status pill */}
          {status === 'ahead' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ahead of Schedule
            </span>
          )}
          {status === 'behind' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" /> Schedule Needs Rebalancing
            </span>
          )}
          {status === 'on_track' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> On Track
            </span>
          )}

          {/* Streak pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streak} Day Streak</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Date Jumper */}
          <div className="relative hidden lg:flex items-center">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Quick Log button */}
          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Study</span>
          </button>

          {/* Recalculate Button */}
          <button
            onClick={() => setIsRecalculateModalOpen(true)}
            title="Recalculate Schedule"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className={`py-2 px-4 text-center text-xs font-medium border-t transition-all ${
          notification.type === 'error' 
            ? 'bg-rose-500 text-white border-rose-600'
            : notification.type === 'warning'
            ? 'bg-amber-500 text-white border-amber-600'
            : 'bg-violet-600 text-white border-violet-700'
        }`}>
          {notification.message}
        </div>
      )}
    </header>
  );
}
