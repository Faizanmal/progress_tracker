# Progress Tracker - Backend API

## 📋 Overview

Progress Tracker is a modern, trust-based Employee Progress Tracking System built with Django REST Framework. It helps teams stay aligned through transparent, self-reported progress updates.

## 🏗️ Architecture

### Technology Stack
- **Framework**: Django 5.2.7 + Django REST Framework
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT (Simple JWT)
- **Task Queue**: Celery + Redis
- **API Documentation**: Swagger/ReDoc (drf-yasg)

### Project Structure
```
backend/
├── backend/              # Main project settings
│   ├── settings.py       # Django configuration
│   ├── urls.py          # URL routing
│   ├── celery.py        # Celery configuration
│   └── wsgi.py          # WSGI application
├── users/               # User management & authentication
│   ├── models.py        # User, Company, Notification models
│   ├── views.py         # Auth & user endpoints
│   ├── serializers.py   # User data serialization
│   ├── permissions.py   # Role-based permissions
│   ├── tasks.py         # Email & reminder tasks
│   └── urls.py          # User-related routes
├── projects/            # Project management
│   ├── models.py        # Project, ProjectComment models
│   ├── views.py         # Project CRUD endpoints
│   ├── serializers.py   # Project serialization
│   └── urls.py          # Project routes
├── tasks/               # Task management
│   ├── models.py        # Task, TaskAttachment, TaskComment
│   ├── views.py         # Task CRUD & filtering
│   ├── serializers.py   # Task serialization
│   ├── tasks.py         # Deadline & blocker notifications
│   └── urls.py          # Task routes
├── progress/            # Progress tracking
│   ├── models.py        # ProgressUpdate, ProgressAttachment
│   ├── views.py         # Progress endpoints & dashboards
│   ├── serializers.py   # Progress serialization
│   ├── tasks.py         # Weekly summary emails
│   └── urls.py          # Progress routes
├── analytics/           # Analytics and reporting
│   ├── models.py        # Analytics models
│   ├── views.py         # Analytics endpoints
│   ├── serializers.py   # Analytics serialization
│   └── urls.py          # Analytics routes
├── ai_insights/         # AI-powered insights
│   ├── models.py        # AI insights models
│   ├── views.py         # AI insights endpoints
│   ├── serializers.py   # AI insights serialization
│   ├── services.py      # AI processing services
│   └── urls.py          # AI insights routes
├── manage.py            # Django management script
└── requirements.txt     # Python dependencies
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Redis (for Celery)
- PostgreSQL (for production)

### Installation

1. **Clone the repository and navigate to backend**
```powershell
cd backend
```

2. **Create and activate virtual environment**
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

6. **Create a superuser**
```powershell
python manage.py createsuperuser
```

7. **Run development server**
```powershell
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Running Celery (Optional - for background tasks)

```powershell
# Start Redis first
redis-server

# In a new terminal, start Celery worker
celery -A backend worker -l info

# In another terminal, start Celery beat (for scheduled tasks)
celery -A backend beat -l info
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/token/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user
- `PUT /api/auth/profile/` - Update user profile

### Users
- `GET /api/users/` - List users (filtered by role)
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `GET /api/users/team_members/` - Get team members (managers)
- `GET /api/users/employees/` - List all employees

### Companies
- `GET /api/companies/` - Get company details
- `PUT /api/companies/{id}/` - Update company settings

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project
- `GET /api/projects/{id}/tasks/` - Get project tasks
- `POST /api/projects/{id}/add_member/` - Add team member
- `POST /api/projects/{id}/add_comment/` - Add comment

### Tasks
- `GET /api/tasks/` - List tasks (with filters)
- `POST /api/tasks/` - Create task
- `GET /api/tasks/{id}/` - Get task details
- `PUT /api/tasks/{id}/` - Update task
- `GET /api/tasks/my_tasks/` - Get current user's tasks
- `GET /api/tasks/overdue/` - Get overdue tasks
- `GET /api/tasks/blocked/` - Get blocked tasks
- `GET /api/tasks/{id}/progress_history/` - Get progress history
- `POST /api/tasks/{id}/add_comment/` - Add comment
- `POST /api/tasks/{id}/upload_attachment/` - Upload attachment

### Progress Updates
- `GET /api/progress/updates/` - List progress updates
- `POST /api/progress/updates/` - Create progress update
- `GET /api/progress/updates/{id}/` - Get update details
- `GET /api/progress/updates/my_updates/` - Get user's updates
- `GET /api/progress/updates/recent/` - Get recent updates
- `GET /api/progress/updates/blocked_updates/` - Get blocked updates
- `POST /api/progress/updates/{id}/add_comment/` - Add comment
- `GET /api/progress/dashboard/` - Get user dashboard data
- `GET /api/progress/team-summary/` - Get team progress summary

### Notifications
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread/` - Get unread notifications
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read

## 🔒 Role-Based Access Control

### Admin
- Full access to all company data
- Manage users, projects, and company settings
- View all team progress and reports

### Manager
- View and manage assigned team members
- Create projects and assign tasks
- View team progress reports
- Comment on progress updates

### Employee
- View assigned tasks and projects
- Submit progress updates
- View own task history
- Update own profile

## 📧 Email Notifications

The system sends automated emails for:
- **Daily Reminders**: Remind employees to update progress (9 AM)
- **Weekly Summary**: Send progress summary to managers (Monday 8 AM)
- **Task Assignment**: Notify when tasks are assigned
- **Blocker Alerts**: Notify managers when tasks are blocked
- **Overdue Tasks**: Alert for overdue tasks (10 AM daily)

## 🛠️ Database Models

### User
- Email-based authentication
- Roles: admin, manager, employee
- Company association
- Manager-employee relationships

### Company
- Organization settings
- Subscription management
- User limits and OAuth settings

### Project
- Task organization
- Team member assignment
- Progress tracking
- Status and priority management

### Task
- Individual work items
- Assignment and tracking
- Deadlines and estimates
- Tags and attachments

### ProgressUpdate
- Self-reported progress
- Status tracking (on_track, blocked, etc.)
- Work descriptions and blockers
- Time logging

## 🧪 Testing

```powershell
# Run tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## 📦 Deployment

### Production Settings
1. Set `DEBUG=False` in environment
2. Configure PostgreSQL database
3. Set up proper `SECRET_KEY`
4. Configure email settings (SMTP)
5. Set up Redis for Celery
6. Configure CORS origins
7. Set up static/media file serving

### Environment Variables
See `.env.example` for all required variables.

## 🔧 Maintenance

### Create Migrations
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Collect Static Files
```powershell
python manage.py collectstatic
```

### Create Backup
```powershell
python manage.py dumpdata > backup.json
```

## 📝 API Best Practices

1. **Authentication**: All endpoints (except login/register) require JWT token in header:
   ```
   Authorization: Bearer <access_token>
   ```

2. **Filtering**: Use query parameters for filtering:
   ```
   GET /api/tasks/?status=in_progress&priority=high
   ```

3. **Pagination**: Lists are paginated (20 items per page):
   ```
   GET /api/tasks/?page=2
   ```

4. **Error Handling**: API returns standard HTTP status codes with error messages

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Write docstrings for all functions/classes
3. Add tests for new features
4. Update API documentation

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@progresstracker.com

---

Built with ❤️ using Django REST Framework
