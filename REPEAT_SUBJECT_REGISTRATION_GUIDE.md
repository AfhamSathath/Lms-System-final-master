# Repeat Subject Registration System - Complete Workflow

## Overview
This is a comprehensive real-world scenario-based repeat subject registration system inspired by University of Moratuwa's MIS. It implements a complete multi-role workflow with email notifications, status tracking, and fee management.

---

## 🎯 Real-World Scenario-Based Workflow

### **Stage 1: Student Identifies & Selects Subjects (DRAFT)**
**Actor:** Student  
**Workflow:**
1. Student logs in and views dashboard
2. Student sees subjects with failing/low grades (F, E, D, D+, C-)
3. Student can compare:
   - Subject code and name
   - Previous marks and grade
   - Credits
   - Previous semester/year
4. Student creates a **DRAFT** registration (like a shopping cart)
5. Student can save draft and edit later

**Email:** None at draft stage

**Database Status:** `registrationStatus: DRAFT`

---

### **Stage 2: Student Submits Application (SUBMITTED)**
**Actor:** Student  
**Workflow:**
1. Student reviews draft details
2. Student selects reason for repetition:
   - **FAILED**: Subject with grade F
   - **GRADE_IMPROVEMENT**: Subject with D/D+/C-
3. Student can add optional comments explaining reasons
4. Student reviews workflow timeline before submission
5. Student confirms and submits application

**Email to Student:** "Application Submitted Successfully ✓"
- Confirmation of submission
- Subject details
- Expected response time (3-5 working days)
- Portal link to track status

**Email to HOD:** "Action Required: New Repeat Subject Application"
- Student name and index
- Subject details
- Previous grade and marks
- Student's comments
- Link to review application

**Database Status:** `registrationStatus: SUBMITTED`, `studentSubmittedAt: <timestamp>`

---

### **Stage 3: HOD Reviews Application (HOD_REVIEW)**
**Actor:** Head of Department  
**Workflow:**
1. HOD receives notification of pending applications
2. HOD logs in to dashboard
3. HOD views applicant's academic standing
4. HOD reviews student's:
   - Academic performance
   - Attendance
   - Other course performance
5. HOD has 3 options:
   - **APPROVED**: Forward to Registrar
   - **REJECTED**: Send rejection with reason
   - **REQUESTED_REVISION**: Send back to student for more info

**If APPROVED:**
- **Email to Student:** "Great News: Your Repeat Application Approved by HOD"
  - Confirmation of HOD approval
  - Next steps (Registrar review)
  - Fee information preview
  
- **Notification to Registrar:** New application ready for final approval

**If REJECTED:**
- **Email to Student:** "Repeat Subject Application - Decision Notification"
  - Rejection reason
  - Options to contact advisor
  - Guidance on resubmission

**If REVISION REQUESTED:**
- **Email to Student:** "Revision Requested"
  - HOD's specific feedback/comments
  - Request to update and resubmit
  - Link to edit application

**Database Status:** 
- `hodReviewStatus: APPROVED/REJECTED/REQUESTED_REVISION`
- `registrationStatus: ACCEPTED/REJECTED/DRAFT` (if revision requested)
- `hodReviewedAt`, `hodReviewComments`

---

### **Stage 4: Registrar Final Approval (REGISTRAR_APPROVAL)**
**Actor:** Registrar  
**Workflow:**
1. Registrar sees all HOD-approved applications
2. Registrar performs final verification:
   - Check student's enrollment status
   - Verify academic standing
   - Ensure no policy violations
3. Registrar approves or rejects
4. If approved:
   - System automatically creates Finance record with invoice
   - Repeat fee: LKR 2,500
   - Payment due date: 14 days from now

**If APPROVED:**
- **Email to Student:** "Important: Repeat Fee Payment Required"
  - Official approval confirmation
  - Invoice details (Invoice Number)
  - Fee amount: LKR 2,500
  - Due date with countdown
  - Payment instructions (5 steps)
  - Link to Finance Portal
  - Timeline for exam scheduling

- **Fee Reminder Email** (automated, can be scheduled)
  - Subject still available
  - Days remaining to pay
  - Consequences of late payment
  - Payment portal link

- **Notification to Exam Officer:** Payment due, ready to schedule exam

**If REJECTED:**
- **Email to Student:** "Repeat Subject Application - Registrar Decision"
  - Rejection reason
  - Contact information for clarification

