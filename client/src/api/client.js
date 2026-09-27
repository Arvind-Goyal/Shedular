const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('ssc_planner_token') || 'demo-token';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const data = await res.json();
      errMessage = data.message || errMessage;
    } catch (e) {
      errMessage = res.statusText || errMessage;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getDemoUser() {
    const res = await fetch(`${API_BASE}/auth/demo`);
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Schedule
  async getSchedule(today) {
    const url = today ? `${API_BASE}/schedule?today=${today}` : `${API_BASE}/schedule`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getTodayPlan(date) {
    const url = date ? `${API_BASE}/schedule/today?date=${date}` : `${API_BASE}/schedule/today`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getCalendar(month, year, today) {
    const url = today 
      ? `${API_BASE}/schedule/calendar?month=${month}&year=${year}&today=${today}` 
      : `${API_BASE}/schedule/calendar?month=${month}&year=${year}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async recalculateSchedule(fromDate) {
    const res = await fetch(`${API_BASE}/schedule/recalculate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fromDate })
    });
    return handleResponse(res);
  },

  async optimizeSchedule(mode = 'reduce_hours') {
    const res = await fetch(`${API_BASE}/schedule/optimize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mode })
    });
    return handleResponse(res);
  },

  // Tasks
  async getTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tasks${qs ? `?${qs}` : ''}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async toggleTask(id, completed) {
    const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completed })
    });
    return handleResponse(res);
  },

  async quickLog(data) {
    const res = await fetch(`${API_BASE}/tasks/quick-log`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateTask(id, data) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async moveTask(id, newDate) {
    const res = await fetch(`${API_BASE}/tasks/${id}/move`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ newDate })
    });
    return handleResponse(res);
  },

  async skipTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}/skip`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createTask(data) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Topics
  async getTopics() {
    const res = await fetch(`${API_BASE}/topics`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getTopic(id) {
    const res = await fetch(`${API_BASE}/topics/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createTopic(data) {
    const res = await fetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateTopic(id, data) {
    const res = await fetch(`${API_BASE}/topics/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTopic(id) {
    const res = await fetch(`${API_BASE}/topics/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateSettings(data) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resetToDefaults() {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
