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
    const res = await fetch(`/api/alerts/${alertId}`);
    if (!res.ok) return null;
    const alert = await res.json();
    return {
      observedStages: alert.observedPath ? JSON.parse(alert.observedPath) : [],
      predictedStages: alert.predictedPath ? JSON.parse(alert.predictedPath) : [],
      deviationDetected: alert.pathDeviationDetected
    };
  },

  getRiskAssessment: async (alertId) => {
    const res = await fetch(`/api/alerts/${alertId}`);
    if (!res.ok) return null;
    const alert = await res.json();
    return {
      riskScore: alert.riskScore,
      riskLevel: alert.riskLevel,
      severity: alert.severity,
      priority: alert.priority
    };
  },

  // Simulate manual analysis run from the UI (mostly legacy demo flow, 
  // since server handles auto-detection for Brute Force now)
  analyzeEvent: async (eventId) => {
    // For this prototype phase, the backend automatically analyzes events. 
    // We'll just return a success payload or fetch the updated event if needed.
    return { status: 'Triggered analysis on backend' };
  },

  approveResponse: async (alertId) => {
    const res = await fetch(`/api/response/${alertId}/approve`, { 
      method: 'POST',
      headers: { 'x-user-role': 'ADMIN' }
    });
    return res.json();
  },

  rejectResponse: async (alertId) => {
    const res = await fetch(`/api/response/${alertId}/reject`, { 
      method: 'POST',
      headers: { 'x-user-role': 'ADMIN' }
    });
    return res.json();
  },
  
  getDashboardStats: async () => {
    const res = await fetch('/api/stats');
    return res.json();
  }
};
