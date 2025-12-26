"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { LucideIcon } from "lucide-react";

const statCardVariants = cva(
  "relative overflow-hidden rounded-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border-border hover:shadow-md",
        gradient: "bg-gradient-to-br from-card to-muted/30 border-border hover:shadow-md",
        glass: "bg-card/60 backdrop-blur-xl border-border/50 hover:shadow-lg",
        glow: "bg-card border-border hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30",
        colored: "border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  color?: "primary" | "success" | "warning" | "destructive" | "info";
  loading?: boolean;
}

const colorClasses = {
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  destructive: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
  info: {
    iconBg: "bg-info/10",
    iconColor: "text-info",
    trendPositive: "text-success",
    trendNegative: "text-destructive",
  },
};

export function StatCard({
  className,
  variant,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary",
  loading = false,
  ...props
}: StatCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className={cn(statCardVariants({ variant, className }))} {...props}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-10 w-10 skeleton rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-20 skeleton rounded" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(statCardVariants({ variant, className }))}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn("p-2.5 rounded-lg", colors.iconBg)}>
              <Icon className={cn("h-5 w-5", colors.iconColor)} />
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </motion.div>
          <div className="flex items-center gap-2 text-sm">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center font-medium",
                  trend.positive !== false && trend.value >= 0
                    ? colors.trendPositive
                    : colors.trendNegative
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {(subtitle || trend?.label) && (
              <span className="text-muted-foreground">
                {trend?.label || subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Decorative gradient */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-1 opacity-60",
          `bg-gradient-to-r from-transparent via-${color === 'primary' ? 'primary' : color} to-transparent`
        )}
        style={{
          background: `linear-gradient(to right, transparent, hsl(var(--${color})) 50%, transparent)`,
        }}
      />
    </motion.div>
  );
}

// ============================================
// STAT CARD GRID
// ============================================

export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}
