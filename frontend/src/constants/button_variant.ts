import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] relative overflow-hidden",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5",
          destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5",
          outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 hover:-translate-y-0.5",
          secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5",
          ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
          link: "text-primary underline-offset-4 hover:underline",
          
          // 🌟 PREMIUM VARIANTS
          hero: "bg-gradient-to-r from-primary via-violet-500 to-blue-500 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 bg-[length:200%_100%] hover:bg-right transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
          
          premium: "bg-gradient-to-r from-primary via-violet-500 to-primary text-white font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 bg-[length:200%_100%] hover:bg-right transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
          
          glass: "bg-white/10 backdrop-blur-lg border border-white/20 text-foreground shadow-lg shadow-black/5 hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5 dark:bg-black/10 dark:border-white/10 dark:hover:bg-black/20 dark:hover:border-white/20",
          
          glassMorphism: "bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 text-foreground shadow-xl shadow-black/10 hover:from-white/25 hover:via-white/15 hover:to-white/10 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl dark:from-white/10 dark:via-white/5 dark:to-white/2 dark:border-white/10 dark:hover:from-white/15 dark:hover:via-white/8 dark:hover:to-white/5",
          
          gradient: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 hover:scale-105",
          
          neon: "bg-transparent border-2 border-primary text-primary font-medium shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:-translate-y-0.5",
          
          floating: "bg-background/80 backdrop-blur-sm border border-border shadow-lg shadow-black/5 text-foreground hover:bg-background/90 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 animate-float",
          
          success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md hover:-translate-y-0.5",
          warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md hover:-translate-y-0.5",
          info: "bg-info text-info-foreground shadow-sm hover:bg-info/90 hover:shadow-md hover:-translate-y-0.5",
          subtle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:-translate-y-0.5",
          
          glow: "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 animate-pulse-glow",
          
          shine: "bg-gradient-to-r from-primary to-primary bg-[length:200%_100%] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-[position:right_center] hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-700 hover:before:left-full",
        },
        size: {
          default: "h-10 px-4 py-2",
          xs: "h-7 rounded-md px-2 text-xs",
          sm: "h-9 rounded-md px-3",
          lg: "h-11 rounded-lg px-8",
          xl: "h-12 rounded-lg px-10 text-base font-medium",
          "2xl": "h-14 rounded-xl px-12 text-lg font-medium",
          icon: "h-10 w-10",
          "icon-sm": "h-8 w-8",
          "icon-lg": "h-12 w-12",
          "icon-xl": "h-14 w-14",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )
  