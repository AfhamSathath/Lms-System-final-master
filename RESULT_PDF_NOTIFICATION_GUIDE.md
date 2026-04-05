# Result PDF Notification System - Implementation Guide

## Overview
This guide documents the new Result PDF Notification system that automatically sends students their examination results as PDF files via email with a download link.

## Features Implemented

### 1. **Result PDF Generation**
- Automatically generates professional PDF documents with result details
- Includes university branding and official formatting
- Contains student information, course details, marks, grade, and grade points
- PDF saved to `backend/uploads/results/` directory

### 2. **Email Notification with PDF Attachment**
- Sends formatted HTML email with:
  - Result summary table
  - Direct download button for the PDF
  - Alternative portal access instructions
  - Professional university branding
- PDF file attached to email for convenient access
- Automatic fallback if PDF generation fails

### 3. **PDF Download Endpoint**
- Secure endpoint: `GET /api/results/download/:fileName`
- Authentication required (students can only access their own results)
- File validation to prevent path traversal attacks
- Proper HTTP headers for file download

## Technical Implementation

### Modified Files

#### 1. **backend/utils/emailService.js**
**Added Method:** `sendResultPDFEmail(student, result)`

```javascript
/**
 * Generate and send result PDF via email with downloadable link
 * @param {Object} student - Student object with name, email, studentId
 * @param {Object} result - Result object with subject, grade, marks, year, semester, examType
 * @returns {Promise<Object>} - Returns { filePath, fileName, pdfUrl }
 */
async sendResultPDFEmail(student, result)
```

**Features:**
- Creates PDF using pdfkit library
- Saves PDF to `uploads/results/` directory
- Generates unique filename with timestamp
- Sends email with PDF attachment
- Returns file path and URL for access

**PDF Contents:**
- University header with logo
- Student information (name, ID, department, email)
- Course details (name, code, credits)
- Exam information (type, year, semester)
- Performance assessment table with marks, grade, and status
- Grade point information
- Generation timestamp
- Official disclaimer

#### 2. **backend/controllers/resultcontroller.js**
**Added Method:** `downloadResultPDF(req, res, next)`

```javascript
/**
 * @desc    Download result PDF file
 * @route   GET /api/results/download/:fileName
 * @access  Private - Authenticated students
 */
exports.downloadResultPDF = async (req, res, next)
```

**Features:**
- Validates filename to prevent path traversal
- Checks file existence
- Sets proper PDF headers
- Streams file to client
- Handles errors gracefully

**Modified Methods:**
- `createResult()` - Now calls `sendResultPDFEmail()` when result is published
- `updateResult()` - Now calls `sendResultPDFEmail()` when result is updated

#### 3. **backend/routes/resultroutes.js**
**Added Route:** `GET /api/results/download/:fileName`

```javascript
router.get('/download/:fileName', protect, resultcontroller.downloadResultPDF);
```

## Usage Guide

### For Students

#### 1. **Receiving Result Notifications**
When an admin or lecturer publishes a result:
- Student receives email notification with subject line: `Result Sheet: [COURSE_CODE] - [GRADE] Published`
- Email contains:
  - Professional result summary
  - Download button for PDF
  - Alternative access via Student Portal

#### 2. **Downloading PDF File**
Students can download the PDF in two ways:

**Option A: Direct Email Link**
- Click the blue "📥 Download Result PDF" button in the email
- Opens or downloads the result sheet PDF

**Option B: Portal Access**
- Log in to Student Portal
- Navigate to "Results" section
- Click "Download" button next to any result
- PDF is generated on-demand if not cached

### For Administrators/Lecturers

#### 1. **Publishing Single Result**
```bash
POST /api/results
Authorization: Bearer [TOKEN]
Content-Type: application/json

{
  "student": "507f1f77bcf86cd799439011",
  "subject": "507f1f77bcf86cd799439012",
  "year": "1st Year",
  "semester": 1,
  "examType": "final",
  "marks": 85
}
```

**Automatic Actions:**
- PDF is generated and saved
- Email sent with attachment and download link
- Notification created in student's account
- Result visible in student portal

#### 2. **Updating Existing Result**
```bash
PUT /api/results/:id
Authorization: Bearer [TOKEN]
Content-Type: application/json

{
  "marks": 88,
  "grade": "A"
}
```

**Automatic Actions:**
- New PDF generated with updated information
- Updated email sent to student
- Previous PDF archived (can be deleted manually)
- Notification updated in student's account

#### 3. **Bulk Upload Results with PDF Notifications**
Use the existing bulk upload feature - PDFs are automatically generated for each result group.

## File Storage

### Directory Structure
```
backend/
├── uploads/
│   └── results/
│       ├── result-[STUDENT_ID]-[SUBJECT_ID]-[TIMESTAMP].pdf
│       └── ... (other PDF files)
```

### File Naming Convention
- Format: `result-[STUDENT_ID]-[SUBJECT_ID]-[TIMESTAMP].pdf`
- Example: `result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf`
- Ensures uniqueness and prevents conflicts

