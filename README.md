# 🚀 Progress Tracker - Employee Progress Tracking System

A modern, trust-based SaaS application for tracking employee progress on tasks and projects. Built with Django REST Framework and Next.js.

## 📋 Overview

Progress Tracker is an ethical, transparent employee progress tracking system that helps teams stay aligned through self-reported progress updates. It's designed to foster trust and collaboration, not surveillance.

### ✨ Key Features

- **📊 Role-Based Access**: Admin, Manager, and Employee roles with appropriate permissions
- **📝 Task Management**: Create, assign, and track tasks with deadlines and priorities
- **📈 Progress Updates**: Simple, intuitive progress reporting by employees
- **🔔 Smart Notifications**: Automatic reminders and alerts for blockers, deadlines, and updates
- **📧 Email Digests**: Daily reminders and weekly progress summaries
- **👥 Team Dashboard**: Managers can view team progress at a glance
- **🎯 Project Organization**: Group tasks into projects with team assignments
- **⏰ Deadline Tracking**: Automatic alerts for overdue and upcoming deadlines
- **🚫 Blocker Management**: Quick identification and notification of blocked tasks
- **📱 Modern UI**: Built with React, Next.js, and TailwindCSS

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- TailwindCSS
- React Query (TanStack Query)
- Zustand (State Management)
- Axios
- Shadcn/ui Components

**Backend:**
- Django 5.2 + Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication
- Celery + Redis (Background Tasks)
- Email Integration

### Project Structure

```
ProgressTracker/
├── backend/              # Django REST API
│   ├── backend/          # Project settings
│   ├── users/            # User management & auth
│   ├── projects/         # Project management
│   ├── tasks/            # Task management
│   ├── progress/         # Progress tracking
│   ├── analytics/        # Analytics and reporting
│   ├── ai_insights/      # AI-powered insights
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & API client
│   │   ├── types/        # TypeScript types
│   │   ├── hooks/        # Custom React hooks
│   │   └── constants/    # App constants
│   ├── public/
│   └── package.json
│
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Redis (for background tasks)
- PostgreSQL (recommended for production)

### Backend Setup

1. **Navigate to backend directory**
```powershell
cd backend
```

2. **Create virtual environment**
```powershell
python -m venv venv
.\venv\Scripts\Activate
```

3. **Install dependencies**
```powershell
pip install -r requirements.txt
```

4. **Set up environment variables**
```powershell
cp .env.example .env
# Edit .env with your configuration
```

5. **Run migrations**
```powershell
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```powershell
python manage.py createsuperuser
```

7. **Start development server**
```powershell
python manage.py runserver
```

API will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```powershell
cd frontend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Create environment file**
```powershell
# Create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Start development server**
```powershell
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Optional: Start Background Tasks (Celery)

1. **Start Redis**
```powershell
redis-server
```

2. **Start Celery Worker** (new terminal)
```powershell
cd backend
celery -A backend worker -l info
```

3. **Start Celery Beat** (new terminal)
```powershell
cd backend
celery -A backend beat -l info
```

## 👥 User Roles & Permissions

### Admin
- ✅ Full access to company data
- ✅ Manage users and company settings
- ✅ Create projects and assign teams
- ✅ View all progress reports and analytics
- ✅ Manage subscription and billing

### Manager
- ✅ View and manage team members
- ✅ Create projects and assign tasks
- ✅ View team progress dashboards
- ✅ Receive blocked task notifications
- ✅ Comment on progress updates
- ✅ Get weekly team summaries

### Employee
- ✅ View assigned tasks
- ✅ Submit progress updates
- ✅ View task history and timeline
- ✅ Upload files and add links
- ✅ Report blockers
- ✅ Receive daily reminders

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Get current user
- `PUT /api/auth/profile/` - Update profile

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project details
- `GET /api/projects/{id}/tasks/` - Get project tasks

### Tasks
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/my_tasks/` - Get my tasks
- `GET /api/tasks/overdue/` - Get overdue tasks
- `GET /api/tasks/blocked/` - Get blocked tasks

### Progress
- `POST /api/progress/updates/` - Submit progress update
- `GET /api/progress/dashboard/` - Get user dashboard
- `GET /api/progress/team-summary/` - Get team summary (managers)

Full API documentation: `http://localhost:8000/api/docs/`

## 📧 Automated Notifications

The system sends automatic notifications for:

- **Daily Progress Reminders** (9 AM) - Reminds employees to update progress
- **Weekly Team Summary** (Monday 8 AM) - Sends managers a team progress report
- **Task Assignments** - Notifies when tasks are assigned
- **Blocker Alerts** - Immediately alerts managers when tasks are blocked
- **Overdue Tasks** (10 AM) - Alerts for overdue tasks
- **Deadline Reminders** - Notifies 2 days before deadlines

## 🎯 Core Features Explained

### Progress Updates
Employees submit simple progress updates including:
- **Progress Percentage** (0-100%)
- **Status** (On Track / At Risk / Blocked / Waiting / Completed)
- **Work Done** - Description of completed work
- **Next Steps** - Planned upcoming work
- **Blockers** - Any obstacles (required if status is "Blocked")
- **Hours Worked** - Time tracking
- **Links** - References to PRs, docs, etc.

### Task Statuses
- **Open** - Task created, not started
- **In Progress** - Currently being worked on
- **Blocked** - Waiting on dependencies or facing issues
- **In Review** - Work completed, awaiting review
- **Completed** - Task finished
- **Cancelled** - Task no longer needed

### Project Organization
- Group related tasks into projects
- Assign teams to projects
- Track overall project progress
- View project-level analytics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF tokens
- Secure password hashing

## 📊 Analytics & Reporting

### Employee Dashboard
- Task statistics (total, completed, in progress, blocked)
- Recent progress updates
- Overdue tasks alerts
- Time tracking summaries

### Manager Dashboard
- Team member progress overview
- Blocked tasks requiring attention
- Overdue task tracking
- Team productivity metrics
- Progress update frequency

## 🛠️ Development

### Running Tests

**Backend:**
```powershell
cd backend
python manage.py test
```

**Frontend:**
```powershell
cd frontend
npm test
```

### Code Quality

**Backend:**
- Follows PEP 8 style guide
- Docstrings for all functions/classes
- Type hints where applicable

**Frontend:**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting

## 🚢 Deployment

### Backend (Django)
- Deploy to: Railway, Render, AWS, or Heroku
- Set DEBUG=False
- Configure PostgreSQL
- Set up Redis for Celery
- Configure email settings (SMTP)
- Set proper SECRET_KEY

### Frontend (Next.js)
- Deploy to: Vercel, Netlify, or AWS Amplify
- Set NEXT_PUBLIC_API_URL to production API
- Configure environment variables

## 📝 Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
FRONTEND_URL=https://yourapp.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourapp.com/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@progresstracker.com
- Documentation: `/docs`

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Google Calendar integration
- [ ] Slack/Teams notifications
- [ ] Custom reports builder
- [ ] Gantt chart view
- [ ] AI-powered progress insights
- [ ] Client portal (view-only access)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Export to PDF/CSV

## 🙏 Acknowledgments

Built with:
- Django REST Framework
- Next.js
- TailwindCSS
- Shadcn/ui
- React Query
- Celery

---

**Progress Tracker** - Built with ❤️ for transparent, trust-based team collaboration

Version: 1.0.0 | Last Updated: December 26, 2025
