import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  Target, 
  Flame, 
  ArrowRight, 
  Calendar, 
  Sparkles,
  BookOpen,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import AheadBanner from '../components/AheadBanner';
import TaskItem from '../components/TaskItem';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const { user, scheduleData, todayPlan, selectedDate, setSelectedDate, setIsQuickLogOpen } = useApp();

  const progress = scheduleData?.progress;
  const overall = progress?.overall;
  const todayProgress = progress?.today;
  const weekly = progress?.weekly;
  const topicStats = progress?.topicStats || [];
  const workload = scheduleData?.workload;

  const todayTasks = todayPlan?.tasks || [];

  // Chart data for weekly study hours
  const weeklyChartData = (weekly?.days || []).map(d => ({
    name: d.dayName,
    date: d.date,
    planned: d.plannedHours,
    completed: d.completedHours,
    isToday: d.isToday
  }));

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Top Greeting & Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            {getGreeting()}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Your SSC CHSL Maths Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep your 3.5h daily target steady to master all {overall?.totalLectures || 99} lectures before SSC CHSL 2026.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/today"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            <span>Open Today's Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Contextual Ahead/Behind Alert Banner */}
      <AheadBanner />

      {/* Top 4 Key Metric Cards (Section 19: Goal, Completed, Remaining, Streak) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Goal */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Today's Goal
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {todayProgress?.plannedHours || user?.dailyStudyHours || 3.5}h
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Completed
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {todayProgress?.completedHours || 0}h
            </div>
          </div>
        </div>

        {/* Remaining Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Remaining
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {todayProgress?.remainingHours || 0}h
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Current Streak
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {overall?.streak?.current || 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Overall Syllabus Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Schedule Preview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" /> Today's Schedule
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDate} • {todayPlan?.isRevision ? 'Revision Day' : 'Lecture & Practice'}
              </span>
            </div>
            <Link
              to="/today"
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Full Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Today Tasks List */}
          {todayTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                No tasks scheduled for today ({selectedDate})
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Study start date begins on 28 October or click below to log practice.
              </p>
              <button
                onClick={() => setIsQuickLogOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                + Log Study Activity
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 4).map(task => (
                <TaskItem key={task._id} task={task} />
              ))}
              {todayTasks.length > 4 && (
                <Link
                  to="/today"
                  className="block text-center text-xs font-medium text-violet-600 hover:underline pt-2"
                >
                  + {todayTasks.length - 4} more tasks on Today's Plan page
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Overall Progress Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" /> Overall Progress
              </h3>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                {overall?.overallPercentage || 0}%
              </span>
            </div>

            <div className="text-center py-4">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {overall?.completedLectures || 0} <span className="text-lg font-normal text-slate-400">/ {overall?.totalLectures || 99}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Lectures Completed
              </div>
            </div>

            {/* Big Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-6">
              <div
                className="bg-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overall?.overallPercentage || 0}%` }}
              />
            </div>

            {/* Sub metrics */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Remaining Lectures:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{overall?.remainingLectures || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Study Time:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{overall?.totalStudyHours || 148.5} hours</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Completed Hours:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{overall?.completedStudyHours || 0} hours</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Days Remaining:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{overall?.daysRemaining || 0} days</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Buffer Days:</span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">+{workload?.bufferDays || 0} days</span>
              </div>
            </div>
          </div>

          <Link
            to="/progress"
            className="mt-6 w-full text-center py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Detailed Analytics
          </Link>
        </div>
      </div>

      {/* Topic Progress Cards Preview (Section 10) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" /> Topic Progress
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Maths syllabus divided into {topicStats.length} major topics
            </span>
          </div>
          <Link
            to="/topics"
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            Manage Syllabus <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicStats.slice(0, 6).map(topic => (
            <div
              key={topic._id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-violet-200 dark:hover:border-violet-800 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {topic.name}
                </h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  topic.difficulty === 'Difficult' 
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                    : topic.difficulty === 'Medium'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}>
                  {topic.difficulty}
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{topic.completedLectures} / {topic.totalLectures} Completed</span> • {topic.percentage}%
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${topic.percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Remaining: {topic.remainingLectures} lectures</span>
                <span>~{topic.estimatedRemainingHours}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity Bar Chart (Section 14 & 19) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-600" /> Weekly Activity
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target: {weekly?.targetHours || 21}h • Completed: {weekly?.completedHours || 0}h ({weekly?.percentage || 0}%)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" /> Completed Hours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 inline-block" /> Planned Target
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="h" />
              <Tooltip 
                formatter={(val, name) => [`${val} hours`, name === 'completed' ? 'Completed' : 'Planned']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
