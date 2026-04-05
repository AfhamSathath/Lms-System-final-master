# Dashboard Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Finance and Exam Officer dashboards into the LMS system.

## Table of Contents

1. [Frontend Integration](#frontend-integration)
2. [Backend Integration](#backend-integration)
3. [Testing](#testing)
4. [Deployment](#deployment)

---

## Frontend Integration

### 1. Add Dashboard Routes

Update your main routing file (e.g., `src/App.jsx` or your router configuration):

```jsx
import FinanceDashboard from './pages/finance/FinanceDashboard';
import ExamOfficerDashboard from './pages/examofficer/ExamOfficerDashboard';

// Add to your route configuration
const dashboardRoutes = [
  {
    path: '/dashboard/finance',
    element: <FinanceDashboard />,
    requiredRole: 'bursar'
  },
  {
    path: '/dashboard/exam-officer',
    element: <ExamOfficerDashboard />,
    requiredRole: 'exam_officer'
  }
];
```

### 2. Add Navigation Links

Update your navigation menu to include dashboard links:

```jsx
// In your layout or navigation component
import { DollarSign, Calendar } from 'lucide-react';

const navItems = [
  {
    label: 'Finance Dashboard',
    path: '/dashboard/finance',
    icon: <DollarSign size={20} />,
    roles: ['bursar', 'admin'],
    section: 'Repeat Subject Management'
  },
  {
    label: 'Exam Officer Dashboard',
    path: '/dashboard/exam-officer',
    icon: <Calendar size={20} />,
    roles: ['exam_officer', 'admin'],
    section: 'Repeat Subject Management'
  }
];
```

### 3. Environment Configuration

Ensure your `.env.local` file includes:

```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

### 4. Add Required Dependencies

If not already installed, add these to your `frontend/package.json`:

```bash
npm install axios recharts lucide-react
```

---

## Backend Integration

### 1. Verify Database Models

Ensure the following models are properly set up:

- **RepeatSubjectRegistration.js** - Main model (should have all required fields)
- **User.js** - For user roles (should include 'bursar', 'exam_officer')
- **Course.js** - For subject information

### 2. Verify Middleware

Check that authentication middleware is properly configured in `middleware/auth.js`:

```javascript
// Should support these roles
const authorizeRoles = ['bursar', 'exam_officer', 'registrar', 'hod', 'student', 'admin'];
```

### 3. Start Backend Server

```bash
cd backend
npm install
npm start
```

Expected output:
```
✓ Database connected
✓ Server running on port 3000
✓ Dashboard routes mounted at /api/dashboard
```

### 4. Verify Routes are Mounted

Check in `server.js`:

```javascript
const dashboardRoutes = require('./routes/dashboardRoutes');
// ...
app.use('/api/dashboard', dashboardRoutes);
```

---

## Testing

### 1. Test Finance Dashboard Endpoints

#### Get Dashboard Overview
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "overview": {
    "totalExpected": 500000,
    "totalReceived": 350000,
    "pendingAmount": 150000,
    "overdue": 50000
  },
  "pendingPayments": [...],
  "confirmedPayments": [...]
}
```

#### Get Pending Payments
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Payment History
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/history?startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Export Report
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o finance_report.csv
```

### 2. Test Exam Officer Dashboard Endpoints

#### Get Dashboard Overview
```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "readyToSchedule": [...],
  "scheduledExams": [...],
  "statistics": {
    "totalExams": 200,
    "scheduled": 150,
    "pending": 50,
    "venues": 7
  }
}
```

#### Get Exam Timetable
```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer/timetable?startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Statistics
```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Mark Exam Completed
```bash
curl -X PUT "http://localhost:3000/api/dashboard/exam/REGISTRATION_ID/completed" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Frontend Testing

1. **Authentication Test:**
   - Login as Bursar → Should see Finance Dashboard
   - Login as Exam Officer → Should see Exam Officer Dashboard
   - Login as Student → Should NOT see dashboards

2. **Data Loading Test:**
   - Navigate to Finance Dashboard → Should load payment data
   - Check Overview metrics → Should match backend values
   - Try filters → Should update data correctly

3. **Actions Test:**
   - Finance: Try confirming a payment
   - Exam Officer: Try scheduling an exam
   - Verify workflow updates

4. **Responsive Design Test:**
   - Test on desktop, tablet, mobile
   - All charts should display properly

---

## Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Problem:** Getting 401 error when accessing dashboard
**Solution:**
1. Verify token is stored in localStorage
2. Check token hasn't expired
3. Verify user role is 'bursar' or 'exam_officer'
4. Check Authorization header format: `Bearer <token>`

### Issue 2: CORS Errors
**Problem:** Getting CORS errors from frontend to backend
**Solution:**
1. Check CORS is enabled in `server.js`
2. Verify FRONTEND_URL in environment variables
3. Clear browser cache and try again

### Issue 3: Empty Dashboard Data
**Problem:** Dashboard loads but shows no data
**Solution:**
1. Check if repeat registrations exist in MongoDB
2. Verify registrations have status 'ACCEPTED'
3. Check filters aren't too restrictive
4. Review console logs for API errors

### Issue 4: Payment Confirmation Not Working
**Problem:** Payment confirmation button doesn't update
**Solution:**
1. Verify user has 'bursar' role
2. Check registration has 'PENDING' fee status
3. Verify payment reference and proof are provided
4. Check database index: `{student, subject, academicYear, semester}`

---

## Performance Optimization

### For Large Datasets

1. **Implement Pagination:**
```javascript
// In dashboard controller
const page = req.query.page || 1;
const limit = 20;
const skip = (page - 1) * limit;

const registrations = await RepeatSubjectRegistration
  .find(query)
  .skip(skip)
  .limit(limit);
```

2. **Add Caching:**
```javascript
// Frontend - React Query
import { useQuery } from '@tanstack/react-query';

const { data: dashboardData } = useQuery({
  queryKey: ['finance-dashboard'],
  queryFn: () => fetchDashboardData(),
  staleTime: 60000, // 1 minute
  cacheTime: 300000 // 5 minutes
});
```

3. **Optimize Database Queries:**
```javascript
// Use projection to fetch only needed fields
RepeatSubjectRegistration.find(query)
  .select('studentName studentIndex subjectCode feeStatus paymentReference')
  .lean() // Returns plain JS objects instead of Mongoose documents
```

---

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database backups created
- [ ] API endpoints tested in production
- [ ] Frontend dashboard pages tested
- [ ] Authentication and authorization verified
- [ ] CORS configuration correct
- [ ] Error logging configured
- [ ] Rate limiting configured
- [ ] SSL certificates valid (if HTTPS)
- [ ] Database indexes created
- [ ] User roles properly assigned
- [ ] Email notifications working
- [ ] File upload paths configured

---

## Monitoring & Support

### Enable Debug Logging

In `dashboardController.js`, add:
```javascript
console.log(`[${new Date().toISOString()}] Finance dashboard accessed by user:`, req.user.id);
```

### Monitor Key Metrics

- Dashboard response times (target: < 500ms)
- Failed authentication attempts
- Payment confirmation errors
- Exam scheduling failures

### Regular Maintenance

- Weekly: Check error logs
- Monthly: Review and optimize slow queries
- Quarterly: Audit access logs and permissions

---

## Next Steps

1. **Real-time Updates:** Implement WebSocket for live dashboard updates
2. **Advanced Analytics:** Add date range comparisons and trend analysis
3. **Bulk Operations:** Allow bulk payment verification or exam scheduling
4. **Email Notifications:** Send alerts to Finance/Exam Officers for pending items
5. **Audit Trail:** Enhanced logging for all dashboard actions
6. **Mobile App:** Create mobile-friendly version of dashboards

---

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Review error messages in browser console
3. Verify all prerequisites are installed
4. Contact development team with error details
