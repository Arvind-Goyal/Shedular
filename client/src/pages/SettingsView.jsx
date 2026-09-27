import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Calendar, 
  BookOpen, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../api/client';

export default function SettingsView() {
  const { user, scheduleData, topics, refreshAll, showNotification } = useApp();

  const [dailyHours, setDailyHours] = useState(3.5);
  const [lectureDuration, setLectureDuration] = useState(1.5);
  const [revisionDays, setRevisionDays] = useState(2);
  const [startDate, setStartDate] = useState('2026-10-28');
  const [targetExamDate, setTargetExamDate] = useState('2027-05-31');
  const [blackoutPeriods, setBlackoutPeriods] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user) {
      setDailyHours(user.dailyStudyHours || 3.5);
      setLectureDuration(user.lectureDuration || 1.5);
      setRevisionDays(user.weeklyRevisionDays !== undefined ? user.weeklyRevisionDays : 2);
      setStartDate(user.startDate || '2026-10-28');
      setTargetExamDate(user.targetExamDate || '2027-05-31');
      setBlackoutPeriods(user.blackoutPeriods || []);
    }
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings({
        dailyStudyHours: Number(dailyHours),
        lectureDuration: Number(lectureDuration),
        weeklyRevisionDays: Number(revisionDays),
        startDate,
        targetExamDate,
        blackoutPeriods
      });
      await refreshAll();
      showNotification('Study parameters saved and future schedule automatically rebalanced! ✓', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all topics and schedule to initial default 99-lecture syllabus? This will reload the standard SSC CHSL syllabus.')) return;
    setResetting(true);
    try {
      await api.resetToDefaults();
      await refreshAll();
      showNotification('Reset complete: 99 lectures across 9 topics loaded!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleAddBlackout = () => {
    setBlackoutPeriods([
      ...blackoutPeriods,
      { startDate: '2026-10-04', endDate: '2026-10-27', reason: 'Semester Exam Break' }
    ]);
  };

  const handleRemoveBlackout = (index) => {
    setBlackoutPeriods(blackoutPeriods.filter((_, i) => i !== index));
  };

  const handleBlackoutChange = (index, field, value) => {
    const updated = [...blackoutPeriods];
    updated[index][field] = value;
    setBlackoutPeriods(updated);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <SettingsIcon className="w-3.5 h-3.5" /> Engine Configuration
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Study Planner Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify daily study hours, lecture durations, target exam date, and revision frequency.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>Reset Initial Syllabus</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Study Parameters Card (Section 18) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-violet-600" /> Daily Workload & Lecture Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Daily study hours */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target Daily Study Time (hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="14"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default: 3.5 hours per day (210 mins).
              </p>
            </div>

            {/* Lecture duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Approximate Lecture Duration (hours)
              </label>
              <input
                type="number"
                step="0.25"
                min="0.5"
                max="4"
                value={lectureDuration}
                onChange={(e) => setLectureDuration(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default: 1.5 hours per lecture (90 mins).
              </p>
            </div>

            {/* Revision days per week */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Revision Days Per Week
              </label>
              <select
                value={revisionDays}
                onChange={(e) => setRevisionDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={1}>1 Day / Week (Sunday)</option>
                <option value={2}>2 Days / Week (Thursday & Sunday) — Recommended</option>
                <option value={3}>3 Days / Week (Tuesday, Thursday, Sunday)</option>
                <option value={4}>4 Days / Week (Intensive Revision)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Allocates dedicated days for formulas and PYQs without advancing lectures.
              </p>
            </div>

            {/* Schedule Start Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Study Start / Restart Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default starts from 28 October after the college exam period.
              </p>
            </div>

            {/* Target Exam Date (Section 4) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target SSC CHSL Exam Date (User Selectable)
              </label>
              <input
                type="date"
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The scheduler dynamically calculates remaining days and automatically distributes the 99 lectures.
              </p>
            </div>

          </div>
        </div>

        {/* Blackout Periods / Exam Breaks (Section 4: 4 October -> 27 October) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" /> Exam Periods & Study Blackouts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dates in these ranges are excluded from regular lecture study.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBlackout}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Break
            </button>
          </div>

          {blackoutPeriods.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No blackout periods configured.</p>
          ) : (
            <div className="space-y-3">
              {blackoutPeriods.map((period, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Start Date</span>
                      <input
                        type="date"
                        value={period.startDate}
                        onChange={(e) => handleBlackoutChange(idx, 'startDate', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">End Date</span>
                      <input
                        type="date"
                        value={period.endDate}
                        onChange={(e) => handleBlackoutChange(idx, 'endDate', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Reason</span>
                      <input
                        type="text"
                        placeholder="e.g. College Exams"
                        value={period.reason}
                        onChange={(e) => handleBlackoutChange(idx, 'reason', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBlackout(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving & Rebalancing...' : 'Save & Rebalance Schedule'}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
