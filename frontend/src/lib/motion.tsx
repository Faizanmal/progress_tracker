"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { forwardRef, type ReactNode, type ElementType } from "react";

// ============================================
// 🎬 ANIMATION VARIANTS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const slideInLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export const slideInRight: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export const slideInUp: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ============================================
// 🎨 TRANSITION PRESETS
// ============================================

export const transitions = {
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springBouncy: { type: "spring", stiffness: 400, damping: 25 },
  springStiff: { type: "spring", stiffness: 500, damping: 35 },
  easeOut: { ease: [0.4, 0, 0.2, 1], duration: 0.3 },
  easeInOut: { ease: [0.4, 0, 0.2, 1], duration: 0.4 },
  smooth: { ease: [0.25, 0.1, 0.25, 1], duration: 0.5 },
  fast: { duration: 0.15 },
  medium: { duration: 0.3 },
  slow: { duration: 0.5 },
};

// ============================================
// 🧩 MOTION COMPONENTS
// ============================================

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
}

export const MotionDiv = motion.div;
export const MotionSpan = motion.span;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;
export const MotionButton = motion.button;
export const MotionNav = motion.nav;
export const MotionHeader = motion.header;
export const MotionFooter = motion.footer;

// ============================================
// 🎯 ANIMATED COMPONENTS
// ============================================

interface AnimatedProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function FadeIn({ children, delay = 0, duration = 0.5, className, once = true }: AnimatedProps) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={fadeIn}
      transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function FadeUp({ children, delay = 0, duration = 0.5, className, once = true }: AnimatedProps) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={fadeUp}
      transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function FadeDown({ children, delay = 0, duration = 0.5, className, once = true }: AnimatedProps) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={fadeDown}
      transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function ScaleIn({ children, delay = 0, duration = 0.4, className, once = true }: AnimatedProps) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={scaleIn}
      transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1,
  initialDelay = 0.1,
}: StaggerProps) {
  return (
    <MotionDiv
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionDiv
      variants={staggerItem}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

// ============================================
// 🔥 HOVER ANIMATIONS
// ============================================

interface HoverCardProps extends MotionDivProps {
  children: ReactNode;
  scale?: number;
  lift?: number;
}

export function HoverCard({ children, scale = 1.02, lift = 4, className, ...props }: HoverCardProps) {
  return (
    <MotionDiv
      whileHover={{ 
        scale, 
        y: -lift,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

export function HoverGlow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionDiv
      whileHover={{ 
        boxShadow: "0 0 40px -10px hsl(var(--primary) / 0.4)",
        transition: { duration: 0.3 }
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

// ============================================
// 🔄 LOADING ANIMATIONS
// ============================================

export function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} border-muted border-t-primary rounded-full ${className}`}
    />
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <MotionDiv
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      ))}
    </div>
  );
}

export function PulseLoader({ className }: { className?: string }) {
  return (
    <MotionDiv
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`w-4 h-4 bg-primary rounded-full ${className}`}
    />
  );
}

// ============================================
// 📦 PAGE TRANSITIONS
// ============================================

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function SlideTransition({ children, direction = "right", className }: { 
  children: ReactNode; 
  direction?: "left" | "right" | "up" | "down";
  className?: string;
}) {
  const directionMap = {
    left: { x: -20 },
    right: { x: 20 },
    up: { y: -20 },
    down: { y: 20 },
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionMap[direction] }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

// ============================================
// ✨ SPECIAL EFFECTS
// ============================================

export function FloatingElement({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionDiv
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

export function GlowPulse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <MotionDiv
      animate={{ 
        boxShadow: [
          "0 0 20px hsl(var(--primary) / 0.3)",
          "0 0 40px hsl(var(--primary) / 0.5)",
          "0 0 20px hsl(var(--primary) / 0.3)",
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}

// ============================================
// 🎪 NUMBER COUNTER
// ============================================

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
}

export function Counter({ from = 0, to, duration = 1, className }: CounterProps) {
  return (
    <MotionSpan
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Using CSS counter animation as fallback */}
        <span className="tabular-nums">{to}</span>
      </motion.span>
    </MotionSpan>
  );
}
