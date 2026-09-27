import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Clock, 
  CalendarDays, 
  BookOpen, 
  BarChart3, 
  RotateCcw, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { scheduleData } = useApp();
  const overall = scheduleData?.progress?.overall;

  const navItems = [
    { to: '/', label: "Today's Todo Plan", icon: CalendarCheck },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/topics', label: 'Topics', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)] transition-colors">
      
      {/* Navigation links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Mini Progress Card in Sidebar Footer */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 border border-violet-100 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-violet-900 dark:text-violet-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Syllabus Progress
          </span>
          <span className="font-bold text-violet-700 dark:text-violet-400">
            {overall?.overallPercentage || 0}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-violet-200/60 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
          <div
            className="bg-violet-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${overall?.overallPercentage || 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{overall?.completedLectures || 0} / {overall?.totalLectures || 99} Lectures</span>
          <span>{overall?.daysRemaining || 0} days left</span>
        </div>
      </div>
    </aside>
  );
}
