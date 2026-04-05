# Dashboard API Documentation

## Overview

The Dashboard API provides endpoints for Finance Officers (Bursars) and Exam Officers to manage repeat subject registrations, payments, and exam scheduling. All endpoints require authentication and appropriate role-based access control.

## Base URL

```
/api/dashboard
```

## Authentication

All endpoints require:
- Bearer token in Authorization header: `Authorization: Bearer <token>`
- Appropriate role (bursar, exam_officer, or admin)

---

## Finance Dashboard Endpoints

### 1. Get Finance Dashboard Overview

**Endpoint:** `GET /api/dashboard/finance`

**Authentication:** Private - Bursar/Admin

**Description:** Retrieves overview metrics, pending payments, and confirmed payments for the finance dashboard.

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)

**Success Response (200):**
```json
{
  "success": true,
  "overview": {
    "totalExpected": 500000,
    "totalReceived": 350000,
    "pendingAmount": 150000,
    "overdue": 50000
  },
  "pendingPayments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentName": "John Doe",
      "studentIndex": "STU001",
      "subjectCode": "COM201",
      "subjectName": "Web Development",
      "amount": 2500,
      "dueDate": 1712707200000,
      "feeStatus": "PENDING"
    }
  ],
  "confirmedPayments": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "studentName": "Jane Smith",
      "studentIndex": "STU002",
      "subjectCode": "COM202",
      "subjectName": "Database Design",
      "amount": 2500,
      "paymentReference": "PAY-2026-0001",
      "paymentReceivedDate": "2026-04-05T10:30:00Z",
      "feeStatus": "PAID"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

---

### 2. Get Pending Payments

**Endpoint:** `GET /api/dashboard/finance/pending`

**Authentication:** Private - Bursar/Admin

**Description:** Lists all registrations with pending fee payments.

**Success Response (200):**
```json
{
  "success": true,
  "count": 25,
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "studentName": "John Doe",
      "studentIndex": "STU001",
      "studentEmail": "john@example.com",
      "subjectCode": "COM201",
      "subjectName": "Web Development",
      "amount": 2500,
      "dueDate": 1712707200000,
      "approvedDate": "2026-03-25T14:00:00Z"
    }
  ]
}
```

---

### 3. Get Payment History

**Endpoint:** `GET /api/dashboard/finance/history`

**Authentication:** Private - Bursar/Admin

**Description:** Retrieves payment history with optional date filtering.

**Query Parameters:**
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Success Response (200):**
```json
{
  "success": true,
  "count": 150,
  "history": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "studentName": "Jane Smith",
      "studentIndex": "STU002",
      "subjectCode": "COM202",
      "subjectName": "Database Design",
      "amount": 2500,
      "paymentReference": "PAY-2026-0001",
      "paymentReceivedDate": "2026-04-05T10:30:00Z",
      "paymentProof": "https://example.com/proof.pdf"
    }
  ]
}
```

---

### 4. Export Finance Report

**Endpoint:** `GET /api/dashboard/finance/export`

**Authentication:** Private - Bursar/Admin

**Description:** Exports finance data as CSV file.

**Success Response:** CSV file download
```
Student Name,Student Index,Subject Code,Amount,Payment Status,Payment Date,Reference
"John Doe","STU001","COM201",2500,"PENDING","","
"Jane Smith","STU002","COM202",2500,"PAID","2026-04-05","PAY-2026-0001"
```

---

## Exam Officer Dashboard Endpoints

### 5. Get Exam Officer Dashboard Overview

**Endpoint:** `GET /api/dashboard/exam-officer`

**Authentication:** Private - Exam Officer/Admin

**Description:** Retrieves exam officer dashboard data including exams ready to schedule, scheduled exams, and statistics.

**Success Response (200):**
```json
{
  "success": true,
  "readyToSchedule": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "studentName": "John Doe",
      "studentIndex": "STU001",
      "subjectCode": "COM201",
      "subjectName": "Web Development",
      "department": "Computer Science",
      "credits": 3
    }
  ],
  "scheduledExams": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "studentName": "Jane Smith",
      "studentIndex": "STU002",
      "subjectCode": "COM202",
      "subjectName": "Database Design",
      "department": "Computer Science",
      "allocatedExamSlot": {
        "date": "2026-05-10T09:00:00Z",
        "time": "09:00",
        "venue": "Exam Hall A - Block 1",
        "examCode": "EXAM-2026-0001"
      },
      "examCode": "EXAM-2026-0001"
    }
  ],
  "statistics": {
    "totalExams": 200,
    "scheduled": 150,
    "pending": 50,
    "venues": 7
  }
}
```

---

### 6. Get Exam Timetable

**Endpoint:** `GET /api/dashboard/exam-officer/timetable`

**Authentication:** Private - Exam Officer/Admin

**Description:** Retrieves exam timetable grouped by date.

**Query Parameters:**
- `startDate` (optional): Filter from date (ISO 8601)
- `endDate` (optional): Filter to date (ISO 8601)

**Success Response (200):**
```json
{
  "success": true,
  "timetable": {
    "2026-05-10": [
      {
        "time": "09:00",
        "venue": "Exam Hall A - Block 1",
        "examCode": "EXAM-2026-0001",
        "subject": {
          "code": "COM201",
          "name": "Web Development",
          "credits": 3
        },
        "student": {
          "name": "Jane Smith",
          "index": "STU002"
        }
      }
    ]
  },
  "totalExams": 500
}
```

---

### 7. Get Exam Statistics

**Endpoint:** `GET /api/dashboard/exam-officer/statistics`

**Authentication:** Private - Exam Officer/Admin

**Description:** Provides comprehensive exam statistics and breakdowns.

**Success Response (200):**
```json
{
  "success": true,
  "statistics": {
    "total": 200,
    "scheduled": 150,
    "pending": 50,
    "completed": 0,
    "byDepartment": {
      "Computer Science": 85,
      "Engineering": 60,
      "Business": 55
    },
    "bySubject": {
      "COM201 - Web Development": 30,
      "COM202 - Database Design": 28,
      "COM301 - AI & ML": 25
    },
    "timeDistribution": {
      "morning": 100,
      "afternoon": 50
    }
  }
}
```

---

### 8. Generate Admission Letters

**Endpoint:** `GET /api/dashboard/exam-officer/admission-letters`

**Authentication:** Private - Exam Officer/Admin

**Description:** Generates admission letter data for scheduled exams.

**Query Parameters:**
- `examDate` (optional): Filter by specific exam date (ISO 8601)

**Success Response (200):**
```json
{
  "success": true,
  "count": 45,
  "letters": [
    {
      "studentName": "Jane Smith",
      "studentIndex": "STU002",
      "subject": {
        "code": "COM202",
        "name": "Database Design"
      },
      "examDate": "2026-05-10T09:00:00Z",
      "examTime": "09:00",
      "venue": "Exam Hall A - Block 1",
      "examCode": "EXAM-2026-0001",
      "academicYear": "2025/2026"
    }
  ]
}
```

---

### 9. Mark Exam as Completed

**Endpoint:** `PUT /api/dashboard/exam/:id/completed`

**Authentication:** Private - Exam Officer/Admin

**Description:** Marks an exam as completed and records in workflow history.

**URL Parameters:**
- `id`: Registration ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Exam marked as completed",
  "registration": {
    "_id": "507f1f77bcf86cd799439021",
    "examScheduleStatus": "COMPLETED",
    "workflowHistory": [
      {
        "stage": "EXAM_COMPLETED",
        "status": "COMPLETED",
        "actedBy": "user_id",
        "comments": "Exam completed successfully",
        "timestamp": "2026-05-10T14:30:00Z"
      }
    ]
  }
}
```

