import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  GraduationCap,
  CalendarDays,
  Target,
  AlertTriangle,
  Lock,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import TaskItem from '../components/TaskItem';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { api } from '../api/client';

export default function TodayPlan() {
  const { 
    todayPlan, 
    selectedDate, 
    setSelectedDate, 
    refreshAll, 
    setIsQuickLogOpen, 
    setIsRecalculateModalOpen,
    showNotification,
    toggleTask
  } = useApp();

  const [todoFilter, setTodoFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDuration, setQuickDuration] = useState(30);
  const [addingTask, setAddingTask] = useState(false);

  const rawTasks = todayPlan?.tasks || [];
  const tasks = rawTasks.filter((task, index, self) =>
    index === self.findIndex(t =>
      (t._id && task._id && t._id === task._id) ||
      (t.type === 'lecture' && t.lectureNumber === task.lectureNumber && t.topicName === task.topicName)
    )
  );
  const plannedHours = todayPlan ? Number((todayPlan.plannedMinutes / 60).toFixed(1)) : 3.5;
  const completedHours = todayPlan ? Number((todayPlan.completedMinutes / 60).toFixed(1)) : 0;
  const progressPercent = todayPlan?.plannedMinutes > 0 
    ? Math.min(100, Math.round((todayPlan.completedMinutes / todayPlan.plannedMinutes) * 100))
    : 0;

  // Check if selectedDate is during the End Sem Exam (4 Oct - 27 Oct)
  const isEndSemExam = selectedDate >= '2026-10-04' && selectedDate <= '2026-10-27';
  const isStartDay = selectedDate === '2026-09-28';
  const isResumeDay = selectedDate === '2026-10-28';

  const handlePrevDay = () => {
    const prev = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setAddingTask(true);
    try {
      await api.createTask({
        date: selectedDate,
        title: quickTitle.trim(),
        durationMinutes: Number(quickDuration) || 30,
        type: 'practice',
        topicName: 'Mathematics'
      });
      setQuickTitle('');
      await refreshAll(selectedDate);
      showNotification('Todo item added for today!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setAddingTask(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (todoFilter === 'pending') return !t.completed;
    if (todoFilter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 animate-fade-in">
      
      {/* Date Header & Quick Switchers */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <Calendar className="w-3.5 h-3.5" /> SSC CHSL Maths Todo List
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')}
            </h2>
          </div>

          {/* Date Picker Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
            />

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Date Jumper Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Quick Jump:</span>
          
          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              selectedDate === format(new Date(), 'yyyy-MM-dd')
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            📍 Today ({format(new Date(), 'd MMM')})
          </button>

          <button
            onClick={() => setSelectedDate('2026-09-28')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              isStartDay 
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            🚀 28 Sep (Start Day)
          </button>

          <button
            onClick={() => setSelectedDate('2026-10-28')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              isResumeDay 
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            📚 28 Oct (Post-Exams)
          </button>

          <button
            onClick={() => setSelectedDate('2026-12-29')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              selectedDate === '2026-12-29' 
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            🏁 29 Dec (December End Finish)
          </button>
        </div>
      </div>

      {/* End Sem Exam Break Alert Banner (4 Oct - 27 Oct) */}
      {isEndSemExam && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
              End Sem Exam Period (4 October — 27 October)
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Maths study is intentionally paused during this period so you can focus 100% on your college semester exams.
              Regular Maths schedule resumes seamlessly on <strong>28 October</strong>.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSelectedDate('2026-09-28')}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200 hover:bg-amber-100"
              >
                Go to 28 Sep (Start Day)
              </button>
              <button
                onClick={() => setSelectedDate('2026-10-28')}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Go to 28 Oct (Resume Day)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Start Countdown & Real Timing Banner (Before 28 Sep) */}
      {selectedDate < '2026-09-28' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                  TODAY: {format(parseISO(selectedDate), 'EEEE, d MMMM')}
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  🚀 Preparation Starts in 2 Days!
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Your SSC CHSL Maths Plan kicks off on Monday, 28 September 2026
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Total Syllabus: <strong>99 Lectures across 9 Topics</strong> • Daily Target: <strong>3.0 Hours (2 Lectures)</strong>
              </p>

              {/* Real Clock Timings Box */}
              <div className="mt-3 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-100 dark:border-slate-800 text-xs space-y-2">
                <div className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-600" />
                  <span>Official Daily Study Time Slots:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    <span><strong>Morning Slot:</strong> 09:00 AM – 10:30 AM (90m)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    <span><strong>Evening Slot:</strong> 05:00 PM – 06:30 PM (90m)</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSelectedDate('2026-09-28')}
                  className="px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span>Preview Day 1 (28 Sep) Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Progress Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-violet-600" /> Daily Target: {plannedHours} hours
          </span>
          <span className="font-bold text-violet-600 dark:text-violet-400">
            {completedHours}h completed ({progressPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100 ? 'bg-emerald-500' : 'bg-violet-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{completedCount} of {tasks.length} tasks completed</span>
          <span>{plannedHours > completedHours ? `${(plannedHours - completedHours).toFixed(1)}h remaining` : 'Target achieved for today! 🎉'}</span>
        </div>
      </div>

      {/* Remaining Backlog From Previous Days */}
      {todayPlan?.backlogTasks && todayPlan.backlogTasks.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Remaining Backlog From Previous Days ({todayPlan.backlogTasks.length} tasks)
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Tasks from earlier dates that are still pending. Tick them off when done or rebalance forward.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRecalculateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rebalance into Future Dates</span>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {todayPlan.backlogTasks.map(task => (
              <div key={task._id} className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                  Missed on: {task.date}
                </span>
                <TaskItem task={task} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Stability Assurance Note */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Lock className="w-4 h-4 text-violet-600 flex-shrink-0" />
        <span>
          <strong>Dates are locked & stable:</strong> Your schedule dates will never shift automatically on their own. They only change if you explicitly click <em>"Rebalance Schedule"</em>.
        </span>
      </div>

      {/* Quick Todo Add Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="✍️ Add custom task for today (e.g. Geometry PYQs Tier-1)..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
        />

        <select
          value={quickDuration}
          onChange={(e) => setQuickDuration(Number(e.target.value))}
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
        >
          <option value={15}>15m</option>
          <option value={30}>30m</option>
          <option value={45}>45m</option>
          <option value={60}>60m</option>
          <option value={90}>90m</option>
          <option value={120}>120m</option>
        </select>

        <button
          type="submit"
          disabled={addingTask || !quickTitle.trim()}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>
      {/* Daily Real Clock Study Timings Banner */}
      {tasks.length > 0 && (
        <div className="p-3.5 rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-bold text-violet-900 dark:text-violet-200">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Today's Real Study Timings:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-slate-700 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span><strong>Morning Slot:</strong> 09:00 AM – 10:30 AM</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-slate-700 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span><strong>Evening Slot:</strong> 05:00 PM – 06:30 PM</span>
            </span>
          </div>
        </div>
      )}

      {/* Todo List Header & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Today's Checklist ({tasks.length})
          </span>
          {todayPlan?.isRevision && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Revision Day
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setTodoFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              todoFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setTodoFilter('pending')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              todoFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Pending ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setTodoFilter('completed')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              todoFilter === 'completed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Done ({completedCount})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {tasks.length === 0 
              ? (isEndSemExam ? 'End Sem Exam Break — No Maths study scheduled' : 'No tasks scheduled for this day')
              : 'No tasks match this filter'}
          </h4>
          <p className="text-xs text-slate-400">
            {tasks.length === 0 && !isEndSemExam && 'Click above to jump to 28 September to see your first study day.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskItem key={task._id} task={task} />
          ))}
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Topic Logger (Dropdown)</span>
        </button>
      </div>

    </div>
  );
}
