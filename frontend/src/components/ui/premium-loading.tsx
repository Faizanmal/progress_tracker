"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { Loader2, Sparkles, Zap, TrendingUp } from "lucide-react";

// ============================================
// 🌟 PREMIUM SPINNER VARIANTS
// ============================================

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "premium" | "gradient" | "pulse" | "glow";
  className?: string;
}

const spinnerSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4", 
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function PremiumSpinner({ size = "md", variant = "default", className }: SpinnerProps) {
  const baseStyles = cn("rounded-full", spinnerSizes[size]);
  
  const variants = {
    default: "border-2 border-muted border-t-primary animate-spin",
    premium: "border-2 border-muted animate-spin relative before:absolute before:inset-0 before:rounded-full before:border-2 before:border-transparent before:border-t-primary before:animate-spin",
    gradient: "bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-spin p-[2px] before:content-[''] before:absolute before:inset-[2px] before:bg-background before:rounded-full",
    pulse: "border-2 border-primary/30 animate-pulse",
    glow: "border-2 border-primary animate-spin shadow-lg shadow-primary/30"
  };

  if (variant === "gradient") {
    return (
      <div className={cn("relative", baseStyles, className)}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-[2px] bg-background rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(baseStyles, variants[variant], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ============================================
// ✨ PREMIUM LOADING DOTS
// ============================================

export function PremiumLoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// 🎪 ANIMATED LOADING BARS
// ============================================

export function LoadingBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: [16, 32, 16],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// 🌊 WAVE LOADER
// ============================================

export function WaveLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-gradient-to-t from-primary to-purple-500 rounded-full"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// 💫 FLOATING ORBS LOADER
// ============================================

export function FloatingOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-gradient-to-r from-primary to-purple-500 rounded-full"
          animate={{
            x: [0, 20, 0, -20, 0],
            y: [0, -20, 0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
          style={{
            left: "50%",
            top: "50%",
            marginLeft: "-8px",
            marginTop: "-8px",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// 🎯 SKELETON LOADERS
// ============================================

interface SkeletonProps {
  className?: string;
  variant?: "default" | "shimmer" | "pulse";
}

export function Skeleton({ className, variant = "shimmer" }: SkeletonProps) {
  const variants = {
    default: "bg-muted rounded animate-pulse",
    shimmer: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded",
    pulse: "bg-muted rounded animate-pulse-soft",
  };

  return <div className={cn("h-4 w-full", variants[variant], className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex space-x-3">
        {[1, 2, 3, 4].map((col) => (
          <Skeleton key={col} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex space-x-3">
          {[1, 2, 3, 4].map((col) => (
            <Skeleton key={col} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// 📱 FULL PAGE LOADERS
// ============================================

interface PageLoaderProps {
  message?: string;
  submessage?: string;
  variant?: "default" | "premium" | "floating" | "minimal";
}

export function PageLoader({ 
  message = "Loading...", 
  submessage,
  variant = "premium"
}: PageLoaderProps) {
  const loaderVariants = {
    default: (
      <div className="flex flex-col items-center gap-4">
        <PremiumSpinner size="lg" variant="gradient" />
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">{message}</p>
          {submessage && <p className="text-sm text-muted-foreground">{submessage}</p>}
        </div>
      </div>
    ),
    premium: (
      <motion.div 
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <motion.div
            className="w-20 h-20 border-4 border-muted rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-6 w-8 h-8 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          className="text-center space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {message}
          </h3>
          {submessage && (
            <p className="text-sm text-muted-foreground max-w-xs">
              {submessage}
            </p>
          )}
        </motion.div>

        <PremiumLoadingDots />
      </motion.div>
    ),
    floating: (
      <div className="flex flex-col items-center gap-6">
        <FloatingOrbs />
        <div className="text-center space-y-1">
          <p className="text-lg font-medium">{message}</p>
          {submessage && <p className="text-sm text-muted-foreground">{submessage}</p>}
        </div>
      </div>
    ),
    minimal: (
      <div className="flex items-center gap-3">
        <PremiumSpinner size="sm" />
        <span className="text-muted-foreground">{message}</span>
      </div>
    ),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
        
        {/* Content */}
        <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
          {loaderVariants[variant]}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🎨 INLINE LOADERS
// ============================================

interface InlineLoaderProps {
  message?: string;
  variant?: "spinner" | "dots" | "bars" | "minimal";
  size?: "sm" | "md" | "lg";
}

export function InlineLoader({ 
  message, 
  variant = "spinner", 
  size = "md" 
}: InlineLoaderProps) {
  const loaders = {
    spinner: <PremiumSpinner size={size} variant="premium" />,
    dots: <PremiumLoadingDots />,
    bars: <LoadingBars />,
    minimal: <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />,
  };

  return (
    <div className="flex items-center gap-3">
      {loaders[variant]}
      {message && (
        <span className={cn(
          "text-muted-foreground",
          size === "sm" && "text-xs",
          size === "md" && "text-sm", 
          size === "lg" && "text-base"
        )}>
          {message}
        </span>
      )}
    </div>
  );
}

// ============================================
// 🚀 LOADING STATES FOR BUTTONS
// ============================================

interface ButtonLoaderProps {
  variant?: "spinner" | "dots" | "pulse";
  size?: "sm" | "md";
}

export function ButtonLoader({ variant = "spinner", size = "sm" }: ButtonLoaderProps) {
  const loaders = {
    spinner: <Loader2 className={cn("animate-spin", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />,
    dots: <PremiumLoadingDots className="scale-75" />,
    pulse: (
      <motion.div
        className={cn("rounded-full bg-current", size === "sm" ? "w-3 h-3" : "w-4 h-4")}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    ),
  };

  return loaders[variant];
}

export { LoadingDots } from "./loading";