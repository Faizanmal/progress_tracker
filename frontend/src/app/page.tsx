"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/use-auth";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { 
  CheckCircle2, 
  Users, 
  FolderKanban, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Target,
  Star
} from "lucide-react";
import { MotionDiv, FadeUp, StaggerContainer, StaggerItem, FloatingElement } from "@/src/lib/motion";
import { PageLoader } from "@/src/components/ui/premium-loading";
import { AnimatedDiv, ScrollReveal, GradientOrbs, FloatingElement as AnimatedFloat, AnimatedCard } from "@/src/components/ui/animated";
import { motion } from "framer-motion";

const features = [
  {
    icon: CheckCircle2,
    title: "Task Management",
    description: "Create, assign, and track tasks with detailed progress updates and real-time status tracking.",
    color: "primary",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: FolderKanban,
    title: "Project Tracking", 
    description: "Organize tasks into projects and monitor overall progress with seamless team collaboration.",
    color: "success",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Role-based access control for admins, managers, and employees with granular permissions.",
    color: "info",
    gradient: "from-purple-400 to-violet-500",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description: "Real-time analytics and reporting to track team performance and productivity metrics.",
    color: "warning",
    gradient: "from-orange-400 to-amber-500",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Enterprise-grade security with encrypted data and secure user authentication systems.",
    color: "primary",
    gradient: "from-red-400 to-rose-500",
  },
  {
    icon: Zap,
    title: "AI Automation",
    description: "Smart task assignment and workflow automation powered by advanced AI algorithms.",
    color: "success",
    gradient: "from-cyan-400 to-teal-500",
  },
];

const stats = [
  { value: "10K+", label: "Active Users", icon: Users },
  { value: "50K+", label: "Tasks Completed", icon: CheckCircle2 },
  { value: "99.9%", label: "Uptime", icon: TrendingUp },
  { value: "4.9/5", label: "User Rating", icon: Star },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <PageLoader message="Loading Progress Tracker..." submessage="Preparing your workspace..." variant="premium" />;
  }

  if (user) {
    return null;
  }

  return (
    <>
      <GradientOrbs />
      <div className="min-h-screen relative overflow-hidden bg-background">
        {/* Enhanced Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div 
            className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div 
            className="absolute -bottom-40 right-1/3 w-72 h-72 bg-gradient-to-br from-info/20 to-cyan-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 40, 0],
              y: [0, -50, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <div className="relative">
          {/* Enhanced Hero Section */}
          <section className="container mx-auto px-4 pt-24 pb-20 lg:pt-40 lg:pb-32">
            <div className="max-w-4xl mx-auto text-center">
              {/* Enhanced Badge */}
              <AnimatedDiv variant="fadeInUp" delay={0} className="relative">
                <motion.div
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/30 backdrop-blur-sm shadow-lg mb-8 group cursor-pointer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                  <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    ✨ Modern Progress Tracking Platform
                  </span>
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </AnimatedDiv>

              {/* Enhanced Heading */}
              <AnimatedDiv variant="fadeInUp" delay={0.1} className="relative">
                <motion.h1 
                  className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-8 relative"
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                  <motion.span 
                    className="block bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ backgroundSize: '200% 200%' }}
                  >
                    Track Progress.
                  </motion.span>
                  <motion.span 
                    className="block text-foreground"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    Boost Productivity.
                  </motion.span>
                  
                  {/* Floating decorative elements */}
                  <AnimatedFloat duration={6} offset={15} className="absolute -top-4 -right-8 text-primary/30">
                    <Target className="w-8 h-8" />
                  </AnimatedFloat>
                  <AnimatedFloat duration={4} offset={10} className="absolute top-1/2 -left-6 text-purple-500/30">
                    <TrendingUp className="w-6 h-6" />
                  </AnimatedFloat>
                </motion.h1>
              </AnimatedDiv>

              {/* Enhanced Subheading */}
              <AnimatedDiv variant="fadeInUp" delay={0.3}>
                <motion.p 
                  className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  The <span className="text-primary font-semibold">all-in-one platform</span> to track employee progress, manage tasks, 
                  and boost team productivity with powerful analytics and{" "}
                  <span className="text-gradient font-semibold">AI-driven insights</span>.
                </motion.p>
              </AnimatedDiv>

              {/* Enhanced CTAs */}
              <AnimatedDiv variant="fadeInUp" delay={0.4}>
                <motion.div 
                  className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="hero" 
                      size="2xl" 
                      onClick={() => router.push("/register")}
                      className="group relative overflow-hidden shadow-2xl shadow-primary/25 hover:shadow-primary/40"
                    >
                      <span className="relative z-10 flex items-center">
                        Get Started Free
                        <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="glassMorphism"
                      size="2xl"
                      onClick={() => router.push("/login")}
                      className="group"
                    >
                      Sign In
                      <motion.div
                        className="ml-2 w-4 h-4 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors duration-300"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </Button>
                  </motion.div>
                </motion.div>
              </AnimatedDiv>

              {/* Enhanced Social Proof */}
              <FadeUp>
                <AnimatedDiv variant="fadeInUp" delay={0.6}>
                <motion.div 
                  className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <span className="hidden sm:block">Trusted by teams at</span>
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div 
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-500 border-3 border-background flex items-center justify-center text-xs text-white font-bold shadow-lg"
                        whileHover={{ scale: 1.2, z: 10 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 300 }}
                      >
                        {String.fromCharCode(64 + i)}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                <span className="ml-2">
                  Trusted by <strong className="text-foreground">10,000+</strong> teams worldwide
                </span>
                </AnimatedDiv>
              </FadeUp>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-12">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <FadeUp>
            <div className="text-center mb-16">
              <Badge variant="premium" className="mb-4">Features</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help teams track progress, 
                collaborate effectively, and achieve their goals.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <StaggerItem key={i}>
                <Card variant="interactive" className="h-full group">
                  <CardHeader>
                    <div className={`inline-flex p-3 rounded-xl bg-${feature.color}/10 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-6 w-6 text-${feature.color}`} style={{ color: `hsl(var(--${feature.color}))` }} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-5xl mx-auto">
            <Card variant="glass" className="p-8 lg:p-12">
              <div className="text-center mb-12">
                <Badge variant="premium" className="mb-4">Benefits</Badge>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Why Choose Progress Tracker?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Everything you need to manage employee progress effectively
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <FadeUp delay={0.1}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">For Employees</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        "View assigned tasks and deadlines",
                        "Submit progress updates easily",
                        "Track personal productivity",
                        "Report blockers and get help",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>

                <FadeUp delay={0.2}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <BarChart3 className="h-5 w-5 text-violet-500" />
                      </div>
                      <h3 className="font-semibold text-lg">For Managers</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        "Monitor team progress in real-time",
                        "Identify and resolve blockers quickly",
                        "Generate performance reports",
                        "Manage projects and assignments",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <FadeUp>
            <Card variant="gradient" className="max-w-4xl mx-auto p-8 lg:p-16 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <FloatingElement>
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </FloatingElement>
                
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Ready to boost your team&apos;s productivity?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of teams already using Progress Tracker to achieve their goals faster.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    onClick={() => router.push("/register")}
                    className="group"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    onClick={() => router.push("/login")}
                  >
                    Schedule Demo
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> No credit card required
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 14-day free trial
                  </span>
                </p>
              </div>
            </Card>
          </FadeUp>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  PT
                </div>
                <span className="font-semibold">Progress Tracker</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Progress Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}
