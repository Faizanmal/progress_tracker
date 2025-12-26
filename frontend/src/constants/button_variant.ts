import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
          destructive:
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
          outline:
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          secondary:
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
          hero: "bg-gradient-to-r from-primary to-violet-500 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
          premium: "bg-gradient-to-r from-primary via-violet-500 to-primary text-white font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 bg-[length:200%_100%] hover:bg-right transition-all duration-300",
          success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md",
          warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md",
          subtle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          glow: "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 animate-glow",
        },
        size: {
          default: "h-10 px-4 py-2",
          xs: "h-7 rounded-md px-2 text-xs",
          sm: "h-9 rounded-md px-3",
          lg: "h-11 rounded-lg px-8",
          xl: "h-12 rounded-lg px-10 text-base",
          icon: "h-10 w-10",
          "icon-sm": "h-8 w-8",
          "icon-lg": "h-12 w-12",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )
  