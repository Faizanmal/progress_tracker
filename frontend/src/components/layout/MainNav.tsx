"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/use-auth";
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
import { Bell, Menu, X, Zap, TrendingUp, Wallet, Shield, Building2, Flag } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ThemeToggle } from "@/src/components/ui/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  roles: string[];
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["admin", "manager", "employee"], icon: <TrendingUp className="w-4 h-4" /> },
  { label: "Projects", href: "/projects", roles: ["admin", "manager", "employee"] },
  { label: "Tasks", href: "/tasks", roles: ["admin", "manager", "employee"] },
  { label: "Progress", href: "/progress", roles: ["admin", "manager", "employee"] },
  { label: "Time Tracking", href: "/time-tracking", roles: ["admin", "manager", "employee"] },
  { label: "Automation", href: "/automation", roles: ["admin", "manager", "employee"], icon: <Zap className="w-4 h-4" /> },
  { label: "Resources", href: "/resources", roles: ["admin", "manager"], icon: <Wallet className="w-4 h-4" /> },
  { label: "Milestones", href: "/milestones", roles: ["admin", "manager"], icon: <Flag className="w-4 h-4" /> },
  { label: "Analytics", href: "/analytics", roles: ["admin", "manager"] },
  { label: "AI Insights", href: "/ai-insights", roles: ["admin", "manager"] },
  { label: "Team", href: "/team", roles: ["admin", "manager"] },
  { label: "Reports", href: "/reports", roles: ["admin", "manager"] },
  { label: "Audit", href: "/audit", roles: ["admin"], icon: <Shield className="w-4 h-4" /> },
  { label: "Organization", href: "/organization", roles: ["admin"], icon: <Building2 className="w-4 h-4" /> },
  { label: "Settings", href: "/settings", roles: ["admin", "manager", "employee"] },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const visibleNavItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  if (!user) {
    return null;
  }

  return (
    <motion.nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg" 
          : "bg-background/60 backdrop-blur-md border-b border-border/30"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 🌟 Enhanced Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-blue-500 text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                  PT
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 blur transition-all duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hidden md:inline group-hover:from-primary group-hover:to-purple-500 transition-all duration-300">
                Progress Tracker
              </span>
            </Link>
          </motion.div>

          {/* 🎪 Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 group overflow-hidden",
                      isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {item.icon && (
                      <motion.span
                        className={cn(
                          "transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        {item.icon}
                      </motion.span>
                    )}
                    <span>{item.label}</span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      whileHover={{ scale: 1.05 }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* ⚡ Enhanced Right Side - Notifications and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ThemeToggle />
            </motion.div>

            {/* Enhanced Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="glass" 
                size="icon" 
                onClick={() => router.push("/notifications")}
                className="relative group"
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <Bell className="h-5 w-5" />
                </motion.div>
                {/* Notification indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="sr-only">Notifications</span>
              </Button>
            </motion.div>

            {/* Enhanced User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-accent/50">
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-border/20 transition-all duration-200 hover:ring-primary/30">
                        <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-foreground font-semibold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-background/80 backdrop-blur-xl border border-border/50 shadow-xl" 
                align="end" 
                forceMount
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <Badge 
                        variant="outline" 
                        className="w-fit mt-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors duration-200"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50 transition-colors duration-200"
                  >
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/50 dark:focus:bg-red-950/50 transition-colors duration-200"
                  >
                    Log out
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enhanced Mobile Menu Button */}
            <motion.div 
              className="md:hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="glass"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* 📱 Enhanced Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div 
                className="border-t border-border/50 py-4 bg-background/50 backdrop-blur-sm rounded-b-lg"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col space-y-1">
                  {visibleNavItems.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.icon && (
                            <span className={cn(
                              "transition-colors duration-200",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                              {item.icon}
                            </span>
                          )}
                          <span>{item.label}</span>
                          {isActive && (
                            <motion.div
                              className="ml-auto w-2 h-2 bg-primary rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Add padding to account for fixed navigation */}
      <div className="h-16" />
    </motion.nav>
  );
}
