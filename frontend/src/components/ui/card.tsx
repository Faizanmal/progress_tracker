import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-300 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5",
        elevated: "bg-card border border-border shadow-md hover:shadow-lg hover:-translate-y-1",
        
        // 🌟 MODERN GLASSMORPHISM VARIANTS
        glass: "bg-card/70 backdrop-blur-xl border border-border/50 shadow-lg hover:bg-card/80 hover:border-border/60 hover:-translate-y-1",
        glassStrong: "bg-card/85 backdrop-blur-2xl border border-border/60 shadow-xl hover:bg-card/90 hover:border-border/70 hover:-translate-y-1",
        glassMorphism: "bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-xl hover:from-white/25 hover:via-white/15 hover:to-white/10 hover:border-white/30 hover:-translate-y-1 dark:from-white/10 dark:via-white/5 dark:to-white/2 dark:border-white/10 dark:hover:from-white/15 dark:hover:via-white/8 dark:hover:to-white/5",
        
        // 🎨 GRADIENT VARIANTS  
        gradient: "bg-gradient-to-br from-card to-muted/50 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5",
        gradientPrimary: "bg-gradient-to-br from-primary/5 via-card to-primary/5 border border-primary/20 shadow-sm hover:shadow-md hover:from-primary/10 hover:to-primary/10 hover:-translate-y-0.5",
        gradientMesh: "bg-card border border-border shadow-sm before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:via-transparent before:to-info/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 hover:shadow-md hover:-translate-y-0.5",
        
        // ✨ PREMIUM EFFECTS
        glow: "bg-card border border-border shadow-lg hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1",
        glowStrong: "bg-card border border-border shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 hover:-translate-y-1 hover:scale-105",
        neon: "bg-card border-2 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.15)] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.25)] hover:-translate-y-1",
        
        // 🎪 INTERACTIVE VARIANTS
        interactive: "bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-200",
        interactiveGlow: "bg-card border border-border shadow-sm hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1 cursor-pointer",
        floating: "bg-card border border-border shadow-lg animate-float hover:shadow-xl hover:-translate-y-2",
        tilt: "bg-card border border-border shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:rotate-1 hover:scale-105",
        
        // 🏷️ UTILITY VARIANTS
        outline: "bg-transparent border-2 border-border hover:bg-accent/50 hover:-translate-y-0.5",
        outlineGlow: "bg-transparent border-2 border-border hover:bg-accent/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5",
        ghost: "bg-transparent border-none shadow-none hover:bg-accent/20",
        minimal: "bg-card/50 border-none shadow-none hover:bg-card/70 hover:-translate-y-0.5",
        
        // 🎯 STATUS VARIANTS
        success: "bg-card border border-success/30 shadow-sm shadow-success/10 hover:shadow-md hover:shadow-success/20 hover:border-success/50 hover:-translate-y-0.5",
        warning: "bg-card border border-warning/30 shadow-sm shadow-warning/10 hover:shadow-md hover:shadow-warning/20 hover:border-warning/50 hover:-translate-y-0.5",
        info: "bg-card border border-info/30 shadow-sm shadow-info/10 hover:shadow-md hover:shadow-info/20 hover:border-info/50 hover:-translate-y-0.5",
        destructive: "bg-card border border-destructive/30 shadow-sm shadow-destructive/10 hover:shadow-md hover:shadow-destructive/20 hover:border-destructive/50 hover:-translate-y-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
