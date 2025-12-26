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
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/token/refresh', { refresh });
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
    const response = await apiClient.get('/progress/updates');
    return response.data.results || response.data;
  },

  listByTask: async (taskId: string): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get(`/progress/updates/?task=${taskId}`);
    return response.data.results || response.data;
  },

  get: async (id: string): Promise<ProgressUpdate> => {
    const response = await apiClient.get(`/progress/updates/${id}`);
    return response.data;
  },

  create: async (data: Partial<ProgressUpdate>): Promise<ProgressUpdate> => {
    const response = await apiClient.post('/progress/updates', data);
    return response.data;
  },

  myUpdates: async (): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get('/progress/updates/my_updates');
    return response.data;
  },

  recent: async (days?: number): Promise<ProgressUpdate[]> => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/progress/updates/recent', { params });
    return response.data;
  },

  blockedUpdates: async (): Promise<ProgressUpdate[]> => {
    const response = await apiClient.get('/progress/updates/blocked_updates');
    return response.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/progress/dashboard');
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

// Automation - Workflows API
export const workflowsApi = {
  list: async () => {
    const response = await apiClient.get('/automation/workflows/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/workflows/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/automation/workflows/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/workflows/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/workflows/${id}/`);
  },

  toggle: async (id: string) => {
    const response = await apiClient.post(`/automation/workflows/${id}/toggle/`);
    return response.data;
  },

  test: async (id: string, testData?: any) => {
    const response = await apiClient.post(`/automation/workflows/${id}/test/`, testData);
    return response.data;
  },

  getExecutions: async (workflowId?: string) => {
    const params = workflowId ? { workflow: workflowId } : {};
    const response = await apiClient.get('/automation/workflow-executions/', { params });
    return response.data.results || response.data;
  },
};

// Automation - Task Dependencies API
export const dependenciesApi = {
  list: async (taskId?: string) => {
    const params = taskId ? { task: taskId } : {};
    const response = await apiClient.get('/automation/task-dependencies/', { params });
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/task-dependencies/${id}/`);
    return response.data;
  },

  create: async (data: { predecessor: string; successor: string; dependency_type: string; lag_days?: number; auto_adjust_dates?: boolean }) => {
    const response = await apiClient.post('/automation/task-dependencies/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/task-dependencies/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/task-dependencies/${id}/`);
  },

  getChain: async (taskId: string, direction?: 'upstream' | 'downstream') => {
    const params = direction ? { direction } : {};
    const response = await apiClient.get(`/automation/task-dependencies/chain/${taskId}/`, { params });
    return response.data;
  },

  getBottlenecks: async (severity?: string) => {
    const params = severity ? { severity } : {};
    const response = await apiClient.get('/automation/dependency-bottlenecks/', { params });
    return response.data.results || response.data;
  },

  resolveBottleneck: async (id: string) => {
    const response = await apiClient.post(`/automation/dependency-bottlenecks/${id}/resolve/`);
    return response.data;
  },
};

// Automation - Escalations API
export const escalationsApi = {
  listRules: async () => {
    const response = await apiClient.get('/automation/escalation-rules/');
    return response.data.results || response.data;
  },

  getRule: async (id: string) => {
    const response = await apiClient.get(`/automation/escalation-rules/${id}/`);
    return response.data;
  },

  createRule: async (data: any) => {
    const response = await apiClient.post('/automation/escalation-rules/', data);
    return response.data;
  },

  updateRule: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/escalation-rules/${id}/`, data);
    return response.data;
  },

  deleteRule: async (id: string) => {
    await apiClient.delete(`/automation/escalation-rules/${id}/`);
  },

  list: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/automation/escalations/', { params });
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/escalations/${id}/`);
    return response.data;
  },

  acknowledge: async (id: string) => {
    const response = await apiClient.post(`/automation/escalations/${id}/acknowledge/`);
    return response.data;
  },

  startProgress: async (id: string) => {
    const response = await apiClient.post(`/automation/escalations/${id}/start_progress/`);
    return response.data;
  },

  resolve: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/automation/escalations/${id}/resolve/`, { resolution_notes: notes });
    return response.data;
  },

  dismiss: async (id: string, notes?: string) => {
    const response = await apiClient.post(`/automation/escalations/${id}/dismiss/`, { resolution_notes: notes });
    return response.data;
  },
};

// Automation - Calendar Events API
export const calendarEventsApi = {
  list: async (params?: { start_date?: string; end_date?: string; event_type?: string }) => {
    const response = await apiClient.get('/automation/calendar-events/', { params });
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/calendar-events/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/automation/calendar-events/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/calendar-events/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/calendar-events/${id}/`);
  },

  syncFromTasks: async () => {
    const response = await apiClient.post('/automation/calendar-events/sync_from_tasks/');
    return response.data;
  },

  getSuggestions: async () => {
    const response = await apiClient.get('/automation/schedule-suggestions/');
    return response.data.results || response.data;
  },

  acceptSuggestion: async (id: string) => {
    const response = await apiClient.post(`/automation/schedule-suggestions/${id}/accept/`);
    return response.data;
  },

  dismissSuggestion: async (id: string) => {
    const response = await apiClient.post(`/automation/schedule-suggestions/${id}/dismiss/`);
    return response.data;
  },
};

