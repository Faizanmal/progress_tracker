'use client'

import React from 'react'
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { cn } from '@/src/lib/utils'

// ============================================
// ✨ ANIMATION VARIANTS
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const slideUpFull: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ============================================
// 🎪 ANIMATED COMPONENTS
// ============================================

interface AnimatedDivProps extends HTMLMotionProps<'div'> {
  variant?: keyof typeof animationVariants
  stagger?: boolean
  delay?: number
}

const animationVariants = {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideUpFull,
  staggerContainer,
  staggerItem,
}

export const AnimatedDiv = React.forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ variant = 'fadeInUp', stagger = false, delay = 0, className, children, ...props }, ref) => {
    const variants = stagger ? staggerContainer : animationVariants[variant]
    
    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        className={cn(className)}
        {...props}
      >
        {stagger
          ? React.Children.map(children as React.ReactNode, (child, index) => (
              <motion.div key={index} variants={staggerItem}>
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    )
  }
)
AnimatedDiv.displayName = 'AnimatedDiv'

// ============================================
// 🌊 SCROLL REVEAL COMPONENT
// ============================================

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  variant?: keyof typeof animationVariants
  threshold?: number
  once?: boolean
}

export const ScrollReveal = React.forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ variant = 'fadeInUp', threshold = 0.1, once = true, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={animationVariants[variant]}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: threshold }}
        className={cn(className)}
        {...props}
      />
    )
  }
)
ScrollReveal.displayName = 'ScrollReveal'

// ============================================
// 🎨 ANIMATED CARD
// ============================================

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean
  glow?: boolean
  tilt?: boolean
}

export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ hover = true, glow = false, tilt = false, className, ...props }, ref) => {
    const hoverVariants = {
      initial: { scale: 1, y: 0 },
      hover: { 
        scale: 1.02, 
        y: -8,
        boxShadow: glow 
          ? '0 20px 25px -5px rgba(var(--primary), 0.1), 0 10px 10px -5px rgba(var(--primary), 0.04)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 }
      },
    }

    const tiltVariants = {
      initial: { rotateX: 0, rotateY: 0 },
      hover: { rotateX: -5, rotateY: 5, transition: { duration: 0.3 } },
    }

    return (
      <motion.div
        ref={ref}
        variants={tilt ? tiltVariants : hoverVariants}
         
         
        initial="initial"
        whileHover={hover ? "hover" : undefined}
        className={cn('cursor-pointer', className)}
        style={{ transformStyle: 'preserve-3d' }}
        {...props}
      />
    )
  }
)
AnimatedCard.displayName = 'AnimatedCard'

// ============================================
// 🎯 ANIMATED BUTTON
// ============================================

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'scale' | 'lift' | 'bounce' | 'pulse'
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = 'scale', className, ...props }, ref) => {
    const variants = {
      scale: {
        initial: { scale: 1 },
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95, transition: { duration: 0.1 } },
      },
      lift: {
        initial: { y: 0 },
        hover: { y: -2, transition: { duration: 0.2 } },
        tap: { y: 0, transition: { duration: 0.1 } },
      },
      bounce: {
        initial: { scale: 1 },
        hover: { scale: 1.1, transition: { stiffness: 400, damping: 10 } },
        tap: { scale: 0.9, transition: { duration: 0.1 } },
      },
      pulse: {
        initial: { scale: 1 },
        hover: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } },
        tap: { scale: 0.95, transition: { duration: 0.1 } },
      },
    }

    return (
      <motion.button
        ref={ref}
        variants={variants[variant]}
         
         
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        className={cn(className)}
        {...props}
      />
    )
  }
)
AnimatedButton.displayName = 'AnimatedButton'

// ============================================
// 🌟 FLOATING ELEMENTS
// ============================================

interface FloatingElementProps extends HTMLMotionProps<'div'> {
  duration?: number
  offset?: number
}

export const FloatingElement = React.forwardRef<HTMLDivElement, FloatingElementProps>(
  ({ duration = 4, offset = 20, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        animate={{
          y: [0, -offset, 0],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className={cn(className)}
        {...props}
      />
    )
  }
)
FloatingElement.displayName = 'FloatingElement'

// ============================================
// 🎪 PAGE TRANSITION
// ============================================

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ✨ SHIMMER LOADER
// ============================================

export const ShimmerLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-muted', className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{
          x: ['-100%', '100%'],
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          },
        }}
      />
    </div>
  )
}

// ============================================
// 🎨 GRADIENT ORBS (Background Animation)
// ============================================

export const GradientOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute top-3/4 right-1/4 w-96 h-96 bg-info/10 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-success/8 rounded-full blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, -40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}