**Database Status:**
- `registrarApprovalStatus: APPROVED/REJECTED`
- `registrationStatus: ACCEPTED/REJECTED`
- `registrarApprovedAt`
- `invoiceNumber` (if approved)
- Finance record created with `repeatFeeAmount: 2500`

---

### **Stage 5: Student Pays Repeat Fee (FEE_PAYMENT)**
**Actor:** Student / Bursar  
**Workflow:**
1. Student sees payment due notification (email + portal)
2. Student logs in to Finance section
3. Student initiated payment through bank/online system
4. Student uploads proof of payment
5. Bursar/Admin verifies payment proof
6. Bursar marks fee as **PAID**

**Process:**
```
Student Initiates Payment → Uploads Proof → Bursar Verifies → Fee Marked PAID
```

**Email to Student** (when marked PAID): "Payment Received: Repeat Subject Fee Confirmed"
- Receipt details
- Payment reference
- Amount paid
- Date processed
- Next step: Exam scheduling (2-3 days)

**Notification to Exam Officer:** "Repeat Subject - Fee Received"
- Student name and index
- Subject code
- Ready for exam scheduling

**Database Status:**
- `feeStatus: PAID`
- `paymentReference: <reference>`
- `paymentProof: <path>`
- `paymentReceivedDate: <date>`

---

### **Stage 6: Exam Scheduling (EXAM_SCHEDULED)**
**Actor:** Exam Officer  
**Workflow:**
1. Exam Officer receives notification about paid students
2. Exam Officer allocates exam slot:
   - Exam date
   - Exam time
   - Venue/Hall
   - Exam code
3. Exam Officer saves slot details

**Email to Student:** "📅 Your Exam Schedule"
- OFFICIAL EXAM SCHEDULE header
- Subject details
- Date (formatted: "Monday, May 20, 2026")
- Time
- Venue
- Exam code
- Important reminders:
  - Arrive 15 minutes early
  - Bring Student ID and admission letter
  - No mobile phones allowed
  - Emergency contact information

**Database Status:**
- `examScheduleStatus: SCHEDULED`
- `allocatedExamSlot: { date, time, venue, examCode }`
- `registrationStatus: ACCEPTED` (final status)

---

## 📊 Database Models

### RepeatSubjectRegistration Model
```javascript
{
  // Student Information
  student: ObjectId (ref: User),
  studentIndex: String,
  studentName: String,
  department: String,

  // Subject Information
  subject: ObjectId (ref: Subject),
  subjectCode: String,
  subjectName: String,
  credits: Number,

  // Previous Attempt Details
  previousAttempt: {
    year: String,
    semester: Number,
    examType: String,
    marks: Number,
    grade: String (enum: F, E, D, D+, C-, C, C+, B-, B, B+, A, A+),
    gpa: Number
  },

  // Current Registration
  academicYear: String,
  semester: Number,
  registrationDate: Date,

  // Repeat Reason
  repeatReason: String (enum: FAILED, GRADE_IMPROVEMENT, INCOMPLETE),
  additionalComments: String,

  // Approval Workflow
  registrationStatus: String (enum: DRAFT, SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN),
  studentSubmittedAt: Date,

  // HOD Review
  hodReviewStatus: String (enum: PENDING, APPROVED, REQUESTED_REVISION, REJECTED),
  hodReviewedBy: ObjectId (ref: User),
  hodReviewedAt: Date,
  hodReviewComments: String,

  // Registrar Approval
  registrarApprovalStatus: String (enum: PENDING, APPROVED, REJECTED),
  registrarApprovedBy: ObjectId (ref: User),
  registrarApprovedAt: Date,
  registrarApprovalReason: String,

  // Finance
  feeStatus: String (enum: PENDING, PAID, WAIVED, PAYMENT_DELAYED),
  repeatFeeAmount: Number (default: 2500),
  invoiceNumber: String,
  paymentReference: String,
  paymentProof: String,
  paymentReceivedDate: Date,

  // Exam Slot
  examScheduleStatus: String (enum: NOT_SCHEDULED, SCHEDULED, COMPLETED),
  allocatedExamSlot: {
    date: Date,
    time: String,
    venue: String,
    examCode: String
  },

  // Audit Trail
  workflowHistory: [{
    stage: String,
    status: String,
    timestamp: Date,
    actedBy: ObjectId (ref: User),
    comments: String
  }],

  // System Tracking
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 API Endpoints

### Student Endpoints

#### Get Eligible Subjects
```
GET /api/repeat-registration/eligible-subjects
Headers: Authorization: Bearer <token>
Auth: Student

