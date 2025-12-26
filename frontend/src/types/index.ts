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

export interface DashboardWidget {
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
