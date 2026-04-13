# Enhanced Attendance Management System

## Overview
The LMS now includes a comprehensive attendance management system that follows a real-world academic workflow with multiple levels of verification and review.

## Workflow Process

### 1. Lecturer Marks Attendance
- Lecturers mark attendance for their classes using the existing `/api/enrollments/:id/attendance` endpoint
- Attendance can be marked as: `present`, `absent`, `late`, or `excused`
- Lecturers can add remarks for each attendance record

### 2. Student Confirmation Phase
- After lecturer marks attendance, students can review and confirm their attendance records
- Students access their attendance via `/api/enrollments/:id/confirm-attendance`
- Students can:
  - Confirm they were present (even if marked absent)
  - Add their own remarks
  - Report discrepancies

### 3. Automatic Discrepancy Detection
- If a student confirms they were present but were marked absent, the system:
  - Creates notifications for both student and HOD
  - Sends email alerts to both parties
  - Flags the record for HOD review

### 4. HOD Review Process
- HODs can review flagged discrepancies via `/api/enrollments/:id/review-attendance`
- HODs can:
  - Update attendance status
  - Add official remarks
  - Make final decisions on disputed records
- Students are notified of HOD decisions via notifications and email

### 5. Administrative Oversight
- Admin and Dean roles have full access to detailed attendance information
- Access via `/api/enrollments/:id/attendance-details`
- View includes:
  - Complete attendance history
  - Student confirmations
  - HOD reviews
  - Statistical summaries
  - Discrepancy tracking

## API Endpoints

### Student Endpoints
```
PUT /api/enrollments/:id/confirm-attendance
- Allows students to confirm their attendance
- Body: { attendanceConfirmations: [{ date, confirmed, studentRemarks }] }
```

### HOD/Admin Endpoints
```
PUT /api/enrollments/:id/review-attendance
- HODs can review and update attendance records
- Body: { attendanceUpdates: [{ date, status, hodRemarks }] }
```

### View Endpoints
```
GET /api/enrollments/:id/attendance-details
- Detailed attendance view for authorized personnel
- Includes statistics, confirmations, and review history
```

## Database Schema Updates

### Enrollment.attendance[] Subdocument
```javascript
{
  date: Date,
  status: String, // 'present', 'absent', 'late', 'excused'
  markedBy: ObjectId, // Lecturer who marked attendance
  markedAt: Date,
  remarks: String, // Lecturer remarks

  // Student confirmation fields
  studentConfirmed: Boolean,
  studentConfirmedAt: Date,
  studentRemarks: String,

  // HOD review fields
  updatedByHOD: ObjectId,
  hodUpdatedAt: Date,
  hodRemarks: String
}
```

## Notification Types
- `ATTENDANCE_DISCREPANCY`: Student reports discrepancy
- `ATTENDANCE_REVIEW`: HOD notified of review needed
- `ATTENDANCE_REVIEWED`: HOD decision communicated to student

## Email Notifications
- Attendance discrepancy alerts to students
- Review requests to HODs
- Review completion notifications to students

## Access Control
- **Students**: Can only confirm their own attendance
- **Lecturers**: Can mark attendance for their courses
- **HODs**: Can review attendance for department students + update records
- **Admins**: Full access to all attendance operations
- **Deans**: Read-only access to detailed attendance information

## Real-World Benefits
1. **Transparency**: Students can verify their attendance records
2. **Accountability**: Multi-level verification prevents errors
3. **Dispute Resolution**: Formal process for attendance disputes
4. **Administrative Oversight**: Complete audit trail for compliance
5. **Automated Notifications**: Stakeholders stay informed automatically

## Usage Examples

### Student Confirming Attendance
```javascript
PUT /api/enrollments/64f1a2b3c4d5e6f7g8h9i0j/confirm-attendance
{
  "attendanceConfirmations": [
    {
      "date": "2024-04-15",
      "confirmed": true,
      "studentRemarks": "I was present but marked absent"
    }
  ]
}
```

### HOD Reviewing Discrepancy
```javascript
PUT /api/enrollments/64f1a2b3c4d5e6f7g8h9i0j/review-attendance
{
  "attendanceUpdates": [
    {
      "date": "2024-04-15",
      "status": "present",
      "hodRemarks": "Verified with class records - student was present"
    }
  ]
}
```

This system ensures accurate attendance tracking while providing mechanisms for students to participate in the verification process and for administrators to maintain oversight.