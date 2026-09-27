import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import TopicDetailModal from '../components/TopicDetailModal';

export default function TopicsView() {
  const { topics, scheduleData, setSelectedTopicDetail, refreshAll, showNotification } = useApp();

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [lectureCount, setLectureCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const topicStats = scheduleData?.progress?.topicStats || [];
  const lectureDuration = scheduleData?.userSettings?.lectureDuration || 1.5;

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!topicName) return;
    setSubmitting(true);
    try {
      await api.createTopic({
        name: topicName,
        totalLectures: Number(lectureCount),
        difficulty
      });
      await refreshAll();
      setIsAddingTopic(false);
      setTopicName('');
      setLectureCount(10);
      showNotification('New topic added and schedule automatically rebalanced! ✓', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (e, topicId, name) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete topic "${name}"? Future scheduled tasks for this topic will be removed.`)) return;
    try {
      await api.deleteTopic(topicId);
      await refreshAll();
      showNotification(`Topic "${name}" removed and schedule adjusted`, 'info');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      <TopicDetailModal />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <BookOpen className="w-3.5 h-3.5" /> Syllabus Modules
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            SSC CHSL Mathematics Topics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Individual progress, remaining hours, and difficulty tuning for all syllabus chapters.
          </p>
        </div>

        <button
          onClick={() => setIsAddingTopic(!isAddingTopic)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Topic</span>
        </button>
      </div>

      {/* Add Topic Drawer */}
      {isAddingTopic && (
        <form onSubmit={handleAddTopic} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Add New Chapter / Topic to Syllabus
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Topic Name
              </label>
              <input
                type="text"
                placeholder="e.g. Algebra & Polynomials"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Total Lectures
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={lectureCount}
                onChange={(e) => setLectureCount(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Difficult">Difficult</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingTopic(false)}
              className="px-4 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm disabled:opacity-50"
            >
              Add Topic
            </button>
          </div>
        </form>
      )}

      {/* Topic Cards Grid (Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topicStats.map(topic => {
          return (
            <div
              key={topic._id}
              onClick={() => setSelectedTopicDetail(topic)}
              className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {topic.name}
                  </h3>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      topic.difficulty === 'Difficult' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        : topic.difficulty === 'Medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}>
                      {topic.difficulty}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTopic(e, topic._id, topic.name)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Delete topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <strong className="text-slate-800 dark:text-slate-200">{topic.completedLectures} / {topic.totalLectures} Completed</strong> ({topic.percentage}%)
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  ~{topic.estimatedRemainingHours}h remaining
                </span>

                <span className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
