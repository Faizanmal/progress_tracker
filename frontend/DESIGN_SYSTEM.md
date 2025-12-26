# 🎨 Progress Tracker - Premium Design System

## Overview

This design system provides a **world-class, premium UI** inspired by **Linear, Vercel, Raycast, Stripe, and Notion**. It includes:

- ✨ Modern, sleek aesthetic with luxury SaaS feel
- 🎭 Dark/Light theme with smooth transitions
- 🌊 Micro-interactions and animations (Framer Motion)
- 📱 Fully responsive (desktop, tablet, mobile)
- ♿ Accessibility-first (WCAG 2.1 AA compliant)
- 🏗️ Scalable component architecture

---

## 🎨 Color System

### Primary Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | Violet 500 | Violet 400 | Primary actions, links, focus states |
| `--secondary` | Gray 100 | Gray 800 | Secondary buttons, backgrounds |
| `--accent` | Same as secondary | Same as secondary | Hover states, highlights |

### Semantic Colors
| Token | Usage |
|-------|-------|
| `--success` | Success states, positive trends |
| `--warning` | Warning states, caution indicators |
| `--destructive` | Error states, destructive actions |
| `--info` | Informational elements |

### Surface Colors
| Token | Usage |
|-------|-------|
| `--background` | Page background |
| `--card` | Card surfaces |
| `--muted` | Subdued backgrounds |
| `--popover` | Dropdown, modal backgrounds |

---

## 📝 Typography

### Font Family
- **Primary**: Geist Sans (clean, modern, geometric)
- **Mono**: Geist Mono (code, technical content)

### Type Scale
```css
text-xs    → 0.75rem   /* Labels, captions */
text-sm    → 0.875rem  /* Body small */
text-base  → 1rem      /* Body default */
text-lg    → 1.125rem  /* Body large */
text-xl    → 1.25rem   /* Heading 5 */
text-2xl   → 1.5rem    /* Heading 4 */
text-3xl   → 1.875rem  /* Heading 3 */
text-4xl   → 2.25rem   /* Heading 2 */
text-5xl   → 3rem      /* Heading 1 */
text-7xl   → 4.5rem    /* Display */
```

### Font Weights
- `font-normal` (400) - Body text
- `font-medium` (500) - Labels, buttons
- `font-semibold` (600) - Subheadings
- `font-bold` (700) - Headings

---

## 📐 Spacing System

Based on 4px grid:
```
0.5  → 2px    1    → 4px    1.5  → 6px
2    → 8px    2.5  → 10px   3    → 12px
4    → 16px   5    → 20px   6    → 24px
8    → 32px   10   → 40px   12   → 48px
16   → 64px   20   → 80px   24   → 96px
```

---

## 🔲 Border Radius

```css
--radius-sm: 0.375rem  /* 6px - Small elements */
--radius-md: 0.5rem    /* 8px - Medium elements */
--radius-lg: 0.75rem   /* 12px - Cards, inputs */
--radius-xl: 1rem      /* 16px - Large cards */
--radius-2xl: 1.5rem   /* 24px - Modals */
--radius-full: 9999px  /* Badges, pills */
```

---

## 🌟 Shadow System

### Light Mode
```css
--shadow-xs   /* Subtle elevation */
--shadow-sm   /* Cards, inputs */
--shadow-md   /* Dropdowns */
--shadow-lg   /* Modals, hover states */
--shadow-xl   /* Popovers */
--shadow-2xl  /* Dialogs */
--shadow-glow /* Primary accent glow */
```

### Dark Mode
Shadows are more pronounced with higher opacity for visibility.

---

## 🧩 Components

### Button Variants
| Variant | Usage |
|---------|-------|
| `default` | Primary actions |
| `secondary` | Secondary actions |
| `outline` | Tertiary actions |
| `ghost` | Minimal actions |
| `destructive` | Dangerous actions |
| `hero` | CTA buttons with gradient |
| `premium` | Premium animated buttons |
| `success` | Positive actions |
| `warning` | Caution actions |

### Card Variants
| Variant | Usage |
|---------|-------|
| `default` | Standard cards |
| `elevated` | Prominent cards |
| `glass` | Glassmorphism effect |
| `gradient` | Subtle gradient background |
| `glow` | Hover glow effect |
| `interactive` | Clickable cards with hover lift |

