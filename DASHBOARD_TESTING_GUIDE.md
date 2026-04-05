# Dashboard Testing & Verification Guide

## Pre-Testing Setup

### 1. Environment Prerequisites
```bash
# Backend requirements
- Node.js v14+
- MongoDB running
- npm packages installed

# Frontend requirements
- Node.js v14+
- npm packages installed
- React dev server running on port 5173
```

### 2. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Expected: Server running on port 3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Expected: Vite dev server running on http://localhost:5173
```

---

## Authentication Setup

### Create Test Users

```javascript
// Using MongoDB CLI or script

// Bursar User
db.users.insertOne({
  name: "Finance Officer",
  email: "bursar@university.edu",
  password: "hashed_password_here",
  role: "bursar",
  department: "Finance",
  status: "active"
});

// Exam Officer User
db.users.insertOne({
  name: "Exam Officer",
  email: "exam@university.edu",
  password: "hashed_password_here",
  role: "exam_officer",
  department: "Examination Branch",
  status: "active"
});

// Admin User (optional)
db.users.insertOne({
  name: "System Admin",
  email: "admin@university.edu",
  password: "hashed_password_here",
  role: "admin",
  status: "active"
});
```

### Get Authentication Token

```bash
# Login endpoint
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bursar@university.edu",
    "password": "password123"
  }'

# Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Save token for testing
BURSAR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Finance Dashboard Testing

### Test 1: Dashboard Overview ✓

**Endpoint:** `GET /api/dashboard/finance`

```bash
curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer $BURSAR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "overview": {
    "totalExpected": "NUMBER",
    "totalReceived": "NUMBER",
    "pendingAmount": "NUMBER",
    "overdue": "NUMBER"
  },
  "pendingPayments": [
    {
      "_id": "ObjectId",
      "studentName": "STRING",
      "studentIndex": "STRING",
      "subjectCode": "STRING",
      "subjectName": "STRING",
      "amount": "NUMBER",
      "dueDate": "TIMESTAMP",
      "feeStatus": "PENDING"
    }
  ],
  "confirmedPayments": [
    {
      "_id": "ObjectId",
      "studentName": "STRING",
      "paymentReference": "STRING",
      "feeStatus": "PAID"
    }
  ]
}
```

**Verification Checklist:**
- [ ] Response status is 200
- [ ] `overview.totalExpected` > 0
- [ ] `overview.totalReceived` > 0
- [ ] `overview.pendingAmount` > 0
- [ ] After successful response length is > 0
- [ ] Each pending payment has all required fields
- [ ] Each confirmed payment has payment reference

### Test 2: Pending Payments List

```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/pending" \
  -H "Authorization: Bearer $BURSAR_TOKEN"
```

**Expected:** Array of registrations with `feeStatus: "PENDING"`

**Verification Checklist:**
- [ ] Response contains payments array
- [ ] Array count matches expected
- [ ] Each payment has: studentName, amount, dueDate
- [ ] Due dates are properly formatted timestamps

### Test 3: Payment History

```bash
# With date range
curl -X GET "http://localhost:3000/api/dashboard/finance/history?startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer $BURSAR_TOKEN"
```

**Expected:** Array of payments with `feeStatus: "PAID"`

**Verification Checklist:**
- [ ] Returns only confirmed payments
- [ ] Date filtering works correctly
- [ ] Each record has paymentReference
- [ ] Payment dates fall within requested range

### Test 4: Export Finance Report

```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/export" \
  -H "Authorization: Bearer $BURSAR_TOKEN" \
  -o finance_report.csv
```

**Expected:** CSV file download

**Verification Checklist:**
- [ ] File downloads without errors
- [ ] File opens in Excel/CSV viewer
- [ ] Contains headers: Student Name, Student Index, etc.
- [ ] Data rows match database records
- [ ] File can be imported into spreadsheet

### Test 5: Authorization Check

```bash
# Try to access as student (should fail)
STUDENT_TOKEN="..."

curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Expected:** 403 Forbidden

**Verification Checklist:**
- [ ] Response status is 403
- [ ] Message indicates permission denied
- [ ] Student cannot access finance endpoints

---

## Exam Officer Dashboard Testing

### Test 6: Exam Officer Dashboard Overview

```bash
EXAM_OFFICER_TOKEN="..."

