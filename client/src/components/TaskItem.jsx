import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, 
  Clock, 
  MoreVertical, 
  Edit3, 
  ArrowRight, 
  SkipForward, 
  Trash2,
  BookOpen,
  RotateCw,
  Target,
  FileQuestion,
  Award
} from 'lucide-react';

export default function TaskItem({ task, onToggle, hideTiming = false }) {
  const { toggleTask, skipTask, setActiveEditTask, setActiveMoveTask } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggle = onToggle 
    ? () => onToggle(task._id, task.completed) 
    : () => toggleTask(task._id, task.completed);

  // Format minutes into clean text like "1h 30m" or "30m"
  const formatDuration = (min) => {
    if (!min) return '30m';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'lecture':
        return { 
          label: task.lectureNumber ? `Lecture ${task.lectureNumber}` : 'Lecture', 
          icon: BookOpen, 
          bg: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border-violet-200 dark:border-violet-700 font-bold' 
        };
      case 'revision':
        return { 
          label: '⚡ Revision', 
          icon: RotateCw, 
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200 dark:border-blue-700 font-bold' 
        };
      case 'practice':
        return { 
          label: '🎯 Practice', 
          icon: Target, 
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700 font-bold' 
        };
      case 'pyq':
        return { 
          label: '📝 PYQ Drill', 
          icon: FileQuestion, 
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-700 font-bold' 
        };
      case 'mock_test':
        return { 
          label: '🏆 Mock Test', 
          icon: Award, 
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200 dark:border-purple-700 font-bold' 
        };
      default:
        return { 
          label: 'Study', 
          icon: BookOpen, 
          bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' 
        };
    }
  };

  const badge = getActivityBadge(task.type);
  const BadgeIcon = badge.icon;

  return (
    <div
      className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
          : task.skipped
          ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 line-through text-slate-400'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-700'
      }`}
    >
      {/* Left: Checkbox + Title + Meta */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        
        {/* Custom rounded checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-violet-500 bg-white dark:bg-slate-800'
          }`}
          title={task.completed ? "Mark incomplete" : "Mark completed"}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Activity badge (Lecture No. / Revision) */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs border ${badge.bg}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>

            {/* Topic Badge */}
            {task.topicName && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[160px]">
                {task.topicName}
              </span>
            )}

            {task.isManual && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                Manual
              </span>
            )}
          </div>

          <h4
            className={`text-sm font-semibold mt-1 truncate ${
              task.completed
                ? 'text-slate-500 dark:text-slate-400 line-through'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {task.title}
          </h4>

          {/* Timing details: Only show when NOT hideTiming */}
          {!hideTiming ? (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span>{task.timeSlot || (task.lectureNumber % 2 === 1 ? '09:00 AM – 10:30 AM' : '05:00 PM – 06:30 PM')}</span>
              </span>

              {task.slotName && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {task.slotName}
                </span>
              )}

              <span>•</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{formatDuration(task.durationMinutes)}</span>
              {task.notes && (
                <>
                  <span>•</span>
                  <span className="truncate italic text-slate-400">"{task.notes}"</span>
                </>
              )}
            </div>
          ) : (
            task.notes && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate">
                "{task.notes}"
              </p>
            )
          )}
        </div>
      </div>

      {/* Right: Actions menu */}
      <div className="relative ml-2 flex items-center gap-1">
        {/* Fast Action Buttons */}
        {!task.completed && !task.skipped && (
          <button
            onClick={() => skipTask(task._id)}
            title="Skip Task"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs hidden sm:flex items-center gap-1 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="text-[11px]">Skip</span>
          </button>
        )}

        {/* Dropdown Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 text-xs">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveEditTask(task);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveMoveTask(task);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Move Date
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    skipTask(task._id);
                  }}
                  className="w-full text-left px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
