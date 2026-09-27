import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Target,
  Sparkles,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function ProgressAnalytics() {
  const { scheduleData, user } = useApp();

  const progress = scheduleData?.progress;
  const overall = progress?.overall;
  const weekly = progress?.weekly;
  const topicStats = progress?.topicStats || [];
  const workload = scheduleData?.workload;

  const weeklyDays = weekly?.days || [];

  // Data for subject completion balance chart
  const topicPieData = topicStats.map(t => ({
    name: t.name,
    value: t.totalLectures,
    completed: t.completedLectures,
    percentage: t.percentage
  }));

  const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          <BarChart3 className="w-3.5 h-3.5" /> Performance & Consistency
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          SSC CHSL Preparation Progress
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed metrics of your lecture coverage, study streak, and weekly mathematics workload.
        </p>
      </div>

      {/* Big Overall Banner (Section 9) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Overall Progress</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {overall?.completedLectures || 0} / {overall?.totalLectures || 99} Lectures Completed
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">
              {overall?.overallPercentage || 0}%
            </span>
          </div>
        </div>

        {/* Big Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
          <div
            className="bg-violet-600 h-full rounded-full transition-all duration-700"
            style={{ width: `${overall?.overallPercentage || 0}%` }}
          />
        </div>

        {/* 6 Key Micro Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Total Lectures</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{overall?.totalLectures || 99}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Remaining Lectures</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{overall?.remainingLectures || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Total Study Hours</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{overall?.totalStudyHours || 148.5}h</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Completed Hours</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{overall?.completedStudyHours || 0}h</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Remaining Hours</div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{overall?.remainingStudyHours || 0}h</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Days to Exam</div>
            <div className="text-base font-bold text-violet-600 dark:text-violet-400 mt-0.5">{overall?.daysRemaining || 0}</div>
          </div>
        </div>
      </div>

      {/* Weekly Dashboard Summary (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Weekly Breakdown & Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" /> Weekly Target & Execution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: {weekly?.targetHours || 21}h • Completed: {weekly?.completedHours || 0}h • {weekly?.percentage || 0}% Finished
              </p>
            </div>
            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
              {weekly?.percentage || 0}%
            </span>
          </div>

          {/* Bar Chart */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="dayName" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="h" />
                <Tooltip
                  formatter={(val, name) => [`${val} hours`, name === 'completedHours' ? 'Completed' : 'Planned Target']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="plannedHours" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completedHours" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Sub-Stats (Section 14: Lectures, Revision, Practice, Missed) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400">Lectures Completed:</span>
              <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{weekly?.lecturesCompleted || 0}</div>
            </div>
            <div>
              <span className="text-slate-400">Revision Time:</span>
              <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">{weekly?.revisionCompletedHours || 0}h</div>
            </div>
            <div>
              <span className="text-slate-400">Practice Time:</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{weekly?.practiceCompletedHours || 0}h</div>
            </div>
            <div>
              <span className="text-slate-400">Missed Tasks:</span>
              <div className="font-bold text-rose-500 text-sm mt-0.5">{weekly?.missedTasks || 0}</div>
            </div>
          </div>
        </div>

        {/* Right Col: Study Streak & Consistency (Section 15: Minimal, Serious) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Study Consistency
              </h3>
            </div>

            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-4">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {overall?.streak?.current || 0}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                Consecutive Study Days
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Longest Streak:</span>
                <span className="font-bold text-slate-900 dark:text-white">{overall?.streak?.longest || 0} days</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Buffer Days Available:</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">+{workload?.bufferDays || 0} days</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Minimum Daily Hours:</span>
                <span className="font-bold text-slate-900 dark:text-white">~{workload?.minRequiredDailyStudyHours || 3.5}h / day</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            A serious study habit built on steady 3.5h blocks outperforms irregular cramming.
          </div>
        </div>

      </div>

    </div>
  );
}
