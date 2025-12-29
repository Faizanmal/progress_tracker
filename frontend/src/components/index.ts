// Premium UI Component Exports
// Re-export all premium components for easy importing

// Layout Components
export { AppShell, PageContainer, PageHeader, Section, ContentGrid } from "./layout/AppShell";
export { PremiumSidebar, MobileNav } from "./layout/PremiumSidebar";

// UI Components
export { Button, type ButtonProps } from "./ui/button";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants } from "./ui/card";
export { Badge, badgeVariants, type BadgeProps } from "./ui/badge";
export { Input, inputVariants, type InputProps } from "./ui/input";
export { StatCard, StatCardGrid, type StatCardProps } from "./ui/stat-card";
export { EmptyState, NoDataState, NoResultsState, ErrorState } from "./ui/empty-state";
export { 
  Spinner, 
  LoadingDots, 
  PulseLoader, 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  PageLoader, 
  InlineLoader, 
  Shimmer, 
  ProgressLoader 
} from "./ui/loading";
export { ThemeToggle } from "./ui/theme-toggle";

// Table Components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./ui/table";

// Feature Components - Calendar Integration
export { CalendarConnectionCard, CalendarConnectDialog } from "./calendar";

// Feature Components - File Attachments
export { FileUploader, FileAttachmentCard } from "./files";

// Feature Components - Dashboard Widgets
export { DashboardWidget, DashboardBuilder, WidgetPicker } from "./dashboards";

// Feature Components - Resources & Capacity
export { ResourceHeatmap, GanttChart } from "./resources";

// Feature Components - Budget Tracking
export { BudgetOverviewCard, BudgetVarianceReportView } from "./budget";

// Feature Components - Audit Logs
export { AuditLogViewer } from "./audit";

// Feature Components - Notification Rules
export { NotificationRuleBuilder } from "./notifications";

// Feature Components - Multi-Tenant
export { TenantSettings } from "./tenants";

// Feature Components - API Management
export { APIKeyManager } from "./api";

// Feature Components - Offline/PWA
export { OfflineIndicator } from "./offline";

