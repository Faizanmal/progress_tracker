'use client'

import React, { useEffect, useState, useRef, ReactNode, useMemo } from 'react'
import { motion, useAnimation, useInView, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/src/lib/utils'

// ============================================
// 🎯 CURSOR FOLLOW EFFECT
// ============================================

export const CursorFollowSpotlight = ({ children, className }: { children: ReactNode, className?: string }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Spotlight effect */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(var(--primary), 0.15) 0%, rgba(var(--primary), 0.05) 50%, transparent 100%)',
          width: '300px',
          height: '300px',
          left: mousePosition.x - 150,
          top: mousePosition.y - 150,
        }}
        animate={{
          opacity: isHovering ? 1 : 0,
          scale: isHovering ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
      />
      {children}
    </div>
  )
}

// ============================================
// ✨ MAGNETIC HOVER EFFECT
// ============================================

export const MagneticHover = ({ 
  children, 
  strength = 0.3, 
  className 
}: { 
  children: ReactNode
  strength?: number
  className?: string 
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn('cursor-pointer', className)}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 🌈 3D TILT EFFECT
// ============================================

export const TiltCard = ({ 
  children, 
  tiltAngle = 15,
  className 
}: { 
  children: ReactNode
  tiltAngle?: number
  className?: string 
}) => {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateXValue = ((e.clientY - centerY) / rect.height) * -tiltAngle
    const rotateYValue = ((e.clientX - centerX) / rect.width) * tiltAngle

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovering(false)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  return (
    <motion.div
      className={cn('perspective-1000', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        scale: isHovering ? 1.05 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={{
          boxShadow: isHovering
            ? '0 25px 50px -12px rgba(var(--primary), 0.25)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// 🔄 PARALLAX SCROLL EFFECT
// ============================================

export const ParallaxElement = ({ 
  children, 
  speed = 0.5,
  className 
}: { 
  children: ReactNode
  speed?: number
  className?: string 
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const scrollY = useMotionValue(0)
  const y = useTransform(scrollY, (value) => (value as number) * speed)

  useEffect(() => {
    const updateScrollY = () => scrollY.set(window.scrollY)
    window.addEventListener('scroll', updateScrollY)
    return () => window.removeEventListener('scroll', updateScrollY)
  }, [scrollY])

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 💫 STAGGER REVEAL ANIMATION
// ============================================

export const StaggerReveal = ({ 
  children, 
  staggerDelay = 0.1,
  className 
}: { 
  children: ReactNode
  staggerDelay?: number
  className?: string 
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  return (
    <div ref={ref} className={cn(className)}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ 
            duration: 0.5, 
            delay: index * staggerDelay,
            ease: 'easeOut' 
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

// ============================================
// 🎪 MORPHING BLOB BACKGROUND
// ============================================

export const MorphingBlob = ({ 
  className,
  color = 'primary' 
}: { 
  className?: string
  color?: string 
}) => {
  return (
    <motion.div
      className={cn('absolute rounded-full blur-3xl opacity-20', className)}
      animate={{
        scale: [1, 1.2, 0.8, 1],
        rotate: [0, 90, 180, 270, 360],
        borderRadius: ['50%', '40% 60%', '60% 40%', '50%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: `radial-gradient(circle, hsl(var(--${color})) 0%, transparent 70%)`,
      }}
    />
  )
}

// ============================================
// ⚡ GLOW ON SCROLL
// ============================================

export const GlowOnScroll = ({ 
  children,
  glowColor = 'primary',
  threshold = 0.5,
  className 
}: { 
  children: ReactNode
  glowColor?: string
  threshold?: number
  className?: string 
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: threshold })

  return (
    <motion.div
      ref={ref}
      className={cn('relative', className)}
      animate={{
        boxShadow: isInView
          ? `0 0 60px hsl(var(--${glowColor}) / 0.3)`
          : 'none',
        borderColor: isInView
          ? `hsl(var(--${glowColor}) / 0.5)`
          : 'hsl(var(--border))',
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 🌀 TYPEWRITER EFFECT
// ============================================

export const TypewriterText = ({ 
  text, 
  speed = 50,
  className,
  onComplete 
}: { 
  text: string
  speed?: number
  className?: string
  onComplete?: () => void 
}) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return (
    <span className={cn(className)}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block"
      >
        |
      </motion.span>
    </span>
  )
}

// ============================================
// 🎨 PAINT DRIP REVEAL
// ============================================

export const PaintDripReveal = ({ 
  children,
  color = 'primary',
  direction = 'down',
  className 
}: { 
  children: ReactNode
  color?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string 
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const getClipPath = () => {
    if (!isInView) {
      switch (direction) {
        case 'up': return 'inset(100% 0 0 0)'
        case 'down': return 'inset(0 0 100% 0)'
        case 'left': return 'inset(0 100% 0 0)'
        case 'right': return 'inset(0 0 0 100%)'
        default: return 'inset(0 0 100% 0)'
      }
    }
    return 'inset(0 0 0 0)'
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div
        style={{ clipPath: getClipPath() }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ============================================
// 🎭 HOVER LIFT EFFECT
// ============================================

export const HoverLift = ({ 
  children,
  liftHeight = 8,
  shadowIntensity = 0.15,
  className 
}: { 
  children: ReactNode
  liftHeight?: number
  shadowIntensity?: number
  className?: string 
}) => {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={{
        y: isHovering ? -liftHeight : 0,
        boxShadow: isHovering
          ? `0 ${liftHeight * 2}px ${liftHeight * 3}px rgba(0, 0, 0, ${shadowIntensity})`
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20 
      }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// 🌊 WAVE ANIMATION
// ============================================

export const WaveAnimation = ({ 
  className,
  waveColor = 'primary',
  amplitude = 20,
  frequency = 0.02 
}: { 
  className?: string
  waveColor?: string
  amplitude?: number
  frequency?: number 
}) => {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.01
      if (ref.current) {
        const path = ref.current.querySelector('path')
        if (path) {
          const width = 400
          const height = 100
          
          let d = `M 0,${height / 2}`
          
          for (let x = 0; x <= width; x++) {
            const y = height / 2 + Math.sin(x * frequency + time) * amplitude
            d += ` L ${x},${y}`
          }
          
          d += ` L ${width},${height} L 0,${height} Z`
          path.setAttribute('d', d)
        }
      }
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => cancelAnimationFrame(animationId)
  }, [amplitude, frequency])

  return (
    <svg
      ref={ref}
      className={cn('w-full h-24', className)}
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
    >
      <path
        fill={`hsl(var(--${waveColor}) / 0.2)`}
        stroke={`hsl(var(--${waveColor}) / 0.4)`}
        strokeWidth="1"
      />
    </svg>
  )
}

// ============================================
// ✨ PARTICLE SYSTEM
// ============================================

export const ParticleSystem = ({ 
  particleCount = 50,
  className 
}: { 
  particleCount?: number
  className?: string 
}) => {
  const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 3 + 2,
  })), [particleCount])

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-primary/20 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

const InteractiveEffects = {
  CursorFollowSpotlight,
  MagneticHover,
  TiltCard,
  ParallaxElement,
  StaggerReveal,
  MorphingBlob,
  GlowOnScroll,
  TypewriterText,
  PaintDripReveal,
  HoverLift,
  WaveAnimation,
  ParticleSystem,
}

export default InteractiveEffects