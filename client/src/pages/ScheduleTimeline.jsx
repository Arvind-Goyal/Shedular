import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  BookOpen, 
  RotateCw, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import TaskItem from '../components/TaskItem';

export default function ScheduleTimeline() {
  const { scheduleData, selectedDate, setSelectedDate } = useApp();
  const tasksByDate = scheduleData?.tasksByDate || {};

  const [filterType, setFilterType] = useState('all'); // 'all', 'lecture', 'revision', 'pending'
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all distinct dates in ascending order
  const allDates = Object.keys(tasksByDate).sort();

  // Filter dates and tasks
  const filteredTimeline = allDates.map(date => {
    let dayTasks = tasksByDate[date] || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      dayTasks = dayTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(term)) ||
        (t.topicName && t.topicName.toLowerCase().includes(term))
      );
    }

    if (filterType === 'lecture') {
      dayTasks = dayTasks.filter(t => t.type === 'lecture');
    } else if (filterType === 'revision') {
      dayTasks = dayTasks.filter(t => t.type === 'revision' || t.type === 'pyq');
    } else if (filterType === 'pending') {
      dayTasks = dayTasks.filter(t => !t.completed);
    }

    const totalPlanned = dayTasks.reduce((s, t) => s + (t.durationMinutes || 0), 0);
    const totalCompleted = dayTasks.filter(t => t.completed).reduce((s, t) => s + (t.durationMinutes || 0), 0);

    return {
      date,
      tasks: dayTasks,
      totalPlanned,
      totalCompleted,
      allDone: dayTasks.length > 0 && dayTasks.every(t => t.completed)
    };
  }).filter(group => group.tasks.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <Clock className="w-3.5 h-3.5" /> Full Roadmap
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Dynamic Schedule Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sequential day-by-day plan dynamically calculated from 28 October until syllabus completion.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search topic or lecture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Days', icon: Calendar },
          { id: 'lecture', label: 'Lecture Days', icon: BookOpen },
          { id: 'revision', label: 'Revision & PYQs', icon: RotateCw },
          { id: 'pending', label: 'Pending Only', icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      {filteredTimeline.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No days match your current filter
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTimeline.map(group => {
            const isToday = group.date === selectedDate;
            const plannedH = (group.totalPlanned / 60).toFixed(1);
            const compH = (group.totalCompleted / 60).toFixed(1);

            return (
              <div
                key={group.date}
                className={`p-5 rounded-2xl border transition-all ${
                  isToday 
                    ? 'bg-violet-50/40 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {group.date}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white">
                        Selected Date
                      </span>
                    )}
                    {group.allDone && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Done
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Planned: <strong className="text-slate-800 dark:text-slate-200">{plannedH}h</strong> • Done: <strong className="text-violet-600 dark:text-violet-400">{compH}h</strong>
                  </div>
                </div>

                {/* Day Tasks */}
                <div className="space-y-2">
                  {group.tasks.map(task => (
                    <TaskItem key={task._id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
