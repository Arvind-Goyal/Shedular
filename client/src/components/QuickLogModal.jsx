import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, BookOpen, Clock, Tag } from 'lucide-react';

export default function QuickLogModal() {
  const { isQuickLogOpen, setIsQuickLogOpen, topics, quickLogActivity, selectedDate } = useApp();

  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [activityType, setActivityType] = useState('practice');
  const [durationPreset, setDurationPreset] = useState(45);
  const [customDuration, setCustomDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isQuickLogOpen) return null;

  const durationOptions = [30, 45, 60, 90, 120, 'custom'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const topic = topics.find(t => t._id === selectedTopicId) || topics[0];
      const finalDuration = durationPreset === 'custom' ? Number(customDuration) : Number(durationPreset);

      await quickLogActivity({
        topicId: topic ? topic._id : null,
        topicName: topic ? topic.name : 'Mathematics',
        activityType,
        durationMinutes: finalDuration || 45,
        date: selectedDate,
        notes
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Log Study Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record completed study session for {selectedDate}
            </p>
          </div>
          <button
            onClick={() => setIsQuickLogOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Select Topic */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-500" /> Select Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            >
              <option value="">-- Choose a Topic --</option>
              {topics.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.completedLectures || 0}/{t.totalLectures} lectures)
                </option>
              ))}
            </select>
          </div>

          {/* Select Activity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-violet-500" /> Select Activity
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'lecture', label: 'Lecture' },
                { id: 'revision', label: 'Revision' },
                { id: 'practice', label: 'Practice' },
                { id: 'mock_test', label: 'Mock Test' },
                { id: 'pyq', label: 'Previous Year Qs' },
              ].map(act => (
                <button
                  type="button"
                  key={act.id}
                  onClick={() => setActivityType(act.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center ${
                    activityType === act.id
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-violet-500" /> Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map(dur => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setDurationPreset(dur)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    durationPreset === dur
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {dur === 'custom' ? 'Custom' : `${dur} min`}
                </button>
              ))}
            </div>

            {durationPreset === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Minutes (e.g. 75)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  min="5"
                  max="480"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <span className="text-xs text-slate-500">min</span>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Solved 30 PYQs from CHSL 2024 Tier-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Complete ✓</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
