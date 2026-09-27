import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { format } from 'date-fns';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Banners
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isRecalculateModalOpen, setIsRecalculateModalOpen] = useState(false);
  const [isCapacityWarningOpen, setIsCapacityWarningOpen] = useState(false);
  const [activeEditTask, setActiveEditTask] = useState(null);
  const [activeMoveTask, setActiveMoveTask] = useState(null);
  const [selectedTopicDetail, setSelectedTopicDetail] = useState(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ssc_dark_mode') === 'true';
  });

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, duration);
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ssc_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ssc_dark_mode', 'false');
    }
  }, [darkMode]);

  // Fetch initial profile or demo
  const loadUser = useCallback(async () => {
    try {
      let profile;
      try {
        profile = await api.getMe();
      } catch (e) {
        // Fallback to demo user
        const demo = await api.getDemoUser();
        if (demo && demo.token) {
          localStorage.setItem('ssc_planner_token', demo.token);
        }
        profile = demo;
      }
      if (profile && profile.user) {
        setUser(profile.user);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }, []);

  // Fetch all core data
  const refreshAll = useCallback(async (date = selectedDate) => {
    setLoading(true);
    try {
      const [scheduleRes, todayRes, topicsRes] = await Promise.all([
        api.getSchedule(date),
        api.getTodayPlan(date),
        api.getTopics()
      ]);

      setScheduleData(scheduleRes);
      setTodayPlan(todayRes);
      setTopics(topicsRes);

      // Check if schedule is infeasible and auto-trigger capacity warning if needed
      if (scheduleRes.workload && !scheduleRes.workload.isFeasible) {
        setIsCapacityWarningOpen(true);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const isFirstMount = useRef(true);

  useEffect(() => {
    (async () => {
      await loadUser();
      await refreshAll(selectedDate);
      isFirstMount.current = false;
    })();
  }, [loadUser]);

  useEffect(() => {
    if (!isFirstMount.current) {
      refreshAll(selectedDate);
    }
  }, [selectedDate]);

  // Task actions
  const toggleTask = async (taskId, currentCompleted) => {
    try {
      await api.toggleTask(taskId, !currentCompleted);
      await refreshAll(selectedDate);
      showNotification(
        !currentCompleted ? 'Task marked complete! Keep the momentum going 🔥' : 'Task marked incomplete',
        'success'
      );
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const quickLogActivity = async (payload) => {
    try {
      await api.quickLog(payload);
      await refreshAll(selectedDate);
      setIsQuickLogOpen(false);
      showNotification('Study activity logged successfully! ✓', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const recalculateSchedule = async (fromDate) => {
    try {
      const res = await api.recalculateSchedule(fromDate || selectedDate);
      await refreshAll(selectedDate);
      setIsRecalculateModalOpen(false);
      showNotification(res.message || 'Schedule recalculated successfully!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const optimizeSchedule = async (mode = 'reduce_hours') => {
    try {
      const res = await api.optimizeSchedule(mode);
      await refreshAll(selectedDate);
      showNotification(res.message || 'Schedule optimized!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const skipTask = async (taskId) => {
    try {
      await api.skipTask(taskId);
      await refreshAll(selectedDate);
      showNotification('Task skipped. Remaining schedule will balance smoothly.', 'info');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const moveTask = async (taskId, newDate) => {
    try {
      await api.moveTask(taskId, newDate);
      await refreshAll(selectedDate);
      setActiveMoveTask(null);
      showNotification(`Task moved to ${newDate}`, 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        scheduleData,
        todayPlan,
        topics,
        selectedDate,
        setSelectedDate,
        loading,
        error,
        refreshAll,
        toggleTask,
        quickLogActivity,
        recalculateSchedule,
        optimizeSchedule,
        skipTask,
        moveTask,
        darkMode,
        setDarkMode,
        notification,
        showNotification,
        // Modals
        isQuickLogOpen,
        setIsQuickLogOpen,
        isRecalculateModalOpen,
        setIsRecalculateModalOpen,
        isCapacityWarningOpen,
        setIsCapacityWarningOpen,
        activeEditTask,
        setActiveEditTask,
        activeMoveTask,
        setActiveMoveTask,
        selectedTopicDetail,
        setSelectedTopicDetail
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
