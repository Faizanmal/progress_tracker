"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { MotionDiv } from "@/src/lib/motion";
import { LucideIcon, Inbox, FileQuestion, Search, Plus } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "premium";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: {
    container: "py-8 px-4",
    icon: "w-10 h-10",
    iconWrapper: "w-16 h-16",
    title: "text-base",
    description: "text-sm max-w-xs",
  },
  default: {
    container: "py-12 px-6",
    icon: "w-12 h-12",
    iconWrapper: "w-20 h-20",
    title: "text-lg",
    description: "text-sm max-w-sm",
  },
  lg: {
    container: "py-16 px-8",
    icon: "w-16 h-16",
    iconWrapper: "w-24 h-24",
    title: "text-xl",
    description: "text-base max-w-md",
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "default",
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      {/* Icon with gradient background */}
      <MotionDiv
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-muted to-muted/50",
          "mb-6",
          sizes.iconWrapper
        )}
      >
        <Icon className={cn("text-muted-foreground", sizes.icon)} strokeWidth={1.5} />
      </MotionDiv>

      {/* Title */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className={cn("font-semibold text-foreground mb-2", sizes.title)}>
          {title}
        </h3>
      </MotionDiv>

      {/* Description */}
      {description && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className={cn("text-muted-foreground mb-6", sizes.description)}>
            {description}
          </p>
        </MotionDiv>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </MotionDiv>
      )}
    </MotionDiv>
  );
}

// ============================================
// PRESET EMPTY STATES
// ============================================

export function NoDataState({
  title = "No data yet",
  description = "Start by adding some data to see it displayed here.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function NoResultsState({
  title = "No results found",
  description = "Try adjusting your search or filters to find what you're looking for.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Search}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load the data. Please try again.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={title}
      description={description}
      action={action || { label: "Try again", onClick: () => window.location.reload() }}
      className={className}
    />
  );
}