curl -X GET "http://localhost:3000/api/dashboard/exam-officer" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN"
```

**Expected Response Structure:**
```json
{
  "success": true,
  "readyToSchedule": [
    {
      "_id": "ObjectId",
      "studentName": "STRING",
      "studentIndex": "STRING",
      "subjectCode": "STRING",
      "department": "STRING",
      "credits": "NUMBER"
    }
  ],
  "scheduledExams": [
    {
      "_id": "ObjectId",
      "studentName": "STRING",
      "allocatedExamSlot": {
        "date": "TIMESTAMP",
        "time": "TIME",
        "venue": "STRING",
        "examCode": "STRING"
      }
    }
  ],
  "statistics": {
    "totalExams": "NUMBER",
    "scheduled": "NUMBER",
    "pending": "NUMBER",
    "venues": "NUMBER"
  }
}
```

**Verification Checklist:**
- [ ] Response status is 200
- [ ] `statistics.totalExams` > 0
- [ ] `statistics.pending` = totalExams - scheduled
- [ ] readyToSchedule array contains paid students
- [ ] scheduledExams includes exam slot details

### Test 7: Exam Timetable

```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer/timetable?startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN"
```

**Expected:** Timetable grouped by date

**Verification Checklist:**
- [ ] Response has timetable object with date keys
- [ ] Each date contains exam records
- [ ] Each exam has: time, venue, subject, student
- [ ] Dates are properly formatted (YYYY-MM-DD)

### Test 8: Exam Statistics

```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer/statistics" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN"
```

**Expected:** Detailed statistics breakdown

**Verification Checklist:**
- [ ] Response includes department breakdown
- [ ] Response includes subject breakdown
- [ ] Time distribution shows morning/afternoon split
- [ ] All counts are accurate

### Test 9: Admission Letters

```bash
curl -X GET "http://localhost:3000/api/dashboard/exam-officer/admission-letters" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN"
```

**Expected:** Admission letter data

**Verification Checklist:**
- [ ] Response has letters array
- [ ] Each letter has: studentName, subject, examDate, venue, examCode
- [ ] Exam dates match scheduled exams
- [ ] All required fields present

### Test 10: Mark Exam Completed

```bash
# Replace with actual registration ID
REGISTRATION_ID="507f1f77bcf86cd799439021"

curl -X PUT "http://localhost:3000/api/dashboard/exam/$REGISTRATION_ID/completed" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Exam marked as completed",
  "registration": {
    "examScheduleStatus": "COMPLETED",
    "workflowHistory": [
      {
        "stage": "EXAM_COMPLETED",
        "status": "COMPLETED",
        "comments": "Exam completed successfully"
      }
    ]
  }
}
```

**Verification Checklist:**
- [ ] Response status is 200
- [ ] `examScheduleStatus` changed to "COMPLETED"
- [ ] Workflow history includes new entry
- [ ] Timestamp is current

---

## Frontend UI Testing

### Finance Dashboard - Visual Testing

1. **Navigate to Dashboard**
   - [ ] URL accessible at `/dashboard/finance`
   - [ ] Page loads without console errors
   - [ ] All components render

2. **Overview Tab**
   - [ ] 4 metric cards display (Expected, Received, Pending, Overdue)
   - [ ] Bar chart shows payment status breakdown
   - [ ] Pie chart shows payment distribution
   - [ ] Charts are responsive

3. **Pending Payments Tab**
   - [ ] Table displays all pending payments
   - [ ] Search filter works
   - [ ] Status indicators show correctly
   - [ ] "Verify Payment" button appears
   - [ ] Overdue items highlighted in red

4. **Payment History Tab**
   - [ ] Table shows confirmed payments
   - [ ] Date column populated
   - [ ] Payment reference visible
   - [ ] Pagination works (if implemented)

5. **Modal Interactions**
   - [ ] Click "Verify Payment" opens modal
   - [ ] Can enter payment reference
   - [ ] Can upload proof file
   - [ ] Submit button works
   - [ ] Modal closes on success
   - [ ] Table updates after confirmation

### Exam Officer Dashboard - Visual Testing

1. **Navigate to Dashboard**
   - [ ] URL accessible at `/dashboard/exam-officer`
   - [ ] Page loads without console errors
   - [ ] All components render

2. **Ready to Schedule Tab**
   - [ ] Shows unpaid students
   - [ ] Filter by department works
   - [ ] "Schedule" button appears for each row
   - [ ] Table is sortable

3. **Scheduled Exams Tab**
   - [ ] Exams grouped by date
   - [ ] Each card shows: subject, student, time, venue
   - [ ] "Download Admit Letter" button works
   - [ ] "Mark Completed" button works

4. **Statistics Tab**
   - [ ] 4 metric cards display
   - [ ] Venue availability shown
   - [ ] Time slot distribution visible
   - [ ] All counts accurate

5. **Schedule Modal**
   - [ ] Opens when "Schedule" clicked
   - [ ] Date picker works
   - [ ] Time input accepts valid format
   - [ ] Venue dropdown shows all options
   - [ ] Submit creates new exam slot
   - [ ] Modal closes on success
   - [ ] Exam appears in scheduled list

---

## Error Handling Tests

### Test 11: Missing Authentication

```bash
curl -X GET "http://localhost:3000/api/dashboard/finance"
```

**Expected:** 401 Unauthorized

**Verification Checklist:**
- [ ] Status code is 401
- [ ] Message indicates missing token
- [ ] No data exposed

### Test 12: Invalid Token

```bash
curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected:** 401 Unauthorized