Response:
{
  success: true,
  count: 2,
  eligibleSubjects: [
    {
      subjectId: "123...",
      subjectCode: "CS201",
      subjectName: "Data Structures",
      credits: 3,
      previousGrade: "F",
      previousMarks: 35,
      previousYear: "1st Year",
      previousSemester: 1
    }
  ]
}
```

#### Create Draft Registration
```
POST /api/repeat-registration/draft
Headers: Authorization: Bearer <token>
Auth: Student

Body:
{
  subject: "123...",
  repeatReason: "FAILED",
  additionalComments: "I need to pass this subject"
}

Response:
{
  success: true,
  message: "Draft registration created",
  registration: {...}
}
```

#### Submit Application
```
PUT /api/repeat-registration/:id/submit
Headers: Authorization: Bearer <token>
Auth: Student

Response:
{
  success: true,
  message: "Application submitted successfully",
  registration: {...}
}
```

#### View My Applications
```
GET /api/repeat-registration/my-applications
Headers: Authorization: Bearer <token>
Auth: Student

Response:
{
  success: true,
  count: 2,
  registrations: [...]
}
```

### HOD Endpoints

#### Get Pending Applications
```
GET /api/repeat-registration/hod/pending
Headers: Authorization: Bearer <token>
Auth: HOD

Response:
{
  success: true,
  count: 5,
  pendingApplications: [...]
}
```

#### Review Application
```
PUT /api/repeat-registration/:id/hod-review
Headers: Authorization: Bearer <token>
Auth: HOD

Body:
{
  approvalStatus: "APPROVED", // or REJECTED, REQUESTED_REVISION
  comments: "Application meets academic standards"
}
```

### Registrar Endpoints

#### Get Pending Registrar Approvals
```
GET /api/repeat-registration/registrar/pending
Headers: Authorization: Bearer <token>
Auth: Registrar

Response:
{
  success: true,
  count: 3,
  pendingApplications: [...]
}
```

#### Approve/Reject Application
```
PUT /api/repeat-registration/:id/registrar-approval
Headers: Authorization: Bearer <token>
Auth: Registrar

Body:
{
  approvalStatus: "APPROVED", // or REJECTED
  approvalReason: "Approved as per institutional policy"
}
```

### Finance Endpoints

#### Mark Fee as Paid
```
PUT /api/repeat-registration/:id/fee-paid
Headers: Authorization: Bearer <token>
Auth: Bursar/Admin

Body:
{
  paymentReference: "BANK2026050123456",
  paymentProof: "/uploads/payment-receipt.pdf"
}
```

### Exam Officer Endpoints

#### Allocate Exam Slot
```
PUT /api/repeat-registration/:id/allocate-exam
Headers: Authorization: Bearer <token>
Auth: Exam Officer

Body:
{
  examDate: "2026-06-15",
  examTime: "09:00 AM",
  venue: "Exam Hall A - Block 3",
  examCode: "CS201-A1-2026"
}
```

### General Endpoints

#### Get Registration Details
```
GET /api/repeat-registration/:id
Headers: Authorization: Bearer <token>

Response:
{
  success: true,
  registration: {
    ...full details with populated fields...
    workflowHistory: [
      {
        stage: "SUBMITTED",
        status: "SUBMITTED",
        timestamp: "2026-05-01T10:30:00Z",
        actedBy: {...},
        comments: "Application submitted"
      }
    ]
  }
}
```

---

## 📧 Email Notifications Summary

| Stage | Recipient | Email | Trigger |
|-------|-----------|-------|---------|
| Draft Created | Student | Draft confirmation (optional) | Draft saved |
| Submitted | Student | "Application Submitted Successfully" | Application submitted |
| Submitted | HOD | "Action Required: New Repeat Application" | Application submitted |
| HOD Approved | Student | "Great News: HOD Approved" | HOD approves |
| HOD Rejected | Student | "Decision Notification" | HOD rejects |
| Revision Requested | Student | "Revision Requested" | HOD requests revision |
| Registrar Approved | Student | "Fee Payment Required" | Registrar approves |
| Registrar Approved | Student | "Fee Reminder" (scheduled) | After 3-5 days if unpaid |
| Fee Paid | Student | "Payment Confirmed" | Bursar marks paid |
| Exam Scheduled | Student | "Your Exam Schedule" | Exam Officer allocates slot |

---

## 🔐 Role-Based Access Control

| Endpoint | Student | HOD | Registrar | Bursar | Exam Officer | Admin |
|----------|---------|-----|-----------|--------|--------------|-------|
| Eligible Subjects | ✓ | - | - | - | - | - |
| Create Draft | ✓ | - | - | - | - | - |
| Submit Application | ✓ | - | - | - | - | - |
| My Applications | ✓ | - | - | - | - | - |
| HOD Pending | - | ✓ | - | - | - | - |
| HOD Review | - | ✓ | - | - | - | ✓ |
| Registrar Pending | - | - | ✓ | - | - | - |
| Registrar Approval | - | - | ✓ | - | - | ✓ |
| Fee Paid | - | - | - | ✓ | - | ✓ |
| Allocate Exam | - | - | - | - | ✓ | ✓ |
| View Registration | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 🌐 Frontend Components

### RepeatSubjectRegistrationForm Component
Located at: `/frontend/src/components/RepeatSubjectRegistrationForm.jsx`

**Features:**
- 3-step form process
- Subject selection with eligibility filtering
- Details confirmation with comments
- Review and summary before submission
- Real-time workflow timeline display
- Cost breakdown
- Responsive design with Tailwind CSS
- Icon indicators from lucide-react
- Loading and error states
- Success notifications

**Usage:**
```jsx
import RepeatSubjectRegistrationForm from '@/components/RepeatSubjectRegistrationForm';

