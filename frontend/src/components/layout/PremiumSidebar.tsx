"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { MotionDiv } from "@/src/lib/motion";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { ThemeToggle } from "@/src/components/ui/theme-toggle";
import { useAuth } from "@/src/hooks/use-auth";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Clock,
  Zap,
  BarChart3,
  Sparkles,
  Users,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Command,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
  { label: "Projects", href: "/projects", icon: FolderKanban, roles: ["admin", "manager", "employee"] },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["admin", "manager", "employee"] },
  { label: "Progress", href: "/progress", icon: TrendingUp, roles: ["admin", "manager", "employee"] },
  { label: "Time Tracking", href: "/time-tracking", icon: Clock, roles: ["admin", "manager", "employee"] },
  { label: "Automation", href: "/automation", icon: Zap, roles: ["admin", "manager", "employee"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "manager"] },
  { label: "AI Insights", href: "/ai-insights", icon: Sparkles, roles: ["admin", "manager"] },
  { label: "Team", href: "/team", icon: Users, roles: ["admin", "manager"] },
  { label: "Reports", href: "/reports", icon: FileText, roles: ["admin", "manager"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin", "manager", "employee"] },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function PremiumSidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <MotionDiv
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen",
          "bg-sidebar-background border-r border-sidebar-border",
          "flex flex-col"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-sidebar-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-violet-500 text-white font-bold shadow-md shadow-primary/20">
              PT
            </div>
            {!collapsed && (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-lg"
              >
                Progress
              </MotionDiv>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onCollapsedChange?.(!collapsed)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search (only when expanded) */}
        {!collapsed && (
          <div className="p-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground h-9 px-3"
              onClick={() => {/* Open command palette */}}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              const navLink = (
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-sidebar-accent",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <MotionDiv
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    navLink
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          {/* Collapse button (when collapsed) */}
          {collapsed && (
            <div className="mb-2 flex justify-center">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onCollapsedChange?.(!collapsed)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Theme & Notifications */}
          <div className={cn(
            "flex items-center gap-1 mb-3",
            collapsed ? "justify-center" : "justify-start"
          )}>
            <ThemeToggle />
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/notifications")}
              >
                <Bell className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-auto p-2 justify-start",
                  collapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="ml-2 flex-1 text-left">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{user.role}</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "start"} side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </MotionDiv>
    </TooltipProvider>
  );
}

// ============================================
// MOBILE NAV
// ============================================

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 text-white font-bold text-sm">
              PT
            </div>
            <span className="font-semibold">Progress</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {open && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <MotionDiv
        initial={{ x: "100%" }}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed right-0 top-16 bottom-0 z-50 w-72 bg-background border-l border-border overflow-y-auto"
      >
        <nav className="p-4">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </MotionDiv>
    </>
  );
}