### Storage Requirements
- Each PDF approximately 50-100 KB
- Consider implementing cleanup policy for old PDFs
- Monitor disk space usage if handling large student populations

## Email Template Content

### Email Subject
```
Result Sheet: [COURSE_CODE] - [GRADE] Published
```

### Email Body Structure
```
✓ Your Result Sheet is Ready
↓
Result Summary Table
- Course Name & Code
- Academic Year & Semester
- Exam Type
- Marks Obtained
- Grade
↓
Download Button
↓
Portal Access Instructions
↓
Important Notes & Contact Information
```

## API Endpoints

### 1. Download Result PDF
```bash
GET /api/results/download/:fileName
Authorization: Bearer [TOKEN]

# Response: PDF file (binary)
```

**Parameters:**
- `fileName` (string): Name of the PDF file (format: result-*.pdf)

**Status Codes:**
- `200`: PDF file successfully downloaded
- `400`: Invalid filename (path traversal attempt)
- `404`: PDF file not found
- `401`: Unauthorized (not logged in)
- `500`: Server error

### 2. Create Result (with PDF email)
```bash
POST /api/results
Authorization: Bearer [TOKEN] (Admin only)
Content-Type: application/json

# Request & Response (see existing documentation)
# Additionally: PDF email is sent automatically
```

### 3. Update Result (with PDF email)
```bash
PUT /api/results/:id
Authorization: Bearer [TOKEN] (Admin only)
Content-Type: application/json

# Request & Response (see existing documentation)
# Additionally: PDF email is sent automatically
```

## Error Handling

### Common Issues & Solutions

#### 1. **PDF Generation Fails**
- User still receives email notification
- Regular email alert sent to student
- Admin can retry by updating the result
- Check server disk space and permissions

#### 2. **Email Send Fails**
- Result is still created/updated successfully
- Log error message for debugging
- Student can access result via portal
- Admin can manually trigger email via result update

#### 3. **Download Link Not Working**
- Check file permissions in `uploads/results/`
- Verify `FRONTEND_URL` environment variable is set correctly
- Ensure student is authenticated
- File might have been deleted

## Configuration

### Environment Variables Required
```
FRONTEND_URL=http://localhost:5173          # For PDF download links
EMAIL_USER=your-email@gmail.com             # Email sender
EMAIL_PASS=your-app-password                # Email password
EMAIL_HOST=smtp.gmail.com                   # SMTP host
EMAIL_PORT=587                              # SMTP port
```

### Package Dependencies
- `pdfkit` (v0.17.2) - PDF generation
- `nodemailer` (v8.0.1) - Email sending
- `fs` (built-in) - File system operations

## Security Considerations

### 1. **File Access Control**
- Authentication required for all downloads
- Filename validation prevents path traversal
- Only PDFs from `uploads/results/` directory accessible

### 2. **Email Security**
- Attachments scanned by email provider
- PDF includes timestamp and disclaimer
- Email addresses not exposed to other students

### 3. **Data Privacy**
- Each student only sees their own results
- PDFs contain only student's personal data
- No student can access other student's PDFs

## Monitoring & Maintenance

### Log Monitoring
Check backend logs for:
```
"Result PDF email sent successfully:"    // Success indicator
"Failed to send result PDF email:"       // Error indicator
"Error generating result PDF:"           // Generation error
"Error streaming PDF file:"              // Download error
```

### Cleanup Strategy
Consider implementing periodic cleanup:
```bash
# Remove PDFs older than 90 days
find backend/uploads/results/ -type f -mtime +90 -delete
```

### Disk Usage Check
```bash
# Check total size of PDF directory
du -sh backend/uploads/results/
```

## Future Enhancements

1. **PDF Customization**
   - Add student photo to PDF
   - Include campus location/contact info
   - Custom color branding options

2. **Batch Operations**
   - Generate PDFs for entire class at once
   - Email all students simultaneously
   - Track delivery status

3. **Archive Management**
   - Automatic cleanup of old PDFs
   - Compressed archive storage
   - Backup to cloud storage

4. **Additional Formats**
   - Excel spreadsheet downloads
   - JSON API response
   - CSV export

5. **Enhanced Notifications**
   - SMS notification of result release
   - Push notifications via mobile app
   - Grade improvement alerts

## Troubleshooting

### PDF Email Not Sending
1. Verify email credentials in `.env`
2. Check email provider app-specific password
3. Check backend logs for SMTP errors
4. Verify `nodemailer` package is installed

### PDF File Not Found
1. Check `uploads/results/` directory exists
2. Verify file permissions are correct
3. Check disk space availability
4. Review PDF generation logs

### Download Endpoint Returns 404
1. Ensure filename format is correct
2. Verify file exists in `uploads/results/`
3. Check authentication token is valid
4. Review URL encoding of filename

## Support & Contact

For issues or questions:
- Email: mis-support@esn.ac.lk
- Academic Registry: registry@eusl.ac.lk
- Examination Office: exam.office@eusl.ac.lk