**Verification Checklist:**
- [ ] Status code is 401
- [ ] Error indicates invalid token

### Test 13: Insufficient Permissions

```bash
# Student token trying to access finance
curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Expected:** 403 Forbidden

**Verification Checklist:**
- [ ] Status code is 403
- [ ] Message indicates permission denied

### Test 14: Non-existent Resource

```bash
curl -X GET "http://localhost:3000/api/dashboard/exam/invalid_id/completed" \
  -H "Authorization: Bearer $EXAM_OFFICER_TOKEN" \
  -X PUT
```

**Expected:** 404 Not Found or validation error

---

## Performance Tests

### Test 15: Response Time

```bash
# Measure response time
time curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer $BURSAR_TOKEN"
```

**Expected:** < 500ms

**Verification Checklist:**
- [ ] Average response time under 500ms
- [ ] Consistent performance across requests
- [ ] No slow queries in database logs

### Test 16: Load Test (Optional)

```bash
# Using Apache Bench
ab -n 100 -c 10 \
  -H "Authorization: Bearer $BURSAR_TOKEN" \
  http://localhost:3000/api/dashboard/finance
```

**Expected:** 
- [ ] All requests succeed
- [ ] < 5% failed requests
- [ ] Average response time consistent

---

## Database Validation

### Verify Data Integrity

```javascript
// MongoDB queries to verify data

// Check registrations exist
db.repeatsubjectregistrations.countDocuments()

// Check fee statuses
db.repeatsubjectregistrations.aggregate([
  { $group: { _id: "$feeStatus", count: { $sum: 1 } } }
])

// Check exam schedules
db.repeatsubjectregistrations.countDocuments({ examScheduleStatus: "SCHEDULED" })

// Check workflow history
db.repeatsubjectregistrations.findOne({ workflowHistory: { $exists: true } })
```

---

## Integration Testing Checklist

- [ ] Student registers for repeat subject
- [ ] Registration moves to HOD review
- [ ] HOD approves registration
- [ ] Registrar approves registration
- [ ] Fee invoice created (2500 LKR)
- [ ] Finance Dashboard shows pending payment
- [ ] Bursar marks payment confirmed
- [ ] Finance Dashboard updates
- [ ] Exam ready to schedule
- [ ] Exam Officer schedules exam
- [ ] Exam appears in scheduled list
- [ ] Exam Officer marks completed
- [ ] Status changes to COMPLETED

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on dashboard routes | Verify dashboardRoutes mounted in server.js |
| 401 on all requests | Check token not expired, format correct |
| 403 on Bursar endpoints | Verify user has "bursar" role in database |
| Empty dashboard | Check test data exists, no restrictive filters |
| Slow response times | Check database indexes, query optimization |
| CORS errors | Verify CORS config, frontend URL correct |
| Modal not working | Check browser console for JS errors |
| Charts not displaying | Verify data structure matches Recharts format |

---

## Test Report Template

```
TEST EXECUTION REPORT
Date: ___________
Tester: ___________
Environment: Development/Staging/Production

[PASSED/FAILED] Finance Dashboard Overview
[PASSED/FAILED] Finance Dashboard Pending Payments
[PASSED/FAILED] Finance Dashboard History
[PASSED/FAILED] Finance Dashboard Export
[PASSED/FAILED] Exam Officer Dashboard Overview
[PASSED/FAILED] Exam Officer Dashboard Timetable
[PASSED/FAILED] Exam Officer Statistics
[PASSED/FAILED] Admission Letter Generation
[PASSED/FAILED] Mark Exam Completed
[PASSED/FAILED] Authorization Controls
[PASSED/FAILED] Error Handling
[PASSED/FAILED] Performance Targets

Issues Found:
1. ...
2. ...

Sign-off: ___________
```

---

## Next Steps

After successful testing:
1. [ ] Deploy to staging environment
2. [ ] Run full integration tests
3. [ ] User acceptance testing (UAT)
4. [ ] Deploy to production
5. [ ] Monitor performance metrics
6. [ ] Gather user feedback
7. [ ] Plan Phase 4 enhancements
