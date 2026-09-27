import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, X, Clock, Calendar, ArrowRight, Check } from 'lucide-react';
import { api } from '../api/client';

export default function CapacityWarningModal() {
  const { 
    isCapacityWarningOpen, 
    setIsCapacityWarningOpen, 
    scheduleData, 
    refreshAll, 
    showNotification 
  } = useApp();

  const [loadingAction, setLoadingAction] = useState(null);

  if (!isCapacityWarningOpen) return null;

  const workload = scheduleData?.workload;
  const suggestions = workload?.suggestions;

  const handleApplyAdjustment = async (type) => {
    setLoadingAction(type);
    try {
      const updatePayload = {};

      if (type === 'hours' && suggestions?.requiredStudyHours) {
        updatePayload.dailyStudyHours = suggestions.requiredStudyHours;
      } else if (type === 'revision' && suggestions?.suggestedWeeklyRevisionDays !== undefined) {
        updatePayload.weeklyRevisionDays = suggestions.suggestedWeeklyRevisionDays;
      } else if (type === 'date' && suggestions?.suggestedTargetExamDate) {
        updatePayload.targetExamDate = suggestions.suggestedTargetExamDate;
      }

      await api.updateSettings(updatePayload);
      await refreshAll();
      setIsCapacityWarningOpen(false);
      showNotification('Schedule successfully adjusted and rebalanced to feasible limits!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden">
        
        {/* Warning Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 p-5 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
              Schedule Capacity Warning
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
              Current schedule is not feasible with your current parameters.
            </p>
          </div>
          <button
            onClick={() => setIsCapacityWarningOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {workload?.feasibilityMessage || 
              "You need more study time or a longer timeline to finish all 99 Mathematics lectures before your target exam date without overloading your days."}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Remaining Lectures:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{workload?.totalRemainingLectures || 0} lectures</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Required Daily Hours:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">~{workload?.minRequiredDailyStudyHours || 0}h / day</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Your Current Limit:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{scheduleData?.userSettings?.dailyStudyHours || 3.5}h / day</span>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-1">
            Recommended Remedies (One-Click)
          </div>

          {/* Actionable Remedies */}
          <div className="space-y-2.5">
            {suggestions?.requiredStudyHours && (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleApplyAdjustment('hours')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Increase Daily Study Hours
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Bump daily goal to {suggestions.requiredStudyHours} hours/day
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            {suggestions?.suggestedWeeklyRevisionDays !== undefined && (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleApplyAdjustment('revision')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Reduce Revision Days
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Adjust from {scheduleData?.userSettings?.weeklyRevisionDays} to {suggestions.suggestedWeeklyRevisionDays} day/week to free up lecture days
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            {suggestions?.suggestedTargetExamDate && (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => handleApplyAdjustment('date')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Extend Target Exam Date
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Move target date to {suggestions.suggestedTargetExamDate} (+{suggestions.calendarDaysExtension} days)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsCapacityWarningOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Dismiss for Now
          </button>
        </div>
      </div>
    </div>
  );
}