function RepeatSubjectsPage() {
  return <RepeatSubjectRegistrationForm />;
}
```

---

## 🔄 Workflow State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                  DRAFT (Student Creates)                     │
│              (Can Save & Edit Anytime)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ [Student Submits]
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUBMITTED (Awaiting HOD)                     │
│            Notification to HOD + Email Sent                  │
└────────────┬───────────────────────────┬────────────────────┘
             │ [HOD Decision]            │
    ┌────────▼────────┐                  │
    │                 │                  │
    ▼                 ▼                  ▼
APPROVED        REJECTED           REVISION REQUESTED
    │                 │                  │
    │                 └──┬───────────────┘
    │                    │ [Back to DRAFT]
    │                    │
    ▼                    │
SUBMITTED (Registrar)    │
    │                    │
    │                ┌───┘
    │                │
    ├────────┬───────┘
    │        │
    ▼        ▼
ACCEPTED   REJECTED
    │
    ├─[Invoice Created]
    │
    ▼
PAYMENT PENDING
    │
    │ [Student Pays]
    │
    ▼
PAYMENT RECEIVED
    │
    │ [Exam Officer Allocates]
    │
    ▼
EXAM SCHEDULED
    │
    │ [Exam Completed]
    │
    ▼
COMPLETED
```

---

## 💰 Fee Structure

| Item | Amount | Payment Timing | Status |
|------|--------|----------------|--------|
| Repeat Subject Fee | LKR 2,500 | After Registrar Approval | Mandatory |
| Late Payment Charge | LKR 250/day | If paid after due date | Conditional |

---

## ⏰ Timeline Expectations

```
Day 1:   Student Submits Application
Day 1-5: HOD Reviews & Approves
Day 5-7: Registrar Reviews & Approves
Day 7-21: Student Pays Fee
Day 21-24: Exam Officer Schedules Exam
Day 30+: Exam Conducted
```

---

## ✅ Quality Assurance Checklist

Before deployment, ensure:
- [ ] All email templates render correctly
- [ ] Workflow transitions are working as expected
- [ ] All role-based access controls are enforced
- [ ] Fee invoice is automatically created
- [ ] Exam slot allocation works
- [ ] Workflow history is properly logged
- [ ] Notifications are sent to correct recipients
- [ ] Frontend form validations are working
- [ ] Date/time formatting is correct for all timezones
- [ ] PDF generation for examination admission letters works

---

## 🚀 Deployment Notes

1. Add new route to server.js: ✓
2. Create models: ✓
3. Create controllers: ✓
4. Create email service methods: ✓
5. Create frontend components: ✓
6. Test all API endpoints
7. Configure email templates in preview/testing
8. Set up Bursar role if not exists
9. Set up Exam Officer role if not exists
10. Configure SMTP for email notifications

---

## 📞 Support & Contact

**Academic Registry:** mis-support@eusl.ac.lk  
**Exam Office:** exam-office@eusl.ac.lk  
**Finance Office:** finance@eusl.ac.lk

---

*Last Updated: April 2026*  
*Version: 1.0 - Initial Release*  
*Inspired by: University of Moratuwa MIS*
