/**
 * Type definitions for Progress Tracker
 */

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  profile_picture?: string;
  phone?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  company?: string;
  manager?: string;
  date_joined: string;
  last_login?: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_active: boolean;
  subscription_expires?: string;
  max_users: number;
  allow_google_oauth: boolean;
  created_at: string;
  updated_at: string;
}

// Project Types
export interface Project {
  id: string;
  title: string;
  name: string; // Required
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  created_by_name?: string;
  manager_name?: string;
  company: string;
  company_name?: string;
  team_members: string[];
  team_members_detail?: User[];
  team_members_details?: User[]; // Alias
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  task_count?: number;
  completed_task_count?: number;
  created_at: string;
  updated_at: string;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'blocked' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: string;
  project_title?: string;
  project_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  created_by: string;
  created_by_name?: string;
  progress_percentage: number;
  estimated_hours?: number;
  actual_hours: number;
  deadline?: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  is_overdue: boolean;
  is_blocked: boolean;
  blocker_description?: string;
  tags?: string;
  progress_updates_count?: number;
  created_at: string;
  updated_at: string;
}

// Progress Update Types
export interface ProgressUpdate {
  id: string;
  task: string;
  task_title?: string;
  task_project?: string;
  user: string;
  user_name?: string;
  submitted_by_name?: string;
  user_avatar?: string;
  progress_percentage: number;
  status: 'on_track' | 'at_risk' | 'blocked' | 'waiting' | 'completed' | 'in_progress';
  work_done: string;
  description?: string;
  next_steps?: string;
  blockers?: string;
  blocker_description?: string;
  hours_worked: number;
  links?: string;
  links_list?: string[];
  comments?: ProgressComment[];
  attachments?: ProgressAttachment[];
  created_at: string;
  updated_at: string;
}

export interface ProgressComment {
  id: string;
  progress_update: string;
  user: string;
  user_name: string;
  user_avatar?: string;
  user_role: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressAttachment {
  id: string;
  progress_update: string;
  file: string;
  filename: string;
  uploaded_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user: string;
  notification_type: 'task_assigned' | 'task_blocked' | 'task_overdue' | 'progress_update' | 'comment_added' | 'reminder';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// Auth Types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  password_confirm: string;
  company_name?: string;
  role?: 'admin' | 'manager' | 'employee';
}

// Dashboard Types
export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  total_users?: number;
  total_projects?: number;
  total_tasks?: number;
  completed_tasks?: number;
  total_progress_updates?: number;
  tasks: {
    total: number;
    open: number;
    in_progress: number;
    blocked: number;
    completed: number;
    overdue: number;
  };
  progress: {
    updates_last_30_days: number;
    total_hours_worked: number;
    avg_progress: number;
  };
  recent_updates: ProgressUpdate[];
}

export interface TeamProgressSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  recent_updates_count: number;
  avg_progress: number;
  average_progress_percentage?: number;
  total_hours_worked: number;
  active_members?: number;
}

// Filter/Query Types
export interface TaskFilters {
  project?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
}

// FormForge / Forms Types
export interface FormFieldOption {
  id?: string;
  label: string;
  value?: string;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
  options?: string[] | FormFieldOption[];
}

export interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
  logic?: Array<{
    if: { field: string; operator: string; value: unknown };
    show?: string[];
    hide?: string[];
  }>;
  settings?: { consent_text?: string; redirect?: string };
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  schema_json: FormSchema;
  views_count?: number;
  submissions_count?: number;
  conversion_rate?: number;
  published_at?: string | null;
  created_at?: string;
}

export interface Submission {
  id: string;
  form: string;
  created_at: string;
  ip_address?: string | null;
  payload_json: Record<string, unknown>;
}

export interface Analytics {
  views?: number;
  submissions?: number;
  conversion_rate?: number;
  recent_submissions?: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  schema_json?: FormSchema;
}

