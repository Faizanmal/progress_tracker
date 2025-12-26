/**
 * API Client for Progress Tracker
 */
import apiClient from '@/src/lib/api';
import type {
  User,
  Company,
  Project,
  Task,
  ProgressUpdate,
  Notification,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  DashboardData,
  TeamProgressSummary
} from '../types';

// Re-export meeting templates and integrations from api
import { templatesAPI, integrationsAPI } from '@/src/lib/api';

export const templatesApi = templatesAPI;
export const integrationsApi = integrationsAPI;

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile/', data);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/token/refresh/', { refresh });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects/');
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post('/projects/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/`);
  },

  getTasks: async (id: string): Promise<Task[]> => {
    const response = await apiClient.get(`/projects/${id}/tasks/`);
    return response.data;
  },

  addMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/projects/${id}/add_member/`, { user_id: userId });
  },

  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/projects/${id}/remove_member/`, { user_id: userId });
  },
};

// Tasks API
export const tasksApi = {
  list: async (params?: {
    project?: string;
    status?: string;
    priority?: string;
  }): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/', { params });
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}/`);
    return response.data;
  },

  retrieve: async (id: string): Promise<Task> => {
    return tasksApi.get(id);
  },

  listByTask: async (taskId: string): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get(`/progress-updates/?task=${taskId}`);
    return response.data.results || response.data;
  },

  create: async (data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post('/tasks/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    const response = await apiClient.patch(`/tasks/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}/`);
  },

  myTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/my_tasks/');
    return response.data;
  },

  overdue: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/overdue/');
    return response.data;
  },

  blocked: async (): Promise<Task[]> => {
    const response = await apiClient.get('/tasks/blocked/');
    return response.data;
  },

  getProgressHistory: async (id: string): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get(`/tasks/${id}/progress_history/`);
    return response.data;
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await apiClient.post(`/tasks/${id}/add_comment/`, { text });
  },
};

// Progress API
export const progressApi = {
  list: async (): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get('/progress/updates/');
    return response.data.results || response.data;
  },

  listByTask: async (taskId: string): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get(`/progress/updates/?task=${taskId}`);
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<ProgressUpdate> => {
    const response = await apiClient.get(`/progress/updates/${id}/`);
    return response.data;
  },

  create: async (data: Partial<ProgressUpdate>): Promise<ProgressUpdate> => {
    const response = await apiClient.post('/progress/updates/', data);
    return response.data;
  },

  myUpdates: async (): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get('/progress/updates/my_updates/');
    return response.data;
  },

  recent: async (days?: number): Promise<ProgressUpdate[]> => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/progress/updates/recent/', { params });
    return response.data;
  },

  blockedUpdates: async (): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get('/progress/updates/blocked_updates/');
    return response.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/progress/dashboard/');
    return response.data;
  },

  getTeamSummary: async (): Promise<TeamProgressSummary[]> => {
    const response = await apiClient.get('/progress/team-summary/');
    return response.data;
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await apiClient.post(`/progress/updates/${id}/add_comment/`, { text });
  },
};

// Notifications API
export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/');
    return response.data.results || response.data;
  },

  unread: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/unread/');
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/mark_read/`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark_all_read/');
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}/`);
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/notifications/clear_all/');
  },
};

// Notification Preferences API
export const notificationPreferencesApi = {
  get: async () => {
    const response = await apiClient.get('/notification-preferences/');
    return response.data;
  },

  update: async (data: unknown) => {
    const response = await apiClient.put('/notification-preferences/update_preferences/', data);
    return response.data;
  },
};

// Webhooks API (Admin only)
export const webhooksApi = {
  list: async () => {
    const response = await apiClient.get('/webhooks/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/webhooks/${id}/`);
    return response.data;
  },

  create: async (data: {
    name: string;
    integration_type: string;
    webhook_url: string;
    notify_task_assigned?: boolean;
    notify_task_blocked?: boolean;
    notify_task_completed?: boolean;
    notify_progress_update?: boolean;
    notify_milestone?: boolean;
  }) => {
    const response = await apiClient.post('/webhooks/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/webhooks/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/webhooks/${id}/`);
  },

  test: async (id: string) => {
    const response = await apiClient.post(`/webhooks/${id}/test/`);
    return response.data;
  },

  toggle: async (id: string) => {
    const response = await apiClient.post(`/webhooks/${id}/toggle/`);
    return response.data;
  },
};

