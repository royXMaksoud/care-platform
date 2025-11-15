import { api } from '@/lib/axios';

// JWT authentication is automatically handled by the api instance from @/lib/axios
// The api instance includes the Authorization header with JWT token for all requests
// See: src/lib/axios.ts for configuration details

// Gateway Configuration (see gateway-service/application.yml):
// Route: /notification/** -> rewrites to /api/v1/notifications/**
// So we send to /notification/... and gateway rewrites it to /api/v1/notifications/...
const NOTIFICATION_API = '/notification';

/**
 * Notification API Integration
 * All API calls to notification service backend
 *
 * Authentication: JWT tokens are automatically included by the api instance
 * Base URL: Configured in @/lib/axios from VITE_API_BASE_URL
 */

// Helper to handle API errors gracefully
const handleApiError = (error) => {
  console.error('API Error:', error.message);
  if (error.response) {
    // Server responded with error status
    return error.response;
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server:', error.request);
  }
  throw error;
};

const notificationApi = {
  // ============ ANALYTICS ============
  getAnalyticsSummary: async () => {
    try {
      return await api.get(`${NOTIFICATION_API}/admin/analytics/summary`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  getChannelBreakdown: async () => {
    return api.get(`${NOTIFICATION_API}/admin/analytics/by-channel`);
  },

  getDailyBreakdown: async (startDate, endDate) => {
    return api.get(`${NOTIFICATION_API}/admin/analytics/daily-breakdown`, {
      params: { startDate, endDate },
    });
  },

  // ============ CAMPAIGNS ============
  getCampaigns: async (page = 1, size = 10, status = null) => {
    return api.get(`${NOTIFICATION_API}/admin/campaigns`, {
      params: { page, size, status },
    });
  },

  getCampaignById: async (campaignId) => {
    return api.get(`${NOTIFICATION_API}/admin/campaigns/${campaignId}`);
  },

  createCampaign: async (campaignData) => {
    return api.post(`${NOTIFICATION_API}/admin/campaigns`, campaignData);
  },

  updateCampaign: async (campaignId, campaignData) => {
    return api.put(`${NOTIFICATION_API}/admin/campaigns/${campaignId}`, campaignData);
  },

  deleteCampaign: async (campaignId) => {
    return api.delete(`${NOTIFICATION_API}/admin/campaigns/${campaignId}`);
  },

  sendCampaign: async (campaignId) => {
    return api.post(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/send`);
  },

  getCampaignProgress: async (campaignId) => {
    return api.get(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/progress`);
  },

  pauseCampaign: async (campaignId) => {
    return api.post(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/pause`);
  },

  resumeCampaign: async (campaignId) => {
    return api.post(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/resume`);
  },

  exportCampaignResults: async (campaignId) => {
    return api.get(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/export`, {
      responseType: 'blob',
    });
  },

  // ============ TEMPLATES ============
  getTemplates: async (page = 1, size = 100) => {
    return api.get(`${NOTIFICATION_API}/admin/templates`, {
      params: { page, size },
    });
  },

  getTemplateById: async (templateId) => {
    return api.get(`${NOTIFICATION_API}/admin/templates/${templateId}`);
  },

  createTemplate: async (templateData) => {
    return api.post(`${NOTIFICATION_API}/admin/templates`, templateData);
  },

  updateTemplate: async (templateId, templateData) => {
    return api.put(`${NOTIFICATION_API}/admin/templates/${templateId}`, templateData);
  },

  deleteTemplate: async (templateId) => {
    return api.delete(`${NOTIFICATION_API}/admin/templates/${templateId}`);
  },

  activateTemplate: async (templateId) => {
    return api.post(`${NOTIFICATION_API}/admin/templates/${templateId}/activate`);
  },

  previewTemplate: async (templateId, variables) => {
    return api.post(`${NOTIFICATION_API}/admin/templates/${templateId}/preview`, { variables });
  },

  // ============ USER PREFERENCES ============
  getUserPreferences: async (beneficiaryId) => {
    return api.get(`${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences`);
  },

  updateUserPreferences: async (beneficiaryId, preferences) => {
    return api.put(
      `${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences`,
      preferences
    );
  },

  verifyEmail: async (beneficiaryId, verificationCode) => {
    return api.post(
      `${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences/verify-email`,
      { verificationCode }
    );
  },

  verifyPhone: async (beneficiaryId, verificationCode) => {
    return api.post(
      `${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences/verify-phone`,
      { verificationCode }
    );
  },

  sendEmailVerificationCode: async (beneficiaryId) => {
    return api.post(
      `${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences/send-email-code`
    );
  },

  sendPhoneVerificationCode: async (beneficiaryId) => {
    return api.post(
      `${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notification-preferences/send-phone-code`
    );
  },

  // ============ NOTIFICATIONS ============
  getNotifications: async (beneficiaryId, page = 1, size = 20, status = null) => {
    return api.get(`${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/notifications`, {
      params: { page, size, status },
    });
  },

  getNotificationById: async (notificationId) => {
    return api.get(`${NOTIFICATION_API}/notifications/${notificationId}`);
  },

  sendNotification: async (notificationData) => {
    return api.post(`${NOTIFICATION_API}/notifications`, notificationData);
  },

  markNotificationAsRead: async (notificationId) => {
    return api.patch(`${NOTIFICATION_API}/notifications/${notificationId}/read`);
  },

  markNotificationsAsRead: async (notificationIds) => {
    return api.patch(`${NOTIFICATION_API}/notifications/read`, { notificationIds });
  },

  markNotificationAsUnread: async (notificationId) => {
    return api.patch(`${NOTIFICATION_API}/notifications/${notificationId}/unread`);
  },

  deleteNotification: async (notificationId) => {
    return api.delete(`${NOTIFICATION_API}/notifications/${notificationId}`);
  },

  // ============ LOGS & TRACKING ============
  getNotificationLogs: async (page = 1, size = 20, filters = {}) => {
    return api.get(`${NOTIFICATION_API}/admin/logs`, {
      params: { page, size, ...filters },
    });
  },

  getNotificationLog: async (logId) => {
    return api.get(`${NOTIFICATION_API}/admin/logs/${logId}`);
  },

  getLogsByNotificationId: async (notificationId) => {
    return api.get(`${NOTIFICATION_API}/admin/logs/notification/${notificationId}`);
  },

  exportLogs: async (filters = {}) => {
    return api.get(`${NOTIFICATION_API}/admin/logs/export`, {
      params: filters,
      responseType: 'blob',
    });
  },

  exportNotificationLogs: async (filters = {}) => {
    return api.get(`${NOTIFICATION_API}/admin/logs/export`, {
      params: filters,
      responseType: 'blob',
    });
  },

  // ============ WEBHOOKS ============
  getWebhookEvents: async (page = 1, size = 20, status = null) => {
    return api.get(`${NOTIFICATION_API}/admin/webhooks/events`, {
      params: { page, size, status },
    });
  },

  getWebhookEventsByNotificationId: async (notificationId) => {
    return api.get(`${NOTIFICATION_API}/admin/webhooks/notification/${notificationId}`);
  },

  // ============ BULK ACTIONS ============
  sendBulkNotifications: async (bulkData) => {
    return api.post(`${NOTIFICATION_API}/admin/bulk-send`, bulkData);
  },

  getBulkSendHistory: async (page = 1, size = 20) => {
    return api.get(`${NOTIFICATION_API}/admin/bulk-send/history`, {
      params: { page, size },
    });
  },

  // ============ SETTINGS ============
  getNotificationSettings: async () => {
    return api.get(`${NOTIFICATION_API}/admin/settings`);
  },

  updateNotificationSettings: async (settings) => {
    return api.put(`${NOTIFICATION_API}/admin/settings`, settings);
  },

  // ============ USER INBOX ============
  getInbox: async (beneficiaryId, page = 1, size = 20, unreadOnly = false) => {
    return api.get(`${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/inbox`, {
      params: { page, size, unreadOnly },
    });
  },

  getUserInbox: async (beneficiaryId, params = {}) => {
    return api.get(`${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/inbox`, {
      params,
    });
  },

  getInboxStats: async (beneficiaryId) => {
    return api.get(`${NOTIFICATION_API}/beneficiaries/${beneficiaryId}/inbox/stats`);
  },

  // ============ MANUAL SEND ============
  sendManualNotification: async (notificationData) => {
    return api.post(`${NOTIFICATION_API}/admin/send-manual`, notificationData);
  },

  // ============ BULK SEND ============
  sendBulkNotification: async (bulkData) => {
    return api.post(`${NOTIFICATION_API}/admin/bulk-send`, bulkData);
  },

  // ============ CAMPAIGN SCHEDULING ============
  scheduleCampaign: async (scheduleData) => {
    return api.post(`${NOTIFICATION_API}/admin/campaigns/schedule`, scheduleData);
  },

  getScheduledCampaigns: async () => {
    return api.get(`${NOTIFICATION_API}/admin/campaigns/scheduled`);
  },

  cancelScheduledCampaign: async (campaignId) => {
    return api.delete(`${NOTIFICATION_API}/admin/campaigns/${campaignId}/scheduled`);
  },

  // ============ ADMIN ACTIONS ============
  getRecentAdminActions: async (limit = 10) => {
    return api.get(`${NOTIFICATION_API}/admin/actions/recent`, {
      params: { limit },
    });
  },

  // ============ STATISTICS ============
  getStatistics: async (startDate, endDate) => {
    return api.get(`${NOTIFICATION_API}/admin/statistics`, {
      params: { startDate, endDate },
    });
  },
};

export { notificationApi };