// Analytics Types
export interface TimeEntry {
  id: string;
  user: string;
  user_name?: string;
  task: string;
  task_title?: string;
  project_title?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  duration_hours?: number;
  description?: string;
  is_billable: boolean;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  id: string;
  user: string;
  user_name?: string;
  week_start: string;
  week_end: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  status_display?: string;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  total_hours: number;
  billable_hours: number;
  entries_count?: number;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  report_type: 'productivity' | 'time_summary' | 'task_completion' | 'project_status' | 'team_performance' | 'custom';
  report_type_display?: string;
  config: Record<string, unknown>;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  schedule?: string;
  next_run?: string;
  last_run?: string;
  last_generated?: string;
  recipients: string[];
  send_email: boolean;
  created_by: string;
  created_by_name?: string;
  company: string;
  is_active: boolean;
  is_scheduled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportSnapshot {
  id: string;
  report: string;
  report_name?: string;
  data: Record<string, unknown>;
  generated_at: string;
  file_pdf?: string;
  file_csv?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  default_status: string;
  default_priority: string;
  estimated_duration_days: number;
  task_templates: TaskTemplate[];
  default_tasks?: TaskTemplate[];
  workflow_stages: string[];
  settings?: {
    default_duration_days?: number;
  };
  company: string;
  created_by: string;
  created_by_name?: string;
  is_public: boolean;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  title: string;
  description?: string;
  priority?: string;
  estimated_hours?: number;
}

export interface TaskDependency {
  id: string;
  task: string;
  task_title?: string;
  depends_on: string;
  depends_on_title?: string;
  dependency_type: 'blocks' | 'blocked_by' | 'related';
  dependency_type_display?: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  project: string;
  project_title?: string;
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
  tasks: string[];
  task_count?: number;
  progress?: number;
  created_at: string;
  updated_at: string;
}

// AI Insights Types
export interface TaskPrediction {
  id: string;
  task: string;
  task_title?: string;
  predicted_completion_date?: string;
  confidence_score: number;
  estimated_hours_remaining?: number;
  risk_score: number;
  risk_factors: string[];
  model_version: string;
  generated_at: string;
}

export interface TaskRecommendation {
  id: string;
  task: string;
  task_title?: string;
  recommendation_type: 'assignment' | 'reassignment' | 'workload' | 'priority';
  recommendation_type_display?: string;
  recommended_users: string[];
  recommended_users_detail?: { id: string; name: string; email: string }[];
  reason: string;
  confidence_score: number;
  factors: Record<string, unknown>;
  is_applied: boolean;
  applied_at?: string;
  dismissed: boolean;
  created_at: string;
}

export interface WeeklySummary {
  id: string;
  user: string;
  user_name?: string;
  company: string;
  week_start: string;
  week_end: string;
  summary_text: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  metrics: Record<string, unknown>;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

export interface AnomalyDetection {
  id: string;
  anomaly_type: 'blocked_pattern' | 'productivity_drop' | 'overtime' | 'missed_deadlines' | 'workload_imbalance';
  anomaly_type_display?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_display?: string;
  user?: string;
  user_name?: string;
  project?: string;
  project_title?: string;
  company: string;
  title: string;
  description: string;
  data_points: unknown[];
  suggested_actions: string[];
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  detected_at: string;
}

// Notification Preferences Types
export interface NotificationPreference {
  id: string;
  user: string;
  // Email preferences
  email_task_assigned: boolean;
  email_task_blocked: boolean;
  email_task_overdue: boolean;
  email_progress_update: boolean;
  email_comment_added: boolean;
  email_reminder: boolean;
  email_timesheet: boolean;
  email_milestone: boolean;
  email_report: boolean;
  email_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  // Push preferences
  push_enabled: boolean;
  push_task_assigned: boolean;
  push_task_blocked: boolean;
  push_task_overdue: boolean;
  push_progress_update: boolean;
  push_comment_added: boolean;
  push_reminder: boolean;
  // In-app
  inapp_enabled: boolean;
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  // Webhook
  webhook_url?: string;
  webhook_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookIntegration {
  id: string;
  company: string;
  name: string;
  integration_type: 'slack' | 'teams' | 'discord' | 'custom';
  integration_type_display?: string;
  webhook_url: string;
  notify_task_assigned: boolean;
  notify_task_blocked: boolean;
  notify_task_completed: boolean;
  notify_progress_update: boolean;
  notify_milestone: boolean;
  is_active: boolean;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_integration: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  request_data: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  response_status_code?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarIntegration {
  id: string;
  user: string;
  calendar_type: 'google' | 'outlook' | 'apple';
  calendar_type_display?: string;
  sync_tasks: boolean;
  sync_deadlines: boolean;
  sync_milestones: boolean;
  is_active: boolean;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

// Analytics Dashboard Types
export interface AnalyticsDashboard {
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    blocked: number;
    overdue: number;
    completed_this_period: number;
  };
  time: {
    total_hours: number;
    billable_hours: number;
    by_day: { date: string; minutes: number }[];
  };
  completion_trend: { week: string; count: number }[];
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  period_days: number;
}

export interface BurndownData {
  project_id: string;
  project_title: string;
  total_tasks: number;
  data: {
    date: string;
    ideal_remaining: number;
    actual_remaining: number;
    completed: number;
  }[];
}

// AI Dashboard Types
export interface AIInsightsDashboard {
  predictions: {
    recent: TaskPrediction[];
    high_risk: TaskPrediction[];
  };
  recommendations: {
    pending_count: number;
  };
  anomalies: {
    unresolved_count: number;
    by_severity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recent: AnomalyDetection[];
  };
  summary: WeeklySummary | null;
}

// ============================================================================
// NEW FEATURE TYPES
// ============================================================================

// Workflow Automation Types
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_type_display?: string;
  trigger_config: Record<string, unknown>;
  project_filter?: string;
  is_active: boolean;
  execution_count: number;
  last_executed?: string;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowCondition {
  id: string;
  condition_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

export interface WorkflowAction {
  id: string;
  action_type: string;
  config: Record<string, unknown>;
  order: number;
  is_active: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflow: string;
  workflow_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  trigger_data: Record<string, unknown>;
  result_data: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
}

// Task Dependency Types (Project Management style - predecessor/successor)
export interface TaskScheduleDependency {
  id: string;
  predecessor: string;
  predecessor_title?: string;
  successor: string;
  successor_title?: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  dependency_type_display?: string;
  lag_days: number;
  auto_adjust_dates: boolean;
  created_at: string;
}

export interface DependencyBottleneck {
  id: string;
  task: string;
  task_title?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_display?: string;
  blocking_count: number;
  cascade_delay_days: number;
  affected_deadline?: string;
  delay_probability: number;
  suggested_actions: { action: string; description: string; priority: string }[];
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

// Escalation Types
export interface EscalationRule {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_type_display?: string;
  trigger_after_hours: number;
  priority_filter?: string;
  project_filter?: string;
  escalate_to_manager: boolean;
  escalate_to_users: string[];
  send_email: boolean;
  send_notification: boolean;
  send_slack: boolean;
  auto_reassign: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Escalation {
  id: string;
  task: string;
  task_title?: string;
  rule?: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  status_display?: string;
  reason: string;
  suggested_actions: { action: string; description: string }[];
  escalated_to: string[];
  escalated_to_names?: string[];
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'task_deadline' | 'meeting' | 'milestone' | 'reminder' | 'external';
  event_type_display?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  is_recurring: boolean;
  recurrence_rule?: string;
  task?: string;
  task_title?: string;
  project?: string;
  project_title?: string;
  external_id?: string;
  external_source?: string;
  external_link?: string;
  is_synced: boolean;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSuggestion {
  id: string;
  task: string;
  task_title?: string;
  suggested_start: string;
  suggested_end: string;
  reason: string;
  confidence_score: number;
  conflicts_avoided: { title: string; start: string; end?: string }[];
  is_accepted: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// Integration Types
export interface ChatIntegration {
  id: string;
  platform: 'slack' | 'teams' | 'discord';
  platform_display?: string;
  workspace_id: string;
  workspace_name: string;
  default_channel_id?: string;
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  notify_daily_standup: boolean;
  standup_time?: string;
  is_active: boolean;
  created_at: string;
}

export interface GitIntegration {
  id: string;
  platform: 'github' | 'gitlab' | 'bitbucket';
  platform_display?: string;
  organization?: string;
  sync_issues: boolean;
  sync_pull_requests: boolean;
  auto_create_tasks: boolean;
  auto_update_progress: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GitRepository {
  id: string;
  integration: string;
  project: string;
  repo_id: string;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  sync_enabled: boolean;
  last_synced?: string;
  created_at: string;
}

// Dashboard Types
export interface PersonalizedDashboard {
  id: string;
  name: string;
  is_default: boolean;
  layout: DashboardLayoutItem[];
  auto_refresh: boolean;
  refresh_interval_seconds: number;
  widgets?: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export interface DashboardLayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidgetItem {
  id: string;
  widget_type: string;
  widget_type_display?: string;
  title?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// Burnout Detection Types
export interface BurnoutIndicator {
  id: string;
  user: string;
  user_name?: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_level_display?: string;
  risk_score: number;
  factors: Record<string, unknown>;
  avg_hours_per_week: number;
  consecutive_overtime_weeks: number;
  tasks_overdue: number;
  no_break_days: number;
  meeting_hours: number;
  progress_update_sentiment: number;
  recommendations: BurnoutRecommendation[];
  manager_notified: boolean;
  manager_notified_at?: string;
  is_addressed: boolean;
  addressed_at?: string;
  addressed_notes?: string;
  created_at: string;
}

export interface BurnoutRecommendation {
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkloadSnapshot {
  id: string;
  user: string;
  date: string;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  hours_worked: number;
  meeting_hours: number;
  overtime_hours: number;
  tasks_started: number;
  tasks_completed_on_time: number;
  progress_updates: number;
  avg_sentiment_score: number;
  created_at: string;
}

// Location-Based Tracking Types
export interface LocationBasedTracking {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  auto_start: boolean;
  auto_stop: boolean;
  default_task?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationCheckIn {
  id: string;
  location_config: string;
  location_name?: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_lat: number;
  check_in_lon: number;
  check_out_lat?: number;
  check_out_lon?: number;
  time_entry?: string;
  created_at: string;
}

// Voice Command Types
export interface VoiceCommand {
  id: string;
  command_type: string;
  command_type_display?: string;
  raw_transcript: string;
  parsed_intent: Record<string, unknown>;
  is_successful: boolean;
  result_message: string;
  linked_task?: string;
  created_at: string;
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  task_id?: string;
  tasks?: { id: string; title: string; status: string }[];
  active_tasks?: number;
  completed_today?: number;
  overdue_tasks?: number;
}

// Resource Allocation Types
export interface ResourceAllocationSuggestion {
  id: string;
  suggestion_type: 'reassign' | 'redistribute' | 'hire' | 'skill_gap' | 'overload';
  suggestion_type_display?: string;
  task?: string;
  task_title?: string;
  from_user?: string;
  from_user_name?: string;
  to_user?: string;
  to_user_name?: string;
  reason: string;
  impact_score: number;
  confidence_score: number;
  supporting_data: Record<string, unknown>;
  is_applied: boolean;
  is_dismissed: boolean;
  applied_at?: string;
  applied_by?: string;
  created_at: string;
}

export interface AssigneeRecommendation {
  user_id: string;
  user_name: string;
  score: number;
  factors: Record<string, {
    value: string | number;
    score: number;
    weight: number;
  }>;
}

// WebSocket Event Types
export interface WebSocketTaskEvent {
  type: 'task_updated' | 'user_joined' | 'user_left' | 'typing' | 'cursor' | 'comment';
  task_id: string;
  user_id?: string;
  user_name?: string;
  field?: string;
  value?: unknown;
  timestamp?: string;
}

export interface WebSocketNotificationEvent {
  type: 'notification' | 'initial';
  notification?: Notification;
  unread_count?: number;
}

// Integrations
export interface NotificationIntegration {
  id: string;
  integration_type: 'slack' | 'teams' | 'webhook' | 'email' | 'google_sheets';
  name: string;
  config?: {
    url?: string;
    secret?: string;
    recipients?: string[];
  };
  form?: string;
  is_active: boolean;
  notify_on_meeting_complete: boolean;
  notify_on_action_items: boolean;
  notify_on_mentions: boolean;
  channel_id?: string;
  channel_name?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Feature 1: External Calendar Integration Types
// ============================================================
export interface CalendarConnection {
  id: string;
  user: string;
  user_name?: string;
  provider: 'google' | 'outlook' | 'apple' | 'caldav';
  provider_display?: string;
  name: string;
  calendar_id?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: string;
  sync_enabled: boolean;
  sync_tasks: boolean;
  sync_milestones: boolean;
  sync_deadlines: boolean;
  two_way_sync: boolean;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'partial' | 'failed';
  last_sync_error?: string;
  color?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  calendar_connection: string;
  external_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurring: boolean;
  recurrence_rule?: string;
  linked_task?: string;
  linked_task_title?: string;
  linked_milestone?: string;
  linked_milestone_title?: string;
  attendees: string[];
  reminders: { method: string; minutes: number }[];
  external_link?: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncResult {
  success: boolean;
  events_synced: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  errors: string[];
  synced_at: string;
}

// ============================================================
// Feature 2: File Attachments & Document Management Types
// ============================================================
export interface FileAttachment {
  id: string;
  name: string;
  original_filename: string;
  file: string;
  file_url?: string;
  file_type: 'document' | 'image' | 'spreadsheet' | 'presentation' | 'pdf' | 'code' | 'archive' | 'other';
  file_type_display?: string;
  mime_type: string;
  file_size: number;
  file_size_display?: string;
  content_type: string;
  object_id: string;
  description?: string;
  tags: string[];
  uploaded_by: string;
  uploaded_by_name?: string;
  version: number;
  is_latest: boolean;
  parent_version?: string;
  checksum?: string;
  virus_scanned: boolean;
  virus_scan_result?: 'clean' | 'infected' | 'error';
  preview_available: boolean;
  preview_url?: string;
  download_count: number;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FileVersion {
  id: string;
  file_attachment: string;
  file_name: string;
  version_number: number;
  file: string;
  file_url?: string;
  file_size: number;
  file_size_display?: string;
  checksum?: string;
  change_summary?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  is_current: boolean;
  created_at: string;
}

export interface FileUploadProgress {
  file_name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error_message?: string;
}

// ============================================================
// Feature 3: Custom Dashboard Widgets Types
// ============================================================
export type WidgetType = 
  | 'task_completion_rate'
  | 'project_health'
  | 'team_workload'
  | 'time_tracking_summary'
  | 'budget_overview'
  | 'burndown_chart'
  | 'velocity_chart'
  | 'upcoming_deadlines'
  | 'recent_activity'
  | 'notifications_feed'
  | 'calendar_view'
  | 'resource_utilization'
  | 'task_list'
  | 'milestone_tracker'
  | 'project_timeline'
  | 'gantt_chart'
  | 'kanban_board'
  | 'team_availability'
  | 'priority_matrix'
  | 'custom_chart'
  | 'custom_metric'
  | 'custom_table'
  | 'markdown_note'
  | 'embedded_iframe'
  | 'quick_actions';

export interface Dashboard {
  id: string;
  owner: string;
  owner_name?: string;
  company: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_shared: boolean;
  shared_with: string[];
  shared_with_details?: { id: string; name: string; email: string }[];
  layout: 'grid' | 'freeform';
  columns: number;
  row_height: number;
  background_color?: string;
  widgets?: DashboardWidget[];
  widget_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard: string;
  widget_type: WidgetType;
  widget_type_display?: string;
  title: string;
  subtitle?: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  min_width?: number;
  min_height?: number;
  config: Record<string, unknown>;
  filters?: {
    project_id?: string;
    user_id?: string;
    date_range?: string;
    status?: string[];
    priority?: string[];
    tags?: string[];
  };
  data_source?: string;
  refresh_interval: number;
  show_header: boolean;
  show_border: boolean;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  is_visible: boolean;
  cached_data?: Record<string, unknown>;
  last_refreshed_at?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description?: string;
  widget_type: WidgetType;
  default_config: Record<string, unknown>;
  preview_image?: string;
  category: 'productivity' | 'projects' | 'resources' | 'time' | 'budget' | 'custom';
  category_display?: string;
  is_premium: boolean;
  is_active: boolean;
  usage_count?: number;
  created_at: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  preview_image?: string;
  layout_config: Record<string, unknown>;
  widgets: Partial<DashboardWidget>[];
  category: 'personal' | 'team' | 'project' | 'executive' | 'custom';
  category_display?: string;
  is_premium: boolean;
  is_active: boolean;
  usage_count?: number;
  created_at: string;
}

export interface WidgetData {
  widget_id: string;
  widget_type: WidgetType;
  data: Record<string, unknown>;
  generated_at: string;
  cache_expires_at?: string;
}

// ============================================================
// Feature 4: Resource Allocation & Capacity Planning Types
// ============================================================
export interface ResourceAllocation {
  id: string;
  user: string;
  user_name?: string;
  user_avatar?: string;
  project: string;
  project_title?: string;
  task?: string;
  task_title?: string;
  allocation_type: 'full_time' | 'part_time' | 'hourly' | 'on_demand';
  allocation_type_display?: string;
  allocated_hours: number;
  allocated_percentage: number;
  hourly_rate?: number;
  start_date: string;
  end_date?: string;
  is_billable: boolean;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  status_display?: string;
  notes?: string;
  skills_required: string[];
  actual_hours?: number;
  variance?: number;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCapacity {
  id: string;
  user: string;
  user_name?: string;
  user_avatar?: string;
  week_start: string;
  total_hours: number;
  allocated_hours: number;
  available_hours: number;
  utilized_percentage: number;
  is_overallocated: boolean;
  overallocation_hours: number;
  leave_hours: number;
  meeting_hours: number;
  notes?: string;
  allocations?: ResourceAllocation[];
  projects?: { id: string; title: string; hours: number }[];
  created_at: string;
  updated_at: string;
}

export interface CapacityWarning {
  id: string;
  user: string;
  user_name?: string;
  warning_type: 'overallocation' | 'underutilization' | 'skill_gap' | 'conflict' | 'deadline_risk';
  warning_type_display?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_display?: string;
  message: string;
  details: Record<string, unknown>;
  affected_projects: string[];
  suggested_action?: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface GanttChartData {
  id: string;
  name: string;
  type: 'project' | 'task' | 'milestone' | 'allocation';
  start: string;
  end: string;
  progress?: number;
  assignee?: string;
  assignee_name?: string;
  parent_id?: string;
  dependencies?: string[];
  color?: string;
  is_critical_path?: boolean;
  children?: GanttChartData[];
}

export interface ResourceHeatmapData {
  user_id: string;
  user_name: string;
  weeks: {
    week_start: string;
    utilization: number;
    status: 'available' | 'optimal' | 'busy' | 'overloaded';
  }[];
}

// ============================================================
// Feature 5: Budget & Cost Tracking Types
// ============================================================
export interface ProjectBudget {
  id: string;
  project: string;
  project_title?: string;
  budget_type: 'fixed' | 'time_and_materials' | 'retainer' | 'milestone_based';
  budget_type_display?: string;
  total_budget: number;
  currency: string;
  labor_budget: number;
  materials_budget: number;
  contingency_budget: number;
  contingency_percentage: number;
  spent_amount: number;
  committed_amount: number;
  remaining_amount: number;
  variance_amount: number;
  variance_percentage: number;
  forecast_at_completion: number;
  health: 'on_track' | 'at_risk' | 'over_budget' | 'under_budget';
  health_display?: string;
  billing_rate?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = 
  | 'labor'
  | 'materials'
  | 'software'
  | 'hardware'
  | 'travel'
  | 'training'
  | 'consulting'
  | 'marketing'
  | 'overhead'
  | 'other';

export interface Expense {
  id: string;
  budget: string;
  project?: string;
  project_title?: string;
  task?: string;
  task_title?: string;
  category: ExpenseCategory;
  category_display?: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  is_billable: boolean;
  is_approved: boolean;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  vendor?: string;
  invoice_number?: string;
  receipt_attachment?: string;
  receipt_url?: string;
  notes?: string;
  submitted_by: string;
  submitted_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetAlert {
  id: string;
  budget: string;
  project_title?: string;
  alert_type: 'threshold_warning' | 'threshold_critical' | 'over_budget' | 'forecast_warning' | 'anomaly';
  alert_type_display?: string;
  severity: 'info' | 'warning' | 'critical';
  severity_display?: string;
  threshold_percentage?: number;
  current_percentage: number;
  message: string;
  details: Record<string, unknown>;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface BudgetVarianceReport {
  id: string;
  budget: string;
  project_title?: string;
  report_period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  period_start: string;
  period_end: string;
  planned_cost: number;
  actual_cost: number;
  variance_amount: number;
  variance_percentage: number;
  cpi: number; // Cost Performance Index
  spi: number; // Schedule Performance Index
  eac: number; // Estimate at Completion
  etc: number; // Estimate to Complete
  analysis: string;
  recommendations: string[];
  by_category: {
    category: ExpenseCategory;
    planned: number;
    actual: number;
    variance: number;
  }[];
  trend_data: {
    period: string;
    planned: number;
    actual: number;
  }[];
  generated_by: string;
  generated_by_name?: string;
  created_at: string;
}

// ============================================================
// Feature 6: PWA & Offline Mode Types
// ============================================================
export interface OfflineQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity_type: 'task' | 'progress' | 'time_entry' | 'comment' | 'attachment';
  entity_id?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncStatus {
  is_online: boolean;
  last_sync: string;
  pending_changes: number;
  is_syncing: boolean;
  sync_progress?: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  entity_type: string;
  entity_id: string;
  local_version: Record<string, unknown>;
  remote_version: Record<string, unknown>;
  local_timestamp: string;
  remote_timestamp: string;
  field_conflicts: string[];
  resolution?: 'local' | 'remote' | 'merged';
}

export interface CacheConfig {
  entity_type: string;
  max_age_seconds: number;
  max_items: number;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================
// Feature 7: Advanced Notification Rules Types
// ============================================================
export type NotificationTrigger =
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue_days'
  | 'task_due_soon_hours'
  | 'task_blocked'
  | 'task_status_changed'
  | 'task_priority_changed'
  | 'progress_below_threshold'
  | 'progress_updated'
  | 'budget_threshold'
  | 'milestone_approaching_days'
  | 'milestone_completed'
  | 'project_status_changed'
  | 'time_entry_submitted'
  | 'comment_added'
  | 'mention'
  | 'team_member_joined'
  | 'custom_field_changed'
  | 'recurring_schedule';

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms' | 'slack' | 'teams' | 'webhook';

export interface NotificationRule {
  id: string;
  company: string;
  created_by: string;
  created_by_name?: string;
  name: string;
  description?: string;
  trigger_type: NotificationTrigger;
  trigger_type_display?: string;
  trigger_conditions: {
    threshold?: number;
    days?: number;
    hours?: number;
    status?: string;
    priority?: string;
    field_name?: string;
    field_value?: unknown;
  };
  channels: NotificationChannel[];
  recipients_type: 'specific_users' | 'role_based' | 'task_assignee' | 'project_team' | 'custom_query';
  recipients_type_display?: string;
  specific_recipients: string[];
  specific_recipients_details?: { id: string; name: string; email: string }[];
  recipient_roles: string[];
  message_template: string;
  subject_template?: string;
  include_details: boolean;
  include_action_buttons: boolean;
  schedule?: {
    type: 'immediate' | 'digest' | 'scheduled';
    digest_frequency?: 'hourly' | 'daily' | 'weekly';
    scheduled_time?: string;
    timezone?: string;
  };
  filters?: {
    projects?: string[];
    users?: string[];
    priority?: string[];
    tags?: string[];
  };
  is_active: boolean;
  delivery_count?: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  rule: string;
  rule_name?: string;
  channel: NotificationChannel;
  channel_display?: string;
  recipient: string;
  recipient_name?: string;
  recipient_contact?: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  status_display?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface NotificationDigest {
  id: string;
  user: string;
  digest_type: 'daily' | 'weekly';
  period_start: string;
  period_end: string;
  notification_count: number;
  summary: {
    tasks_assigned: number;
    tasks_completed: number;
    tasks_overdue: number;
    comments: number;
    mentions: number;
  };
  items: {
    type: string;
    title: string;
    timestamp: string;
    link?: string;
  }[];
  sent_at?: string;
  created_at: string;
}

// ============================================================
// Feature 8: Audit Logs & Change History Types
// ============================================================
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'status_change'
  | 'assignment_change'
  | 'bulk_action'
  | 'api_call'
  | 'integration_sync';

export interface AuditLog {
  id: string;
  user: string;
  user_name?: string;
  user_email?: string;
  company: string;
  action: AuditAction;
  action_display?: string;
  content_type: string;
  object_id: string;
  object_repr: string;
  entity_type?: string;
  entity_title?: string;
  changes: {
    field: string;
    field_display?: string;
    old_value: unknown;
    new_value: unknown;
  }[];
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;
  additional_data: Record<string, unknown>;
  is_system_action: boolean;
  is_sensitive: boolean;
  timestamp: string;
}

export interface ChangeSnapshot {
  id: string;
  audit_log: string;
  snapshot_type: 'before' | 'after';
  content_type: string;
  object_id: string;
  snapshot_data: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogSearch {
  id: string;
  user: string;
  name: string;
  filters: {
    action?: AuditAction[];
    user_id?: string[];
    content_type?: string[];
    date_from?: string;
    date_to?: string;
    search_text?: string;
  };
  is_saved: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface AuditLogExport {
  id: string;
  user: string;
  format: 'csv' | 'json' | 'pdf';
  filters: Record<string, unknown>;
  record_count: number;
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface EntityHistory {
  entity_type: string;
  entity_id: string;
  entity_title: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  last_modified_at: string;
  last_modified_by: string;
  last_modified_by_name?: string;
  change_count: number;
  changes: AuditLog[];
}

// ============================================================
// Feature 9: Multi-Tenant Support Types
// ============================================================
export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  owner: string;
  owner_name?: string;
  plan: TenantPlan;
  plan_display?: string;
  is_active: boolean;
  is_verified: boolean;
  settings: {
    timezone?: string;
    date_format?: string;
    week_start?: 'sunday' | 'monday';
    default_currency?: string;
    features_enabled?: string[];
    max_users?: number;
    max_projects?: number;
    max_storage_gb?: number;
  };
  branding?: TenantBranding;
  member_count?: number;
  project_count?: number;
  storage_used_gb?: number;
  trial_ends_at?: string;
  billing_email?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  id: string;
  tenant: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family?: string;
  custom_css?: string;
  login_background_url?: string;
  email_header_html?: string;
  email_footer_html?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant: string;
  user: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  role_display?: string;
  permissions: string[];
  joined_at: string;
  invited_by?: string;
  invited_by_name?: string;
  last_active_at?: string;
  is_active: boolean;
}

export interface TenantInvitation {
  id: string;
  tenant: string;
  tenant_name?: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  role_display?: string;
  invited_by: string;
  invited_by_name?: string;
  message?: string;
  token?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  status_display?: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface TenantUsageStats {
  id: string;
  tenant: string;
  period_start: string;
  period_end: string;
  active_users: number;
  total_tasks: number;
  tasks_created: number;
  tasks_completed: number;
  total_projects: number;
  projects_created: number;
  storage_used_bytes: number;
  api_calls: number;
  file_uploads: number;
  report_exports: number;
  ai_requests: number;
  created_at: string;
}

// ============================================================
// Feature 10: API for Third-Party Integrations Types
// ============================================================
export interface APIKey {
  id: string;
  company: string;
  name: string;
  description?: string;
  key_prefix: string;
  key_hash?: string; // Never exposed, just for internal use
  permissions: string[];
  scopes: APIScope[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  allowed_ips: string[];
  allowed_origins: string[];
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  last_used_ip?: string;
  usage_count: number;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type APIScope =
  | 'read:tasks'
  | 'write:tasks'
  | 'read:projects'
  | 'write:projects'
  | 'read:users'
  | 'write:users'
  | 'read:progress'
  | 'write:progress'
  | 'read:time'
  | 'write:time'
  | 'read:reports'
  | 'read:analytics'
  | 'read:files'
  | 'write:files'
  | 'admin:all';

export interface APIRequestLog {
  id: string;
  api_key: string;
  api_key_name?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  query_params?: Record<string, string>;
  request_body_size?: number;
  response_status: number;
  response_time_ms: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  timestamp: string;
}

export interface WebhookEndpoint {
  id: string;
  company: string;
  name: string;
  description?: string;
  url: string;
  secret: string; // For webhook signature verification
  events: WebhookEvent[];
  is_active: boolean;
  verify_ssl: boolean;
  timeout_seconds: number;
  retry_count: number;
  retry_delay_seconds: number;
  headers: Record<string, string>;
  last_triggered_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  failure_count: number;
  success_count: number;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type WebhookEvent =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.completed'
  | 'task.assigned'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.completed'
  | 'progress.created'
  | 'progress.updated'
  | 'milestone.completed'
  | 'user.created'
  | 'user.updated'
  | 'time_entry.created'
  | 'comment.created'
  | 'file.uploaded'
  | 'budget.threshold_reached';

export interface WebhookDelivery {
  id: string;
  webhook_endpoint: string;
  webhook_name?: string;
  event: WebhookEvent;
  event_display?: string;
  payload: Record<string, unknown>;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  response_time_ms?: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  status_display?: string;
  attempt_count: number;
  next_retry_at?: string;
  error_message?: string;
  delivered_at?: string;
  created_at: string;
}

export interface OAuthApplication {
  id: string;
  company: string;
  name: string;
  description?: string;
  client_id: string;
  client_secret?: string; // Only shown once on creation
  redirect_uris: string[];
  scopes: APIScope[];
  is_confidential: boolean;
  is_active: boolean;
  logo_url?: string;
  homepage_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OAuthToken {
  id: string;
  application: string;
  application_name?: string;
  user: string;
  user_name?: string;
  scopes: APIScope[];
  access_token?: string; // Only returned on creation
  refresh_token?: string; // Only returned on creation
  expires_at: string;
  is_revoked: boolean;
  last_used_at?: string;
  created_at: string;
}

// API Response Wrappers
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    request_id: string;
    timestamp: string;
    rate_limit_remaining: number;
    rate_limit_reset: string;
  };
}

export interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
