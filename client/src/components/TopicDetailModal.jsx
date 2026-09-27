import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, BookOpen, Clock, CheckCircle2, Award, Edit2, Save } from 'lucide-react';
import { api } from '../api/client';
import TaskItem from './TaskItem';

export default function TopicDetailModal() {
  const { selectedTopicDetail, setSelectedTopicDetail, refreshAll, showNotification } = useApp();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (selectedTopicDetail) {
      setLoading(true);
      api.getTopic(selectedTopicDetail._id)
        .then(res => {
          setTopicData(res);
          setDifficulty(res.topic.difficulty || 'Medium');
          setNotes(res.topic.notes || '');
        })
        .catch(err => {
          console.error(err);
          showNotification(err.message, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [selectedTopicDetail]);

  if (!selectedTopicDetail) return null;

  const topic = topicData?.topic || selectedTopicDetail;
  const stats = topicData?.stats;
  const tasks = topicData?.tasks || [];

  const handleUpdateTopic = async () => {
    try {
      await api.updateTopic(topic._id, {
        difficulty,
        notes
      });
      await refreshAll();
      setEditing(false);
      showNotification('Topic difficulty & notes updated!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {topic.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats?.totalLectures || topic.totalLectures} Total Lectures • {stats?.completedLectures || topic.completedLectures} Completed
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTopicDetail(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completion</div>
              <div className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                {stats?.percentage || 0}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Remaining Lectures</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.remainingLectures || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Remaining Hours</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats?.estimatedRemainingHours || 0}h
              </div>
            </div>
          </div>

          {/* Difficulty & Notes Controls (Section 17) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Difficulty Level & Revision Priority
              </span>
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs font-semibold text-violet-600 hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Select Difficulty:
                  </label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Difficult'].map(d => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          difficulty === d
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Topic Notes / Reminders:
                  </label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Focus on circle theorems and tangents for Tier-1"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateTopic}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Current Rating: </span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${
                    topic.difficulty === 'Difficult' 
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                      : topic.difficulty === 'Medium'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {topic.difficulty || 'Medium'}
                  </span>
                </div>
                {topic.notes && (
                  <span className="text-slate-500 italic truncate max-w-xs">
                    "{topic.notes}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Scheduled Tasks for this Topic */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Scheduled Lectures & Practice ({tasks.length})
            </h4>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No tasks currently scheduled specifically for this topic.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setSelectedTopicDetail(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
