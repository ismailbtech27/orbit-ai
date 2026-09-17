export const apiService = {
  getEvents: async () => {
    const res = await fetch('/api/security-events');
    return res.json();
  },

  getAlerts: async () => {
    const res = await fetch('/api/alerts');
    return res.json();
  },

  getAlertById: async (id) => {
    const res = await fetch(`/api/alerts/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  getAttackPath: async (alertId) => {
    const res = await fetch(`/api/attack-path/${alertId}`);
    if (!res.ok) return null;
    return res.json();
  },

  getRiskAssessment: async (alertId) => {
    const res = await fetch(`/api/risk/${alertId}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Simulate manual analysis run from the UI (mostly legacy demo flow, 
  // since server handles auto-detection for Brute Force now)
  analyzeEvent: async (eventId) => {
    // For this prototype phase, the backend automatically analyzes events. 
    // We'll just return a success payload or fetch the updated event if needed.
    return { status: 'Triggered analysis on backend' };
  },

  approveResponse: async (alertId) => {
    const res = await fetch(`/api/response/${alertId}/approve`, { method: 'POST' });
    return res.json();
  },

  rejectResponse: async (alertId) => {
    const res = await fetch(`/api/response/${alertId}/reject`, { method: 'POST' });
    return res.json();
  },
  
  getDashboardStats: async () => {
    const res = await fetch('/api/stats');
    return res.json();
  }
};
