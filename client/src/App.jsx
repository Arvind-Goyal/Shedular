import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Modals
import QuickLogModal from './components/QuickLogModal';
import CapacityWarningModal from './components/CapacityWarningModal';
import RecalculateModal from './components/RecalculateModal';
import EditTaskModal from './components/EditTaskModal';
import MoveTaskModal from './components/MoveTaskModal';

// Pages
import Dashboard from './pages/Dashboard';
import TodayPlan from './pages/TodayPlan';
import ScheduleTimeline from './pages/ScheduleTimeline';
import CalendarView from './pages/CalendarView';
import TopicsView from './pages/TopicsView';
import ProgressAnalytics from './pages/ProgressAnalytics';
import RevisionHub from './pages/RevisionHub';
import SettingsView from './pages/SettingsView';
import { useApp } from './context/AppContext';

export default function App() {
  const { loading, error } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Persistent Sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading && !error ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500">
                  Calculating optimal Mathematics schedule...
                </span>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<TodayPlan />} />
              <Route path="/today" element={<TodayPlan />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/topics" element={<TopicsView />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<ScheduleTimeline />} />
              <Route path="/progress" element={<ProgressAnalytics />} />
              <Route path="/revision" element={<RevisionHub />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <QuickLogModal />
      <CapacityWarningModal />
      <RecalculateModal />
      <EditTaskModal />
      <MoveTaskModal />
    </div>
  );
}
