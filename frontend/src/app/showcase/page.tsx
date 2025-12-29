"use client";

import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { AnimatedDiv, ScrollReveal, AnimatedCard, FloatingElement } from "@/src/components/ui/animated";
import { 
  CursorFollowSpotlight,
  MagneticHover, 
  TiltCard,
  StaggerReveal,
  GlowOnScroll,
  TypewriterText,
  HoverLift,
  ParticleSystem
} from "@/src/components/ui/interactive-effects";
import { PremiumSpinner, PageLoader, InlineLoader } from "@/src/components/ui/premium-loading";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Heart, 
  Star,
  Rocket,
  Palette,
  Play,
  Pause,
  Volume2
} from "lucide-react";
import { useState } from "react";

export default function ComponentShowcasePage() {
  const [showPageLoader, setShowPageLoader] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-16">
        {/* Hero Section */}
        <CursorFollowSpotlight className="text-center py-16">
          <AnimatedDiv variant="fadeInUp" className="space-y-6">
            <div className="flex justify-center items-center gap-3 mb-4">
              <FloatingElement duration={4} offset={15}>
                <Palette className="w-8 h-8 text-primary" />
              </FloatingElement>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Modern UI Showcase
              </h1>
              <FloatingElement duration={6} offset={10}>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </FloatingElement>
            </div>
            
            <TypewriterText 
              text="Experience the future of web design with glassmorphism, animations, and modern interactions."
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              speed={30}
            />
            
            <div className="flex gap-4 justify-center mt-8">
              <MagneticHover>
                <Button variant="hero" size="xl">
                  <Rocket className="w-5 h-5 mr-2" />
                  Explore Components
                </Button>
              </MagneticHover>
              
              <Button 
                variant="glassMorphism" 
                size="xl"
                onClick={() => setShowPageLoader(true)}
              >
                <Play className="w-5 h-5 mr-2" />
                See Loaders
              </Button>
            </div>
          </AnimatedDiv>
        </CursorFollowSpotlight>

        {/* Button Variants Showcase */}
        <ScrollReveal variant="fadeInUp">
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Premium Button Collection</h2>
              <p className="text-muted-foreground text-lg">Modern button variants with animations and effects</p>
            </div>
            
            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="glass" className="p-6 space-y-4">
                <h3 className="font-semibold">Hero Buttons</h3>
                <div className="space-y-3">
                  <Button variant="hero" className="w-full">Hero Button</Button>
                  <Button variant="premium" className="w-full">Premium Button</Button>
                  <Button variant="shine" className="w-full">Shine Effect</Button>
                </div>
              </Card>

              <Card variant="glassMorphism" className="p-6 space-y-4">
                <h3 className="font-semibold">Glass Effects</h3>
                <div className="space-y-3">
                  <Button variant="glass" className="w-full">Glass Button</Button>
                  <Button variant="glassMorphism" className="w-full">Glassmorphism</Button>
                  <Button variant="floating" className="w-full">Floating</Button>
                </div>
              </Card>

              <Card variant="neon" className="p-6 space-y-4">
                <h3 className="font-semibold">Special Effects</h3>
                <div className="space-y-3">
                  <Button variant="neon" className="w-full">Neon Glow</Button>
                  <Button variant="gradient" className="w-full">Gradient</Button>
                  <Button variant="glow" className="w-full">Glow Effect</Button>
                </div>
              </Card>
            </StaggerReveal>
          </section>
        </ScrollReveal>

        {/* Card Variants Showcase */}
        <ScrollReveal variant="fadeInUp">
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Modern Card Collection</h2>
              <p className="text-muted-foreground text-lg">Glassmorphism, gradients, and interactive effects</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Glass Card */}
              <AnimatedCard hover glow className="h-48">
                <Card variant="glass" className="h-full p-6 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline">Glass</Badge>
                  </div>
                  <div className="space-y-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">Glass Effect</h3>
                    <p className="text-sm text-muted-foreground">Backdrop blur with transparency</p>
                  </div>
                </Card>
              </AnimatedCard>

              {/* Glassmorphism Card */}
              <TiltCard tiltAngle={10} className="h-48">
                <Card variant="glassMorphism" className="h-full p-6 relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline">Morphism</Badge>
                  </div>
                  <div className="space-y-4">
                    <Zap className="w-8 h-8 text-purple-500" />
                    <h3 className="font-semibold">Glassmorphism</h3>
                    <p className="text-sm text-muted-foreground">Advanced glass effect</p>
                  </div>
                </Card>
              </TiltCard>

              {/* Glow Card */}
              <HoverLift liftHeight={12} className="h-48">
                <Card variant="glow" className="h-full p-6 relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline">Glow</Badge>
                  </div>
                  <div className="space-y-4">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <h3 className="font-semibold">Glow Effect</h3>
                    <p className="text-sm text-muted-foreground">Hover glow animation</p>
                  </div>
                </Card>
              </HoverLift>

              {/* Interactive Card */}
              <GlowOnScroll glowColor="primary" className="h-48">
                <Card variant="interactive" className="h-full p-6 relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline">Interactive</Badge>
                  </div>
                  <div className="space-y-4">
                    <Heart className="w-8 h-8 text-red-500" />
                    <h3 className="font-semibold">Scroll Glow</h3>
                    <p className="text-sm text-muted-foreground">Glows when in view</p>
                  </div>
                </Card>
              </GlowOnScroll>
            </div>
          </section>
        </ScrollReveal>

        {/* Loading Components */}
        <ScrollReveal variant="fadeInUp">
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Premium Loading States</h2>
              <p className="text-muted-foreground text-lg">Beautiful spinners and loading animations</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="glass" className="p-8 text-center space-y-4">
                <h3 className="font-semibold">Spinners</h3>
                <div className="flex justify-center gap-4">
                  <PremiumSpinner variant="premium" size="md" />
                  <PremiumSpinner variant="gradient" size="md" />
                  <PremiumSpinner variant="glow" size="md" />
                </div>
              </Card>

              <Card variant="glassMorphism" className="p-8 text-center space-y-4">
                <h3 className="font-semibold">Inline Loaders</h3>
                <div className="space-y-3">
                  <InlineLoader message="Loading..." variant="dots" />
                  <InlineLoader message="Processing..." variant="bars" />
                  <InlineLoader message="Saving..." variant="minimal" />
                </div>
              </Card>

              <Card variant="glow" className="p-8 text-center space-y-4">
                <h3 className="font-semibold">Button States</h3>
                <div className="space-y-3">
                  <Button variant="premium" disabled className="w-full">
                    <PremiumSpinner variant="premium" size="sm" className="mr-2" />
                    Loading...
                  </Button>
                  <Button variant="glass" disabled className="w-full">
                    <InlineLoader variant="dots" />
                  </Button>
                </div>
              </Card>

              <Card variant="interactive" className="p-8 text-center space-y-4">
                <h3 className="font-semibold">Effects Demo</h3>
                <div className="space-y-3">
                  <MagneticHover>
                    <Button variant="neon" className="w-full">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Magnetic Hover
                    </Button>
                  </MagneticHover>
                  
                  <Button 
                    variant="floating" 
                    className="w-full"
                    onClick={() => {
                      // Trigger some action
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Floating Effect
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        </ScrollReveal>

        {/* Interactive Effects Demo */}
        <ScrollReveal variant="fadeInUp">
          <section className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Interactive Effects</h2>
              <p className="text-muted-foreground text-lg">Hover, click, and scroll to see the magic</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Particle System Demo */}
              <Card variant="glass" className="p-8 relative h-64 overflow-hidden">
                <ParticleSystem particleCount={30} />
                <div className="relative z-10 text-center space-y-4">
                  <h3 className="text-xl font-bold">Particle System</h3>
                  <p className="text-muted-foreground">Animated floating particles</p>
                </div>
              </Card>

              {/* Magnetic Hover Demo */}
              <Card variant="glassMorphism" className="p-8 h-64 flex items-center justify-center">
                <MagneticHover strength={0.5} className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-500 rounded-full mx-auto flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Magnetic Element</h3>
                  <p className="text-muted-foreground">Move your cursor over this area</p>
                </MagneticHover>
              </Card>
            </div>
          </section>
        </ScrollReveal>

        {/* Footer */}
        <footer className="text-center py-16 space-y-6">
          <div className="flex justify-center items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-medium">Built with Modern Design Principles</span>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This showcase demonstrates the power of modern web design with glassmorphism, 
            smooth animations, and interactive effects. Every component is built for performance 
            and accessibility.
          </p>
        </footer>
      </div>

      {/* Full Page Loader Overlay */}
      {showPageLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowPageLoader(false)}
        >
          <PageLoader 
            message="Loading Beautiful Experience..." 
            submessage="Click anywhere to close"
            variant="premium"
          />
        </motion.div>
      )}
    </div>
  );
}