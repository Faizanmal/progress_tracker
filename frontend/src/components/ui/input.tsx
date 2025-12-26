import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"
import { LucideIcon } from "lucide-react"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ghost: "border-transparent bg-muted/50 focus-visible:bg-background focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring",
        premium: "border-input shadow-sm focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
      },
      inputSize: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon: LeftIcon, rightIcon: RightIcon, leftElement, rightElement, ...props }, ref) => {
    const hasLeftContent = LeftIcon || leftElement;
    const hasRightContent = RightIcon || rightElement;

    if (hasLeftContent || hasRightContent) {
      return (
        <div className="relative">
          {hasLeftContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {LeftIcon ? <LeftIcon className="h-4 w-4" /> : leftElement}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              hasLeftContent && "pl-10",
              hasRightContent && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {RightIcon ? <RightIcon className="h-4 w-4" /> : rightElement}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }