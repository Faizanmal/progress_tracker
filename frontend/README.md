# Progress Tracker - Frontend

Modern Next.js 16 frontend for the Employee Progress Tracker SaaS application.

## 🚀 Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Components**: Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: Axios
- **Notifications**: Sonner

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard (role-based)
│   │   ├── tasks/              # Task management pages
│   │   │   └── [id]/          # Task detail & progress updates
│   │   ├── projects/           # Project management pages
│   │   ├── analytics/          # Analytics and reporting pages
│   │   ├── ai-insights/        # AI-powered insights pages
│   │   ├── login/              # Authentication pages
│   │   ├── register/
│   │   └── layout.tsx          # Root layout with navigation
│   │
│   ├── components/
│   │   ├── dashboard/          # Dashboard components by role
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   ├── ManagerDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── layout/             # Layout components
│   │   │   └── MainNav.tsx     # Main navigation with role-based menu
│   │   └── ui/                 # Shadcn/ui components (40+)
│   │
│   ├── lib/
│   │   ├── api-client.ts       # API client with all endpoints
│   │   ├── api.ts              # Axios instance with JWT interceptor
│   │   ├── auth-store.ts       # Zustand auth state management
│   │   └── utils.ts            # Utility functions
│   │
│   ├── hooks/
│   │   ├── use-auth.ts         # Authentication hook
│   │   └── use-toast.ts        # Toast notification hook
│   │
│   └── types/
│       └── index.ts            # TypeScript type definitions
```

## 🎨 Features Implemented

### ✅ Authentication System
- Login & Registration pages
- JWT token management
- Auto token refresh
- Protected routes
- Role-based access control

### ✅ Dashboard (Role-Based)
- **Employee**: Personal tasks, progress updates, stats
- **Manager**: Team progress, blocked tasks, project overview
- **Admin**: Company stats, user management, system overview

### ✅ Task Management
- Task list with search & filters
- Task detail with progress updates
- Submit progress with status, hours worked, blockers
- Visual progress indicators

### ✅ Project Management
- Projects grid view
- Search & filtering
- Team member display
- Project timelines

### ✅ Analytics & Reporting
- Team productivity metrics
- Progress trends and insights
- Custom report generation

### ✅ AI Insights
- AI-powered progress analysis
- Predictive insights and recommendations
- Contextual suggestions for task management

### ✅ Navigation
- Role-based menu
- Responsive mobile layout
- User profile dropdown

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Running Django backend at `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## 📡 API Integration

Backend connection configured with:
- JWT authentication
- Auto token refresh
- Error handling
- Loading states

## 🔐 Authentication Flow

1. Login → JWT tokens → Store in Zustand
2. Axios interceptor adds auth header
3. Auto refresh on 401 error
4. Logout clears state

## 📝 Next Steps

- Task create/edit forms
- Project detail pages
- Notifications system
- Settings pages
- Advanced AI insights features
- Mobile app development

## 📄 Documentation

- [Backend API](../backend/README.md)
- [Project Summary](../PROJECT_SUMMARY.md)
- [Quick Start](../QUICKSTART.md)