// Automation - Chat Integrations API
export const chatIntegrationsApi = {
  list: async () => {
    const response = await apiClient.get('/automation/chat-integrations/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/chat-integrations/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/automation/chat-integrations/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/chat-integrations/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/chat-integrations/${id}/`);
  },

  test: async (id: string, message?: string) => {
    const response = await apiClient.post(`/automation/chat-integrations/${id}/test/`, { message });
    return response.data;
  },

  handleWebhook: async (platform: string, data: any) => {
    const response = await apiClient.post(`/automation/chat-integrations/webhook/${platform}/`, data);
    return response.data;
  },
};

// Automation - Git Integrations API
export const gitIntegrationsApi = {
  list: async () => {
    const response = await apiClient.get('/automation/git-integrations/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/git-integrations/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/automation/git-integrations/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/git-integrations/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/git-integrations/${id}/`);
  },

  syncRepos: async (id: string) => {
    const response = await apiClient.post(`/automation/git-integrations/${id}/sync_repos/`);
    return response.data;
  },

  listRepos: async (integrationId?: string) => {
    const params = integrationId ? { integration: integrationId } : {};
    const response = await apiClient.get('/automation/git-repositories/', { params });
    return response.data.results || response.data;
  },

  linkRepo: async (data: { integration: string; project: string; repo_id: string; repo_name: string; repo_full_name: string; repo_url: string }) => {
    const response = await apiClient.post('/automation/git-repositories/', data);
    return response.data;
  },

  handleWebhook: async (platform: string, data: any) => {
    const response = await apiClient.post(`/automation/git-integrations/webhook/${platform}/`, data);
    return response.data;
  },
};

// Automation - Personalized Dashboards API
export const dashboardsApi = {
  list: async () => {
    const response = await apiClient.get('/automation/personalized-dashboards/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/personalized-dashboards/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/automation/personalized-dashboards/', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/personalized-dashboards/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/automation/personalized-dashboards/${id}/`);
  },

  setDefault: async (id: string) => {
    const response = await apiClient.post(`/automation/personalized-dashboards/${id}/set_default/`);
    return response.data;
  },

  addWidget: async (dashboardId: string, data: any) => {
    const response = await apiClient.post('/automation/dashboard-widgets/', { dashboard: dashboardId, ...data });
    return response.data;
  },

  updateWidget: async (widgetId: string, data: any) => {
    const response = await apiClient.patch(`/automation/dashboard-widgets/${widgetId}/`, data);
    return response.data;
  },

  deleteWidget: async (widgetId: string) => {
    await apiClient.delete(`/automation/dashboard-widgets/${widgetId}/`);
  },
};

// Automation - Burnout Detection API
export const burnoutApi = {
  getIndicators: async (riskLevel?: string) => {
    const params = riskLevel ? { risk_level: riskLevel } : {};
    const response = await apiClient.get('/automation/burnout-indicators/', { params });
    return response.data.results || response.data;
  },

  getIndicator: async (id: string) => {
    const response = await apiClient.get(`/automation/burnout-indicators/${id}/`);
    return response.data;
  },

  getMyIndicator: async () => {
    const response = await apiClient.get('/automation/burnout-indicators/my_indicator/');
    return response.data;
  },

  getTeamIndicators: async () => {
    const response = await apiClient.get('/automation/burnout-indicators/team_overview/');
    return response.data;
  },

  addressIndicator: async (id: string, notes: string) => {
    const response = await apiClient.post(`/automation/burnout-indicators/${id}/address/`, { notes });
    return response.data;
  },

  getWorkloadSnapshots: async (userId?: string, days?: number) => {
    const params: any = {};
    if (userId) params.user = userId;
    if (days) params.days = days;
    const response = await apiClient.get('/automation/workload-snapshots/', { params });
    return response.data.results || response.data;
  },

  getMySnapshots: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await apiClient.get('/automation/workload-snapshots/my_snapshots/', { params });
    return response.data;
  },
};

// Automation - Location Tracking API
export const locationTrackingApi = {
  listLocations: async () => {
    const response = await apiClient.get('/automation/location-configs/');
    return response.data.results || response.data;
  },

  getLocation: async (id: string) => {
    const response = await apiClient.get(`/automation/location-configs/${id}/`);
    return response.data;
  },

  createLocation: async (data: any) => {
    const response = await apiClient.post('/automation/location-configs/', data);
    return response.data;
  },

  updateLocation: async (id: string, data: any) => {
    const response = await apiClient.patch(`/automation/location-configs/${id}/`, data);
    return response.data;
  },

  deleteLocation: async (id: string) => {
    await apiClient.delete(`/automation/location-configs/${id}/`);
  },

  checkIn: async (locationId: string, lat: number, lon: number) => {
    const response = await apiClient.post(`/automation/location-configs/${locationId}/check_in/`, {
      latitude: lat,
      longitude: lon,
    });
    return response.data;
  },

  listCheckIns: async (locationId?: string) => {
    const params = locationId ? { location_config: locationId } : {};
    const response = await apiClient.get('/automation/location-check-ins/', { params });
    return response.data.results || response.data;
  },

  getActiveCheckIn: async () => {
    const response = await apiClient.get('/automation/location-check-ins/active/');
    return response.data;
  },

  checkOut: async (checkInId: string, lat: number, lon: number) => {
    const response = await apiClient.post(`/automation/location-check-ins/${checkInId}/check_out/`, {
      latitude: lat,
      longitude: lon,
    });
    return response.data;
  },
};

// Automation - Voice Commands API
export const voiceCommandsApi = {
  list: async () => {
    const response = await apiClient.get('/automation/voice-commands/');
    return response.data.results || response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/automation/voice-commands/${id}/`);
    return response.data;
  },

  process: async (transcript: string) => {
    const response = await apiClient.post('/automation/voice-commands/process/', { transcript });
    return response.data;
  },
};

// Automation - Resource Allocation API
export const resourceAllocationApi = {
  getSuggestions: async (type?: string) => {
    const params = type ? { suggestion_type: type } : {};
    const response = await apiClient.get('/automation/resource-suggestions/', { params });
    return response.data.results || response.data;
  },

  getSuggestion: async (id: string) => {
    const response = await apiClient.get(`/automation/resource-suggestions/${id}/`);
    return response.data;
  },

  applySuggestion: async (id: string) => {
    const response = await apiClient.post(`/automation/resource-suggestions/${id}/apply/`);
    return response.data;
  },

  dismissSuggestion: async (id: string) => {
    const response = await apiClient.post(`/automation/resource-suggestions/${id}/dismiss/`);
    return response.data;
  },

  recommendAssignee: async (taskId: string) => {
    const response = await apiClient.post('/automation/resource-suggestions/recommend_assignee/', { task_id: taskId });
    return response.data;
  },

  getWorkloadAnalysis: async () => {
    const response = await apiClient.get('/automation/resource-suggestions/workload_analysis/');
    return response.data;
  },
};

// Export the base api client for custom requests
export { apiClient as api };