---

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions for this role |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details (development only)"
}
```

---

## Role-Based Access Control

### Finance Dashboard
- **Allowed Roles:** bursar, admin
- **Endpoints:**
  - GET /api/dashboard/finance
  - GET /api/dashboard/finance/pending
  - GET /api/dashboard/finance/history
  - GET /api/dashboard/finance/export

### Exam Officer Dashboard
- **Allowed Roles:** exam_officer, admin
- **Endpoints:**
  - GET /api/dashboard/exam-officer
  - GET /api/dashboard/exam-officer/timetable
  - GET /api/dashboard/exam-officer/statistics
  - GET /api/dashboard/exam-officer/admission-letters
  - PUT /api/dashboard/exam/:id/completed

---

## Rate Limiting

Dashboard endpoints have the following rate limits:
- **Standard:** 60 requests per minute
- **Burst:** 100 requests per minute (for admin users)

---

## Example Usage

### Finance Dashboard Overview
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

### Export Finance Report
```bash
curl -X GET "http://localhost:3000/api/dashboard/finance/export" \
  -H "Authorization: Bearer your_token_here" \
  -o finance_report.csv
```

### Schedule Exam
```bash
curl -X PUT "http://localhost:3000/api/dashboard/exam/507f1f77bcf86cd799439021/completed" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

---

## Integration Notes

1. **Frontend Dashboard Updates:**
   - Finance Dashboard fetches from `/api/dashboard/finance`
   - Exam Officer Dashboard fetches from `/api/dashboard/exam-officer`

2. **Data Refresh:**
   - Recommended refresh interval: 30-60 seconds
   - Upon user action (confirm payment, schedule exam)

3. **Real-time Updates:**
   - Consider implementing WebSocket for real-time notifications
   - Current implementation uses polling

4. **Performance:**
   - Queries are optimized with proper MongoDB indexes
   - Pagination recommended for large datasets
   - Cache results at frontend level when appropriate

---

## Support

For issues or questions regarding the Dashboard API:
- Check logs in `/logs/` directory
- Review error messages in response
- Verify role permissions in user model