### Badge Variants
| Variant | Usage |
|---------|-------|
| `default` | Primary badges |
| `secondary` | Subdued badges |
| `destructive` | Error/warning badges |
| `success` | Success states |
| `warning` | Warning states |
| `info` | Informational |
| `premium` | Highlighted badges |
| `outline` | Bordered badges |

---

## 🌊 Animations

### Framer Motion Components
Located in `/src/lib/motion.tsx`:

```tsx
// Fade animations
<FadeIn>...</FadeIn>
<FadeUp>...</FadeUp>
<FadeDown>...</FadeDown>

// Scale animations
<ScaleIn>...</ScaleIn>

// Stagger animations
<StaggerContainer>
  <StaggerItem>...</StaggerItem>
</StaggerContainer>

// Hover effects
<HoverCard>...</HoverCard>
<HoverGlow>...</HoverGlow>

// Loading states
<LoadingSpinner />
<LoadingDots />
<PulseLoader />

// Page transitions
<PageTransition>...</PageTransition>
<SlideTransition direction="right">...</SlideTransition>

// Special effects
<FloatingElement>...</FloatingElement>
<GlowPulse>...</GlowPulse>
```

### CSS Animations
```css
.animate-fade-in
.animate-fade-up
.animate-fade-down
.animate-scale-in
.animate-slide-in-left
.animate-slide-in-right
.animate-shimmer
.animate-pulse-soft
.animate-float
.animate-glow
```

---

## 🎭 Theme Classes

### Glassmorphism
```css
.glass        /* Subtle blur effect */
.glass-strong /* Strong blur effect */
```

### Gradients
```css
.gradient-primary  /* Primary gradient */
.gradient-subtle   /* Subtle background gradient */
.gradient-mesh     /* Multi-color mesh gradient */
.gradient-text     /* Text gradient */
```

### Premium Cards
```css
.card-premium  /* Premium card with hover */
.card-glow     /* Card with glow effect */
```

---

## 📦 Component Imports

```tsx
// From components/index.ts
import {
  // Layout
  AppShell,
  PageContainer,
  PageHeader,
  Section,
  ContentGrid,
  PremiumSidebar,
  MobileNav,
  
  // UI Components
  Button,
  Card,
  Badge,
  Input,
  StatCard,
  EmptyState,
  Spinner,
  PageLoader,
  ThemeToggle,
  
  // Table
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/src/components";

// Motion utilities
import {
  MotionDiv,
  FadeUp,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  PageTransition,
} from "@/src/lib/motion";
```

---

## 🔧 Usage Examples

### Stat Cards
```tsx
<StatCardGrid>
  <StatCard
    title="Total Users"
    value={1234}
    subtitle="12 active"
    icon={Users}
    color="primary"
    trend={{ value: 12, label: "vs last month" }}
  />
</StatCardGrid>
```

### Empty States
```tsx
<EmptyState
  icon={Inbox}
  title="No data yet"
  description="Start by adding some data"
  action={{
    label: "Add Data",
    onClick: () => {},
  }}
/>
```

### Premium Buttons
```tsx
<Button variant="hero" size="xl">
  Get Started
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

### Animated Cards
```tsx
<StaggerContainer>
  {items.map((item, i) => (
    <StaggerItem key={i}>
      <Card variant="interactive">
        {/* content */}
      </Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

---

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## ♿ Accessibility

- All interactive elements have visible focus states
- Color contrast meets WCAG 2.1 AA standards
- Keyboard navigation supported throughout
- ARIA labels on icons and interactive elements
- Reduced motion support via `prefers-reduced-motion`

---

## 🚀 Performance Tips

1. **Use Dynamic Imports** for heavy components
2. **Lazy load animations** below the fold
3. **Optimize images** with Next.js Image component
4. **Use `loading="lazy"`** on non-critical content
5. **Minimize motion** on mobile devices
6. **Use `will-change`** sparingly for animations

---

## 🎯 Design Principles

1. **Consistency** - Use design tokens consistently
2. **Hierarchy** - Clear visual hierarchy with typography
3. **Whitespace** - Generous spacing for premium feel
4. **Feedback** - Immediate visual feedback on interactions
5. **Accessibility** - Inclusive design for all users
6. **Performance** - Fast, smooth animations

---

## 📚 Recommended Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
