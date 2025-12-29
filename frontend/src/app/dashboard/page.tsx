"use client";

import { useAuth, useRequireAuth } from "@/src/hooks/use-auth";
import { EmployeeDashboard } from "@/src/components/dashboard/EmployeeDashboard";
import { ManagerDashboard } from "@/src/components/dashboard/ManagerDashboard";
import { AdminDashboard } from "@/src/components/dashboard/AdminDashboard";
import { PageLoader } from "@/src/components/ui/loading";
import { PageHeader, PageContainer } from "@/src/components/layout/AppShell";
import { MotionDiv } from "@/src/lib/motion";
import { AnimatedDiv, ScrollReveal, GradientOrbs, FloatingElement } from "@/src/components/ui/animated";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles, Zap } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Protected route - redirect to login if not authenticated
  useRequireAuth();

  if (isLoading) {
    return <PageLoader message="Loading your dashboard..." />;
  }

  if (!user) {
    return null; // useRequireAuth will handle redirect
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 18) return "☀️";
    return "🌆";
  };

  return (
    <>
      <GradientOrbs />
      <PageContainer className="relative">
        <AnimatedDiv variant="fadeInUp" className="mb-8 relative">
          {/* Floating decorative elements */}
          <FloatingElement 
            duration={6} 
            offset={15} 
            className="absolute -top-4 -right-4 text-primary/20"
          >
            <Sparkles className="w-8 h-8" />
          </FloatingElement>
          
          <FloatingElement 
            duration={4} 
            offset={10} 
            className="absolute -top-2 -left-2 text-info/20"
          >
            <TrendingUp className="w-6 h-6" />
          </FloatingElement>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            {/* Enhanced greeting header with gradient background */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.span 
                    className="text-3xl"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    {getGreetingIcon()}
                  </motion.span>
                  <motion.h1 
                    className="text-3xl font-bold tracking-tight lg:text-4xl bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {getGreeting()}, {user.name.split(" ")[0]}!
                  </motion.h1>
                </div>

                <motion.p 
                  className="text-muted-foreground text-lg leading-relaxed flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Here&apos;s what&apos;s happening with your work today.
                </motion.p>

                {/* Role badge with enhanced styling */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="mt-4"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/30 rounded-full text-primary font-medium text-sm backdrop-blur-sm">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                  </span>
                </motion.div>
              </motion.div>

              {/* Decorative shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: "linear"
                }}
              />
            </div>
          </motion.div>
        </AnimatedDiv>

        {/* Enhanced dashboard components with stagger animation */}
        <ScrollReveal variant="fadeInUp" threshold={0.2}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {user.role === "admin" && <AdminDashboard />}
            {user.role === "manager" && <ManagerDashboard />}
            {user.role === "employee" && <EmployeeDashboard />}
          </motion.div>
        </ScrollReveal>
      </PageContainer>
    </>
  );
}
