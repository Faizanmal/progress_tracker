# 🚀 Quick Start Guide - Progress Tracker

## Step-by-Step Setup Instructions

### 1️⃣ Backend Setup (5-10 minutes)

```powershell
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Create a superuser (admin account)
python manage.py createsuperuser
# Enter email: admin@example.com
# Enter name: Admin User
# Enter password: (your secure password)

# Start the Django server
python manage.py runserver
```

✅ Backend should now be running at `http://localhost:8000`
✅ API Documentation available at `http://localhost:8000/api/docs/`
✅ Admin panel at `http://localhost:8000/admin/`

### 2️⃣ Frontend Setup (3-5 minutes)

Open a NEW terminal window:

```powershell
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Start the development server
npm run dev
```

✅ Frontend should now be running at `http://localhost:3000`

### 3️⃣ First Login

1. Open your browser to `http://localhost:3000`
2. Click "Login"
3. Use the superuser credentials you created
4. You're in! 🎉

### 4️⃣ Create Your First Project & Task

**As Admin/Manager:**

1. Go to "Projects" → "New Project"
2. Fill in:
   - Title: "Q4 Website Redesign"
   - Description: "Redesign company website"
   - Priority: High
   - Team Members: (select yourself)

3. Create a Task:
   - Go to "Tasks" → "New Task"
   - Title: "Design homepage mockup"
   - Project: "Q4 Website Redesign"
   - Assign To: (yourself)
   - Deadline: (tomorrow)
   - Priority: High

4. Submit Progress Update:
   - Go to your task
   - Click "Update Progress"
   - Progress: 50%
   - Status: "In Progress"
   - Work Done: "Created initial wireframes"
   - Hours Worked: 2

✅ You've now created your first project, task, and progress update!

## 🔧 Optional: Background Tasks (Celery)

For email notifications and automated reminders:

### Prerequisites
- Install Redis: `https://redis.io/download`

### Setup

**Terminal 3 - Redis:**
```powershell
redis-server
```

**Terminal 4 - Celery Worker:**
```powershell
cd backend
celery -A backend worker -l info
```

**Terminal 5 - Celery Beat (Scheduler):**
```powershell
cd backend
celery -A backend beat -l info
```

✅ Now you'll receive automated emails and notifications!

## 📧 Email Configuration

To receive actual emails (not just console output):

Edit `backend/.env`:
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@progresstracker.com
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in EMAIL_HOST_PASSWORD

## 👥 Testing with Multiple Users

### Create Additional Users

1. Go to Django Admin: `http://localhost:8000/admin/`
2. Click "Users" → "Add User"
3. Create users with different roles:
   - **Manager**: Can view team progress
   - **Employee**: Can submit progress updates

OR use the API:

```powershell
# Using curl or Postman
POST http://localhost:8000/api/auth/register/
{
  "email": "employee@example.com",
  "name": "John Employee",
  "password": "securepass123",
  "password2": "securepass123",
  "role": "employee"
}
```

### Assign Manager-Employee Relationship

1. In Django Admin, edit the Employee user
2. Set "Manager" field to your Manager user
3. Save

Now the manager can see the employee's progress!

## 🎯 Key URLs to Remember

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://localhost:8000/api | REST API |
| API Docs | http://localhost:8000/api/docs/ | Swagger UI |
| Admin Panel | http://localhost:8000/admin/ | Django admin |

## ✅ Verification Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can login with superuser credentials
- [ ] Can create a project
- [ ] Can create a task
- [ ] Can submit a progress update
- [ ] API docs accessible
- [ ] Django admin accessible

## 🆘 Common Issues & Solutions

### Issue: "Module not found" error

**Solution:**
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Issue: Database errors

**Solution:**
```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Issue: CORS errors in browser

**Solution:**
Check `backend/.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Issue: Can't connect to backend from frontend

**Solution:**
Check `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Issue: Redis connection error

**Solution:**
```powershell
# Make sure Redis is running
redis-server

# Or skip Celery setup - app works without it
# (just no background tasks/emails)
```

## 🎉 Next Steps

1. **Explore the Dashboard**
   - View your tasks
   - Check progress timeline
   - Review notifications

2. **Create a Team**
   - Add more users (employees)
   - Assign them as your team members
   - Create projects and assign tasks

3. **Test Workflows**
   - Employee submits progress
   - Manager views team dashboard
   - Test blocker notifications
   - Try different task statuses

4. **Customize**
   - Update company info in admin
   - Add company logo
   - Configure email templates
   - Adjust notification schedules

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Backend API Docs**: `backend/README.md`
- **API Reference**: `http://localhost:8000/api/docs/`
- **GitHub Issues**: For bugs and features

## 💡 Pro Tips

1. **Use Chrome DevTools** to inspect API calls
2. **Check Terminal logs** for debugging
3. **Use Django Admin** for quick data management
4. **Test with multiple browser tabs** (different users)
5. **Enable Celery** to test email notifications

---

**Need Help?** Create an issue on GitHub or check the documentation!

Happy tracking! 🚀
