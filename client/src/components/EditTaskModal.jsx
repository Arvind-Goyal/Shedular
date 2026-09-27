import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export default function EditTaskModal() {
  const { activeEditTask, setActiveEditTask, refreshAll, showNotification } = useApp();
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [type, setType] = useState('lecture');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeEditTask) {
      setTitle(activeEditTask.title || '');
      setDurationMinutes(activeEditTask.durationMinutes || 90);
      setType(activeEditTask.type || 'lecture');
      setNotes(activeEditTask.notes || '');
    }
  }, [activeEditTask]);

  if (!activeEditTask) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTask(activeEditTask._id, {
        title,
        durationMinutes: Number(durationMinutes),
        type,
        notes
      });
      await refreshAll();
      setActiveEditTask(null);
      showNotification('Task updated successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this scheduled task?')) return;
    try {
      await api.deleteTask(activeEditTask._id);
      await refreshAll();
      setActiveEditTask(null);
      showNotification('Task deleted', 'info');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Edit Task
          </h3>
          <button
            onClick={() => setActiveEditTask(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="lecture">Lecture</option>
                <option value="revision">Revision</option>
                <option value="practice">Practice</option>
                <option value="pyq">PYQ Drill</option>
                <option value="mock_test">Mock Test</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Duration (min)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="5"
                max="480"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key notes, question numbers or reminders..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveEditTask(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
