"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { MotionDiv } from "@/src/lib/motion"

import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" className="relative">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative overflow-hidden">
          <MotionDiv
            initial={false}
            animate={{
              rotate: theme === "dark" ? 45 : 0,
              scale: theme === "dark" ? 0 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute"
          >
            <Sun className="h-4 w-4 text-amber-500" />
          </MotionDiv>
          <MotionDiv
            initial={false}
            animate={{
              rotate: theme === "dark" ? 0 : -45,
              scale: theme === "dark" ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute"
          >
            <Moon className="h-4 w-4 text-violet-400" />
          </MotionDiv>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="gap-2"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light</span>
          {theme === "light" && (
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto h-2 w-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="gap-2"
        >
          <Moon className="h-4 w-4 text-violet-400" />
          <span>Dark</span>
          {theme === "dark" && (
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto h-2 w-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="gap-2"
        >
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span>System</span>
          {theme === "system" && (
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto h-2 w-2 rounded-full bg-primary"
            />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}