// Calendar Integrations API
export const calendarApi = {
  list: async () => {
    const response = await apiClient.get('/calendar-integrations/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/calendar-integrations/${id}/`);
    return response.data;
  },

  create: async (data: {
    calendar_type: string;
    access_token?: string;
    refresh_token?: string;
    sync_tasks?: boolean;
    sync_deadlines?: boolean;
    sync_milestones?: boolean;
  }) => {
    const response = await apiClient.post('/calendar-integrations/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/calendar-integrations/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/calendar-integrations/${id}/`);
  },

  sync: async (id: string) => {
    const response = await apiClient.post(`/calendar-integrations/${id}/sync/`);
    return response.data;
  },

  disconnect: async (id: string) => {
    const response = await apiClient.post(`/calendar-integrations/${id}/disconnect/`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/');
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  teamMembers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/team_members/');
    return response.data;
  },

  // Backwards-compat alias used in some dashboard components
  listTeamMembers: async (): Promise<User[]> => {
    return await usersApi.teamMembers();
  },

  employees: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/employees/');
    return response.data;
  },
  
  getTeamProgress: async (): Promise<any> => {
    const response = await apiClient.get('/users/team_progress/');
    return response.data;
  },
};

// Company API
export const companyApi = {
  get: async (): Promise<Company> => {
    const response = await apiClient.get('/companies/');
    return response.data[0] || response.data;
  },

  update: async (id: string, data: Partial<Company>): Promise<Company> => {
    const response = await apiClient.patch(`/companies/${id}/`, data);
    return response.data;
  },
  // Legacy helper names
  getCompany: async (): Promise<Company> => {
    return await companyApi.get();
  },
  getDashboard: async (): Promise<DashboardData> => {
    return await progressApi.getDashboard();
  },
};

// Forms API (FormForge integration)
export const formsApi = {
  list: async (): Promise<any[]> => {
    const response = await apiClient.get('/forms/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/forms/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/forms/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/forms/${id}/`, data);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await apiClient.post(`/forms/${id}/publish/`);
    return response.data;
  },

  getAnalytics: async (id: string) => {
    const response = await apiClient.get(`/forms/${id}/analytics/`);
    return response.data;
  },
};

// Submissions API for forms
export const submissionsApi = {
  list: async (formId: string) => {
    const response = await apiClient.get(`/forms/${formId}/submissions/`);
    return response.data.results || response.data;
  },

  submit: async (slugOrId: string, payload: Record<string, any>) => {
    // Accept slug or id for submit endpoint
    const response = await apiClient.post(`/forms/submit/${slugOrId}/`, payload);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  // Time Entries
  getTimeEntries: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/analytics/time-entries/my_entries/', { params });
    return response.data;
  },

  startTimer: async (taskId: string, description?: string, isBillable?: boolean) => {
    const response = await apiClient.post('/analytics/time-entries/start_timer/', {
      task: taskId,
      description,
      is_billable: isBillable ?? true
    });
    return response.data;
  },

  stopTimer: async () => {
    const response = await apiClient.post('/analytics/time-entries/stop_timer/');
    return response.data;
  },

  getCurrentTimer: async () => {
    const response = await apiClient.get('/analytics/time-entries/current/');
    return response.data;
  },

  getTimeSummary: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/analytics/time-entries/summary/', { params });
    return response.data;
  },

  // Timesheets
  getTimesheets: async (params?: any) => {
    const response = await apiClient.get('/analytics/timesheets/', { params });
    return response.data.results || response.data;
  },

  generateCurrentWeekTimesheet: async () => {
    const response = await apiClient.post('/analytics/timesheets/generate_current_week/');
    return response.data;
  },

  submitTimesheet: async (id: string) => {
    const response = await apiClient.post(`/analytics/timesheets/${id}/submit/`);
    return response.data;
  },

  approveTimesheet: async (id: string, reviewNotes?: string) => {
    const response = await apiClient.post(`/analytics/timesheets/${id}/approve/`, { review_notes: reviewNotes });
    return response.data;
  },

  rejectTimesheet: async (id: string, reason: string) => {
    const response = await apiClient.post(`/analytics/timesheets/${id}/reject/`, { reason });
    return response.data;
  },

  // Reports
  getReports: async () => {
    const response = await apiClient.get('/analytics/reports/');
    return response.data.results || response.data;
  },

  getReport: async (id: string) => {
    const response = await apiClient.get(`/analytics/reports/${id}/`);
    return response.data;
  },

  createReport: async (data: any) => {
    const response = await apiClient.post('/analytics/reports/', data);
    return response.data;
  },

  generateReport: async (id: string) => {
    const response = await apiClient.post(`/analytics/reports/${id}/generate/`);
    return response.data;
  },

  getReportSnapshots: async (id: string) => {
    const response = await apiClient.get(`/analytics/reports/${id}/snapshots/`);
    return response.data;
  },

  deleteReport: async (id: string) => {
    await apiClient.delete(`/analytics/reports/${id}/`);
  },

  exportReport: async (id: string, format: 'pdf' | 'csv' | 'excel') => {
    const response = await apiClient.get(`/analytics/reports/${id}/export/`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Project Templates
  createProjectTemplate: async (data: any) => {
    const response = await apiClient.post('/analytics/templates/', data);
    return response.data;
  },

  deleteProjectTemplate: async (id: string) => {
    await apiClient.delete(`/analytics/templates/${id}/`);
  },

  useProjectTemplate: async (id: string, data: { project_name: string; project_description?: string; start_date?: string }) => {
    const response = await apiClient.post(`/analytics/templates/${id}/create_project/`, data);
    return response.data;
  },

  // Dashboard
  getAnalyticsDashboard: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/analytics/dashboard/', { params });
    return response.data;
  },

  getProductivityAnalytics: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/analytics/productivity/', { params });
    return response.data;
  },

  getBurndownData: async (projectId: string) => {
    const response = await apiClient.get(`/analytics/burndown/${projectId}/`);
    return response.data;
  },

  // Templates
  getProjectTemplates: async () => {
    const response = await apiClient.get('/analytics/templates/');
    return response.data.results || response.data;
  },

  createProjectFromTemplate: async (templateId: string, data: { title: string; description?: string }) => {
    const response = await apiClient.post(`/analytics/templates/${templateId}/create_project/`, data);
    return response.data;
  },

  // Milestones
  getMilestones: async (projectId?: string) => {
    const params = projectId ? { project: projectId } : {};
    const response = await apiClient.get('/analytics/milestones/', { params });
    return response.data.results || response.data;
  },

  createMilestone: async (data: any) => {
    const response = await apiClient.post('/analytics/milestones/', data);
    return response.data;
  },

  completeMilestone: async (id: string) => {
    const response = await apiClient.post(`/analytics/milestones/${id}/complete/`);
    return response.data;
  },

  // Dependencies
  getTaskDependencies: async (taskId?: string) => {
    const params = taskId ? { task: taskId } : {};
    const response = await apiClient.get('/analytics/dependencies/', { params });
    return response.data.results || response.data;
  },

  createTaskDependency: async (data: { task: string; depends_on: string; dependency_type: string }) => {
    const response = await apiClient.post('/analytics/dependencies/', data);
    return response.data;
  },
};

// AI Insights API
export const aiApi = {
  // Predictions
  getPredictions: async () => {
    const response = await apiClient.get('/ai/predictions/');
    return response.data.results || response.data;
  },

  predictTask: async (taskId: string) => {
    const response = await apiClient.post('/ai/predictions/predict/', { task_id: taskId });
    return response.data;
  },

  // Recommendations
  getRecommendations: async () => {
    const response = await apiClient.get('/ai/recommendations/');
    return response.data.results || response.data;
  },

  suggestAssignee: async (taskId: string) => {
    const response = await apiClient.post('/ai/recommendations/suggest_assignee/', { task_id: taskId });
    return response.data;
  },

  applyRecommendation: async (id: string) => {
    const response = await apiClient.post(`/ai/recommendations/${id}/apply/`);
    return response.data;
  },

  dismissRecommendation: async (id: string) => {
    const response = await apiClient.post(`/ai/recommendations/${id}/dismiss/`);
    return response.data;
  },

  // Summaries
  getSummaries: async () => {
    const response = await apiClient.get('/ai/summaries/');
    return response.data.results || response.data;
  },

  getMySummaries: async () => {
    const response = await apiClient.get('/ai/summaries/my_summaries/');
    return response.data;
  },

  generateSummary: async () => {
    const response = await apiClient.post('/ai/summaries/generate/');
    return response.data;
  },

  // Anomalies
  getAnomalies: async () => {
    const response = await apiClient.get('/ai/anomalies/');
    return response.data.results || response.data;
  },

  scanForAnomalies: async () => {
    const response = await apiClient.post('/ai/anomalies/scan/');
    return response.data;
  },

  resolveAnomaly: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/ai/anomalies/${id}/resolve/`, { notes });
    return response.data;
  },

  // Dashboard
  getAIDashboard: async () => {
    const response = await apiClient.get('/ai/dashboard/');
    return response.data;
  },
};

// Export the base api client for custom requests
export { apiClient as api };
