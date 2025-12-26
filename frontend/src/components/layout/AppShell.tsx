"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { PremiumSidebar, MobileNav } from "@/src/components/layout/PremiumSidebar";
import { MotionDiv } from "@/src/lib/motion";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <PremiumSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <MotionDiv
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 260,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "min-h-screen transition-all duration-200",
          "lg:ml-[260px]", // Default margin for desktop
          "pt-16 lg:pt-0", // Account for mobile header
          className
        )}
        style={{
          marginLeft: undefined, // Let framer-motion handle this on desktop
        }}
      >
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </MotionDiv>
    </div>
  );
}

// ============================================
// PAGE CONTAINER
// ============================================

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "2xl",
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}

// ============================================
// PAGE HEADER
// ============================================

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("mb-8", className)}
    >
      {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </MotionDiv>
  );
}

// ============================================
// SECTION
// ============================================

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ============================================
// CONTENT GRID
// ============================================

interface ContentGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const gridClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function ContentGrid({
  children,
  className,
  columns = 3,
}: ContentGridProps) {
  return (
    <div className={cn("grid gap-4 lg:gap-6", gridClasses[columns], className)}>
      {children}
    </div>
  );
}
