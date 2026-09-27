import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  FileQuestion, 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import TaskItem from '../components/TaskItem';

export default function RevisionHub() {
  const { scheduleData, topics, quickLogActivity, selectedDate, showNotification } = useApp();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'formulas', 'pyqs'
  const [loggingTopic, setLoggingTopic] = useState('');

  // Get revision tasks across the schedule
  const tasksByDate = scheduleData?.tasksByDate || {};
  const allRevisionTasks = [];

  for (const date of Object.keys(tasksByDate)) {
    for (const t of tasksByDate[date]) {
      if (t.type === 'revision' || t.type === 'pyq') {
        allRevisionTasks.push(t);
      }
    }
  }

  // Sort completed topics for revision priority
  const prioritizedTopics = [...topics].map(t => {
    let score = 0;
    if (t.difficulty === 'Difficult') score += 40;
    else if (t.difficulty === 'Medium') score += 20;
    if ((t.completedLectures || 0) > 0) score += 30;
    return { ...t, score };
  }).sort((a, b) => b.score - a.score);

  const handleQuickRevisionDrill = async (topic, subType) => {
    try {
      await quickLogActivity({
        topicId: topic._id,
        topicName: topic.name,
        activityType: subType === 'formulas' ? 'revision' : 'pyq',
        durationMinutes: subType === 'formulas' ? 30 : 60,
        date: selectedDate,
        notes: `Rapid ${subType} revision drill for ${topic.name}`
      });
      showNotification(`${topic.name} revision drill logged!`, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          <RotateCcw className="w-3.5 h-3.5" /> Retention Engine
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Revision & PYQ Hub
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Intelligently structured 2 revision days per week prioritizing difficult chapters, formula sheets, and SSC CHSL Previous Year Questions.
        </p>
      </div>

      {/* Revision Strategy Card (Section 16 Priority Rules) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-violet-50/70 dark:from-slate-900 dark:to-slate-800 border border-blue-200 dark:border-slate-700 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600" /> Dynamic Revision Algorithm Rules
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          The scheduler assigns 2 dedicated days each week (e.g. Thursday & Sunday) for retention drills without consuming new lecture quotas. Tasks are auto-weighted by:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <span className="font-bold text-violet-600">1. Recently Studied</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Consolidate concepts immediately after completing lectures.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <span className="font-bold text-rose-600">2. High Difficulty</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Geometry and Trigonometry receive 2x more PYQ practice.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <span className="font-bold text-blue-600">3. Formula Retention</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Dedicated 30m slots for Mensuration & Trigonometry formulas.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <span className="font-bold text-emerald-600">4. Time Decay</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Topics not revised in the last 14 days are bumped to the top.</p>
          </div>
        </div>
      </div>

      {/* Priority Topic Queue (One-Click Practice Launcher) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" /> Quick Revision Drills (Log in 1 Click)
          </span>
          <span className="text-xs font-normal text-slate-400">
            Click to record extra revision for {selectedDate}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prioritizedTopics.map(topic => (
            <div
              key={topic._id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {topic.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    topic.difficulty === 'Difficult' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                  }`}>
                    {topic.difficulty}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {topic.completedLectures || 0} of {topic.totalLectures} lectures done
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickRevisionDrill(topic, 'formulas')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Formulas (30m)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRevisionDrill(topic, 'pyqs')}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-[11px] font-medium text-white transition-colors"
                >
                  PYQs (60m)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Scheduled Revision Tasks */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600" /> Upcoming Scheduled Revision & PYQ Tasks
        </h3>

        {allRevisionTasks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No revision days generated yet.
          </p>
        ) : (
          <div className="space-y-2.5">
            {allRevisionTasks.slice(0, 10).map(task => (
              <TaskItem key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
