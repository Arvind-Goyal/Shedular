import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  RotateCw,
  Plus,
  ArrowRight,
  Target,
  Check,
  CalendarDays,
  Compass
} from 'lucide-react';
import { api } from '../api/client';
import TaskItem from '../components/TaskItem';
import { format } from 'date-fns';

export default function CalendarView() {
  const { user, selectedDate, setSelectedDate, refreshAll, showNotification } = useApp();
  const navigate = useNavigate();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Year & Month State (defaults to current real month & year so calendar points to TODAY!)
  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[0], 10);
    return now.getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[1], 10);
    return now.getMonth() + 1;
  });

  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [selectedDayMeta, setSelectedDayMeta] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch calendar days for the active month & year
  const fetchCalendar = useCallback(async (m, y) => {
    setLoadingCalendar(true);
    try {
      const res = await api.getCalendar(m, y);
      const days = res.calendarDays || [];
      setCalendarData(days);

      // Determine which day to select:
      // Priority 1: If TODAY is in this month, select TODAY!
      // Priority 2: If selectedDate is in this month, select selectedDate!
      // Priority 3: First day with tasks or first day of month.
      setSelectedDayMeta(prevSelected => {
        // Check if today is in this month
        const todayMatch = days.find(d => d.date === todayStr);
        if (todayMatch && (!selectedDate || selectedDate === todayStr)) {
          return todayMatch;
        }

        // Check if global selectedDate is in this month
        if (selectedDate && selectedDate.startsWith(`${y}-${String(m).padStart(2, '0')}`)) {
          const found = days.find(d => d.date === selectedDate);
          if (found) return found;
        }

        // If today is in this month and no other specific day was chosen, point to today!
        if (todayMatch) return todayMatch;

        // If September 2026, fallback to 28 Sep start day
        if (m === 9 && y === 2026) {
          const sep28 = days.find(d => d.date === '2026-09-28');
          if (sep28) return sep28;
        }

        // First day with tasks or day 1
        const firstWithTasks = days.find(d => d.totalTasks > 0);
        return firstWithTasks || days[0] || null;
      });
    } catch (err) {
      console.error('Failed to load calendar:', err);
      showNotification('Failed to load calendar schedule', 'error');
    } finally {
      setLoadingCalendar(false);
    }
  }, [selectedDate, todayStr, showNotification]);

  // Fetch only when currentMonth or currentYear changes
  useEffect(() => {
    fetchCalendar(currentMonth, currentYear);
  }, [currentMonth, currentYear, fetchCalendar]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Jump directly to TODAY's day!
  const handleJumpToToday = () => {
    const tMonth = now.getMonth() + 1;
    const tYear = now.getFullYear();
    setCurrentMonth(tMonth);
    setCurrentYear(tYear);
    setSelectedDate(todayStr);
    const found = calendarData.find(d => d.date === todayStr);
    if (found) setSelectedDayMeta(found);
  };

  const handleSelectDay = (day) => {
    setSelectedDayMeta(day);
    setSelectedDate(day.date);
  };

  // Dedicated task completion toggle inside calendar with instant optimistic UI update
  const handleCalendarToggleTask = async (taskId, currentCompleted) => {
    const nextCompleted = !currentCompleted;

    // Optimistically update selectedDayMeta
    setSelectedDayMeta(prev => {
      if (!prev) return prev;
      const updatedTasks = (prev.tasks || []).map(t => 
        t._id === taskId ? { ...t, completed: nextCompleted } : t
      );
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const uncompletedCount = updatedTasks.filter(t => !t.completed).length;
      const allDone = completedCount === updatedTasks.length && updatedTasks.length > 0;
      return {
        ...prev,
        tasks: updatedTasks,
        completedTasks: completedCount,
        uncompletedTasksCount: uncompletedCount,
        hasIncomplete: uncompletedCount > 0,
        status: allDone ? 'completed' : completedCount > 0 ? 'partial' : prev.status
      };
    });

    // Optimistically update calendarData tile
    setCalendarData(prevDays => prevDays.map(d => {
      if (!d.tasks || !d.tasks.some(t => t._id === taskId)) return d;
      const updatedTasks = d.tasks.map(t => 
        t._id === taskId ? { ...t, completed: nextCompleted } : t
      );
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const uncompletedCount = updatedTasks.filter(t => !t.completed).length;
      const allDone = completedCount === updatedTasks.length && updatedTasks.length > 0;
      return {
        ...d,
        tasks: updatedTasks,
        completedTasks: completedCount,
        uncompletedTasksCount: uncompletedCount,
        hasIncomplete: uncompletedCount > 0,
        status: allDone ? 'completed' : completedCount > 0 ? 'partial' : d.status
      };
    }));

    try {
      await api.toggleTask(taskId, nextCompleted);
      refreshAll(selectedDate);
      showNotification(
        nextCompleted ? 'Task marked complete! ✓' : 'Task marked incomplete',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle task:', err);
      showNotification('Failed to update task', 'error');
      fetchCalendar(currentMonth, currentYear);
    }
  };

  // Add custom task to selected day
  const handleAddQuickTask = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !selectedDayMeta) return;

    setAddingTask(true);
    try {
      await api.createTask({
        date: selectedDayMeta.date,
        title: quickTitle.trim(),
        durationMinutes: 45,
        type: 'practice',
        topicName: 'Mathematics',
        timeSlot: '05:00 PM – 05:45 PM',
        slotName: 'Practice Drill'
      });
      setQuickTitle('');
      await fetchCalendar(currentMonth, currentYear);
      await refreshAll(selectedDate);
      showNotification(`Task added to ${selectedDayMeta.date}!`, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setAddingTask(false);
    }
  };

  // Helper to extract clean summary info for a day tile
  const getDaySummary = (day) => {
    const isToday = day.date === todayStr;

    if (day.isBlackout) {
      return {
        badge: 'End Sem Exam',
        color: 'amber',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        detail: 'College Break'
      };
    }

    if (isToday) {
      return {
        badge: '📍 TODAY',
        color: 'blue',
        pill: 'bg-blue-600 text-white font-extrabold shadow-sm',
        detail: day.date < '2026-09-28' ? 'Prep Day (2d to start)' : 'Today\'s Study'
      };
    }

    if (day.date === '2026-09-28') {
      return {
        badge: '🚀 Start Day',
        color: 'violet',
        pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 font-bold',
        detail: 'Geometry L1 & L2'
      };
    }

    if (day.date === '2026-12-29') {
      return {
        badge: '🏁 Syllabus Finish',
        color: 'emerald',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold',
        detail: '99 Lectures Done'
      };
    }

    if (day.isRevision) {
      return {
        badge: '⚡ Revision',
        color: 'blue',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
        detail: 'Weekly Revision'
      };
    }

    const firstLecture = day.tasks?.find(t => t.type === 'lecture');
    if (firstLecture) {
      const lecNumbers = day.tasks.filter(t => t.type === 'lecture').map(t => t.lectureNumber);
      return {
        badge: firstLecture.topicName,
        color: 'violet',
        pill: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
        detail: lecNumbers.length > 0 ? `Lec ${lecNumbers.join(', ')}` : 'Study Tasks'
      };
    }

    if (day.date < '2026-09-28') {
      return {
        badge: 'Pre-Start',
        color: 'slate',
        pill: 'text-slate-400',
        detail: 'Starts 28 Sep'
      };
    }

    return null;
  };

  // Determine starting blank days of month
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Header & Month Navigator */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <CalendarIcon className="w-3.5 h-3.5" /> SSC CHSL Maths Calendar
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click on any day to see its topic, lecture numbers, and revision targets.
            </p>
          </div>

          {/* Stepper Controls & Direct Today Button */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Jump to Today Button */}
            <button
              onClick={handleJumpToToday}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
              title="Point Calendar to Today"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Point to Today ({format(now, 'd MMM')})</span>
            </button>

            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Dropdown */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name} {currentYear}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Milestone Month Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Quick Jump:</span>

          <button
            onClick={handleJumpToToday}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              selectedDayMeta?.date === todayStr
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            📍 Today ({format(now, 'd MMM')})
          </button>

          <button
            onClick={() => { setCurrentMonth(9); setCurrentYear(2026); setSelectedDate('2026-09-28'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              currentMonth === 9 && currentYear === 2026 && selectedDayMeta?.date === '2026-09-28'
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            🚀 Sep 2026 (Starts 28 Sep)
          </button>

          <button
            onClick={() => { setCurrentMonth(10); setCurrentYear(2026); setSelectedDate('2026-10-28'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              currentMonth === 10 && currentYear === 2026
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            🎓 Oct 2026 (Exams & Resume)
          </button>

          <button
            onClick={() => { setCurrentMonth(11); setCurrentYear(2026); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              currentMonth === 11 && currentYear === 2026
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            📚 Nov 2026 (Full Syllabus)
          </button>

          <button
            onClick={() => { setCurrentMonth(12); setCurrentYear(2026); setSelectedDate('2026-12-29'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              currentMonth === 12 && currentYear === 2026
                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
            }`}
          >
            🏁 Dec 2026 (Finish 29 Dec)
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Day Details Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {loadingCalendar ? (
            <div className="flex items-center justify-center h-80">
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Loading {monthNames[currentMonth - 1]} schedule...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Blank offset tiles for start of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="min-h-[100px] rounded-xl bg-transparent" />
              ))}

              {/* Day Tiles */}
              {calendarData.map(day => {
                const isSelected = selectedDayMeta?.date === day.date;
                const isToday = day.date === todayStr;
                const summary = getDaySummary(day);
                const isStartDay = day.date === '2026-09-28';
                const isResumeDay = day.date === '2026-10-28';
                const isFinishDay = day.date === '2026-12-29';
                const isCompleted = day.completedTasks > 0 && day.completedTasks === day.totalTasks;
                const isMissed = day.status === 'missed' || (day.uncompletedTasksCount > 0 && day.date < selectedDate);

                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={() => handleSelectDay(day)}
                    className={`min-h-[105px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-violet-600 dark:ring-violet-500 shadow-md scale-[1.02] border-violet-500 z-10'
                        : isToday
                        ? 'ring-2 ring-blue-500 border-blue-400 shadow-sm'
                        : 'hover:border-violet-300 dark:hover:border-violet-700 border-slate-200 dark:border-slate-800'
                    } ${
                      isToday
                        ? 'bg-blue-50/70 dark:bg-blue-950/40'
                        : day.isBlackout
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : isCompleted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : isStartDay || isResumeDay || isFinishDay
                        ? 'bg-violet-50/50 dark:bg-violet-950/20'
                        : day.isRevision
                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Top Row: Date Number + Mini Dot Indicator */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${
                          isToday
                            ? 'text-blue-700 dark:text-blue-300 font-extrabold'
                            : isSelected 
                            ? 'text-violet-600 dark:text-violet-400 font-extrabold' 
                            : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {day.dayNumber}
                        </span>
                        {isToday && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-blue-600 text-white leading-tight">
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Dot Indicator */}
                      <span className={`w-2 h-2 rounded-full ${
                        isToday
                          ? 'bg-blue-600'
                          : day.isBlackout
                          ? 'bg-amber-500'
                          : isCompleted
                          ? 'bg-emerald-500'
                          : isMissed
                          ? 'bg-rose-500'
                          : day.isRevision
                          ? 'bg-blue-500'
                          : day.totalTasks > 0
                          ? 'bg-violet-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`} />
                    </div>

                    {/* Content Snippet */}
                    <div className="w-full space-y-1 my-1">
                      {summary && (
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${summary.pill}`}>
                          {summary.badge}
                        </div>
                      )}
                      {summary?.detail && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                          {summary.detail}
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="text-[10px] w-full pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {isToday && day.date < '2026-09-28' ? (
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-[9px]">
                          📍 2d to start
                        </span>
                      ) : day.isBlackout ? (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold text-[9px]">
                          College Exam
                        </span>
                      ) : isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 text-[9px]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> All Done
                        </span>
                      ) : isMissed ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                          🔴 {day.uncompletedTasksCount} left
                        </span>
                      ) : day.totalTasks > 0 ? (
                        <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px]">
                          {day.completedTasks}/{day.totalTasks} done
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[9px]">
                          —
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> Lecture Day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Revision Day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> End Sem Exam (Break)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
            </span>
          </div>
        </div>

        {/* Right Col: Selected Day Schedule Inspector */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Header info */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Day Details
                </span>
                
                {selectedDayMeta && (
                  <button
                    onClick={() => {
                      setSelectedDate(selectedDayMeta.date);
                      navigate('/');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors"
                  >
                    <span>Open in Todo Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <span>{selectedDayMeta ? format(new Date(selectedDayMeta.date), 'EEEE, d MMMM yyyy') : 'Select a Day'}</span>
                {selectedDayMeta?.date === todayStr && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-600 text-white">
                    TODAY
                  </span>
                )}
              </h3>

              {/* Day Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {selectedDayMeta?.tasks?.length > 0 ? (
                  selectedDayMeta.isRevision ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                      ⚡ Weekly Revision Day
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border border-violet-200 dark:border-violet-800">
                      📚 {
                        selectedDayMeta.tasks.filter(t => t.type === 'lecture').length > 0
                          ? `Lecture ${selectedDayMeta.tasks.filter(t => t.type === 'lecture').map(t => t.lectureNumber).filter(Boolean).join(' & ')}`
                          : `${selectedDayMeta.tasks.length} Study Tasks`
                      }
                    </span>
                  )
                ) : selectedDayMeta?.isBlackout ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                    🎓 College Exam Break (No Study)
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No scheduled tasks</span>
                )}

                {selectedDayMeta?.completedTasks > 0 && selectedDayMeta?.completedTasks === selectedDayMeta?.totalTasks && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200">
                    ✅ All Done
                  </span>
                )}

                {selectedDayMeta?.date === '2026-09-28' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border border-violet-200">
                    🚀 Start Day
                  </span>
                )}

                {selectedDayMeta?.date === '2026-10-28' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border border-violet-200">
                    📚 Study Resumes
                  </span>
                )}

                {selectedDayMeta?.date === '2026-12-29' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200">
                    🏁 Syllabus Finish
                  </span>
                )}
              </div>
            </div>

            {/* Today Pre-Start Countdown Card (If today is before 28 Sep) */}
            {selectedDayMeta?.date === todayStr && todayStr < '2026-09-28' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                    Maths Preparation Starts in 2 Days!
                  </span>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Today is <strong>{format(now, 'EEEE, d MMMM yyyy')}</strong>. Your 99-lecture Maths study plan officially starts on <strong>Monday, 28 September</strong>.
                </p>

                {/* Routine Card */}
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-blue-100 dark:border-slate-800 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Study Routine:
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    2 Lectures daily (e.g. <strong>Lecture 1 & Lecture 2</strong>) with structured weekly revision days.
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDate('2026-09-28');
                    const sep28 = calendarData.find(d => d.date === '2026-09-28');
                    if (sep28) setSelectedDayMeta(sep28);
                  }}
                  className="w-full py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Preview Day 1 Schedule (28 Sep)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* End Sem Exam Break Info Card */}
            {selectedDayMeta?.isBlackout && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">End Sem Exam Period (4 Oct – 27 Oct)</p>
                  <p className="text-amber-800 dark:text-amber-300">
                    Maths preparation is intentionally paused here. Focus on college exams! Normal schedule resumes seamlessly on <strong>28 October</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentMonth(10);
                      setCurrentYear(2026);
                      setSelectedDate('2026-10-28');
                    }}
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-100 underline hover:no-underline"
                  >
                    Jump to 28 October (Resume Day) →
                  </button>
                </div>
              </div>
            )}

            {/* Incomplete Warning */}
            {selectedDayMeta?.uncompletedTasksCount > 0 && selectedDayMeta?.date < todayStr && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                <span>⚠️ {selectedDayMeta.uncompletedTasksCount} pending task(s) on this date</span>
                <span className="font-semibold text-[11px]">Tick below when done</span>
              </div>
            )}

            {/* Tasks List with working Checkboxes & Clean Lecture/Revision badges */}
            {(!selectedDayMeta || selectedDayMeta.tasks.length === 0) ? (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookOpen className="w-8 h-8 mx-auto opacity-40 text-violet-500" />
                <p className="text-xs font-medium">No scheduled tasks for this date.</p>
                <p className="text-[11px] text-slate-400">
                  Target study schedule runs from <strong>28 Sep to 29 Dec 2026</strong> (College Exams: 4–27 Oct).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between items-center">
                  <span>Scheduled Tasks ({selectedDayMeta.tasks.length}):</span>
                  <span>Click checkbox to mark done</span>
                </div>
                {selectedDayMeta.tasks.map(task => (
                  <TaskItem 
                    key={task._id} 
                    task={task} 
                    onToggle={handleCalendarToggleTask}
                    hideTiming={true}
                  />
                ))}
              </div>
            )}

            {/* Quick Add Custom Task to this Day */}
            <form onSubmit={handleAddQuickTask} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="✍️ Add custom task for this date..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={addingTask || !quickTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Bottom Summary Footer */}
          {selectedDayMeta && selectedDayMeta.tasks.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {selectedDayMeta.completedTasks} of {selectedDayMeta.totalTasks} completed
              </span>
              {selectedDayMeta.completedTasks === selectedDayMeta.totalTasks ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> All Tasks Done!
                </span>
              ) : (
                <span className="font-bold text-violet-600 dark:text-violet-400 text-xs">
                  {Math.round((selectedDayMeta.completedTasks / selectedDayMeta.totalTasks) * 100)}% Done
                </span>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
