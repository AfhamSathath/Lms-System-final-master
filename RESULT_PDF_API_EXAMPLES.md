# Result PDF Notification API - Usage Examples

## Overview
This document provides practical examples of how to use the Result PDF Notification system through the API.

## API Endpoints Summary

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/results` | POST | Admin | Create result & send PDF |
| `/api/results/:id` | PUT | Admin | Update result & send PDF |
| `/api/results/download/:fileName` | GET | Authenticated | Download result PDF |

---

## 1. Create Result with PDF Email

### Request
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student": "507f1f77bcf86cd799439011",
    "subject": "507f1f77bcf86cd799439012",
    "year": "1st Year",
    "semester": 1,
    "examType": "final",
    "marks": 85
  }'
```

### JavaScript Example (Node.js/Browser)
```javascript
const axios = require('axios');

async function createResultWithPDF() {
  try {
    const response = await axios.post(
      'http://localhost:5001/api/results',
      {
        student: '507f1f77bcf86cd799439011',
        subject: '507f1f77bcf86cd799439012',
        year: '1st Year',
        semester: 1,
        examType: 'final',
        marks: 85
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Result created successfully');
    console.log('Result ID:', response.data.result._id);
    console.log('Grade:', response.data.result.grade);
    console.log('Student will receive PDF email within 5 seconds');

    return response.data.result;
  } catch (error) {
    console.error('✗ Error creating result:', error.response?.data);
    throw error;
  }
}

// Usage
createResultWithPDF();
```

### Python Example (Flask/Django)
```python
import requests
import json

def create_result_with_pdf():
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'student': '507f1f77bcf86cd799439011',
        'subject': '507f1f77bcf86cd799439012',
        'year': '1st Year',
        'semester': 1,
        'examType': 'final',
        'marks': 85
    }
    
    response = requests.post(
        'http://localhost:5001/api/results',
        headers=headers,
        json=payload
    )
    
    if response.status_code == 201:
        result = response.json()['result']
        print(f"✓ Result created: {result['_id']}")
        print(f"  Grade: {result['grade']}")
        print("  PDF email sent to student")
        return result
    else:
        print(f"✗ Error: {response.json()}")
        raise Exception("Failed to create result")

# Usage
create_result_with_pdf()
```

### Expected Response
```json
{
  "success": true,
  "result": {
    "_id": "507f1f77bcf86cd799439099",
    "student": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Ahmed Hassan",
      "studentId": "ST20210001",
      "email": "ahmed@university.edu",
      "department": "Computer Science"
    },
    "subject": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Data Structures & Algorithms",
      "code": "CS201",
      "credits": 3
    },
    "year": "1st Year",
    "semester": 1,
    "examType": "final",
    "marks": 85,
    "grade": "A",
    "gradePoint": 4.0,
    "status": "pass",
    "publishedBy": "507f1f77bcf86cd799439050",
    "publishedAt": "2026-04-05T10:30:00Z"
  }
}
```

**What happens automatically:**
1. ✓ PDF generated with result details
2. ✓ PDF saved to `backend/uploads/results/result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf`
3. ✓ Email sent to Ahmed Hassan with PDF attached
4. ✓ Email contains download button linking to PDF
5. ✓ Notification created in Ahmed's dashboard
6. ✓ Result visible on Student Portal

---

## 2. Update Result with New PDF Email

### Request
```bash
curl -X PUT http://localhost:5001/api/results/507f1f77bcf86cd799439099 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marks": 88,
    "grade": "A"
  }'
```

### JavaScript Example
```javascript
async function updateResultWithPDF(resultId, updates) {
  try {
    const response = await axios.put(
      `http://localhost:5001/api/results/${resultId}`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Result updated successfully');
    console.log('New Grade:', response.data.result.grade);
    console.log('Updated PDF email sent to student');

    return response.data.result;
  } catch (error) {
    console.error('✗ Error updating result:', error.response?.data);
    throw error;
  }
}

// Usage
updateResultWithPDF('507f1f77bcf86cd799439099', {
  marks: 88,
  grade: 'A'
});
```

### Expected Response
```json
{
  "success": true,
  "result": {
    "_id": "507f1f77bcf86cd799439099",
    "student": "507f1f77bcf86cd799439011",
    "subject": "507f1f77bcf86cd799439012",
    "year": "1st Year",
    "semester": 1,
    "examType": "final",
    "marks": 88,
    "grade": "A",
    "gradePoint": 4.0,
    "status": "pass",
    "publishedAt": "2026-04-05T10:30:00Z",
    "updatedAt": "2026-04-05T11:45:00Z"
  }
}
```

**What happens automatically:**
1. ✓ New PDF generated with updated marks (88) and grade (A)
2. ✓ New PDF saved with new timestamp
3. ✓ Updated email sent to student with new PDF
4. ✓ Notification updated in student's dashboard
5. ✓ Student portal shows updated result

---

## 3. Download Result PDF

### Request - Browser Download
```bash
# User clicks download link in email or portal
GET http://localhost:5001/api/results/download/result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf
Authorization: Bearer USER_TOKEN
```

### JavaScript Example (Frontend)
```javascript
// In React component or vanilla JS
function downloadResultPDF(fileName) {
  const token = localStorage.getItem('token');
  const downloadUrl = `http://localhost:5001/api/results/download/${fileName}`;
  
  fetch(downloadUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  })
  .then(blob => {
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // filename from content-disposition
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  })
  .catch(error => console.error('Download error:', error));
}

// Usage
downloadResultPDF('result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf');
```

### JavaScript Example (Axios)
```javascript
async function downloadResultPDF(fileName) {
  try {
    const response = await axios.get(
      `http://localhost:5001/api/results/download/${fileName}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        responseType: 'blob' // Important for PDF
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    console.log('✓ PDF downloaded successfully');
  } catch (error) {
    console.error('✗ Download failed:', error.response?.status);
  }
}

// Usage
downloadResultPDF('result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf');
```

### cURL Example
```bash
curl -X GET \
  "http://localhost:5001/api/results/download/result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o result.pdf

# Opens like: result.pdf (50-100 KB PDF file)
echo "✓ PDF saved as result.pdf"
```

---

## 4. Batch Create Multiple Results with PDFs

### Scenario: Lecturer publishes final exam results for entire class

```javascript
async function publishClassResults(subjectId, studentResults) {
  const adminToken = 'YOUR_ADMIN_TOKEN';
  const baseURL = 'http://localhost:5001/api/results';
  
  console.log(`Publishing ${studentResults.length} results...`);
  
  const results = [];
  const errors = [];
  
  for (const studentResult of studentResults) {
    try {
      const response = await axios.post(
        baseURL,
        {
          student: studentResult.studentId,
          subject: subjectId,
          year: '1st Year',
          semester: 1,
          examType: 'final',
          marks: studentResult.marks
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      results.push({
        studentId: studentResult.studentId,
        marks: studentResult.marks,
        grade: response.data.result.grade,
        pdfGenerated: true
      });
      
      console.log(`✓ ${studentResult.studentId}: Grade ${response.data.result.grade}`);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      errors.push({
        studentId: studentResult.studentId,
        error: error.response?.data?.message || error.message
      });
      console.error(`✗ ${studentResult.studentId}: ${error.message}`);
    }
  }
  
  console.log(`\n=== Publication Complete ===`);
  console.log(`Successful: ${results.length}/${studentResults.length}`);
  console.log(`Failed: ${errors.length}/${studentResults.length}`);
  
  if (errors.length > 0) {
    console.log('\nFailed to publish:');
    errors.forEach(e => console.log(`  - ${e.studentId}: ${e.error}`));
  }
  
  return { results, errors };
}

// Usage
const classResults = [
  { studentId: '507f1f77bcf86cd799439011', marks: 85 },
  { studentId: '507f1f77bcf86cd799439012', marks: 92 },
  { studentId: '507f1f77bcf86cd799439013', marks: 78 },
  { studentId: '507f1f77bcf86cd799439014', marks: 88 },
  { studentId: '507f1f77bcf86cd799439015', marks: 95 }
];

publishClassResults('507f1f77bcf86cd799439012', classResults);
```

---

## 5. Error Handling Examples

### Handle Missing Student
```javascript
try {
  await axios.post('http://localhost:5001/api/results', {
    student: 'INVALID_ID',
    subject: 'valid_id',
    year: '1st Year',
    semester: 1,
    examType: 'final',
    marks: 85
  }, { headers: { 'Authorization': `Bearer ${token}` } });
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Validation Error:', error.response.data.message);
    // Output: Validation Error: Invalid student
  }
}
```

### Handle Unauthorized Access
```javascript
try {
  await axios.get('http://localhost:5001/api/results/download/some-pdf.pdf', {
    headers: { 'Authorization': 'Bearer INVALID_TOKEN' }
  });
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Unauthorized: Please log in');
    // Redirect to login
  }
}
```

### Handle Missing PDF File
```javascript
try {
  await axios.get(
    'http://localhost:5001/api/results/download/non-existent-file.pdf',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
} catch (error) {
  if (error.response?.status === 404) {
    console.error('PDF not found: File has been deleted or moved');
    // Show user message
  }
}
```

### Handle PDF Generation Failure
```javascript
// Note: PDF generation failure doesn't prevent result creation
// Result is created, but email might not have attachment

try {
  const response = await axios.post('http://localhost:5001/api/results', {
    // ... result data
  }, { headers: { 'Authorization': `Bearer ${token}` } });
  
  // Check if result was created despite PDF failure
  if (response.status === 201) {
    console.log('Result created, but PDF might have failed');
    // User can still see result in portal
    // Admin should be notified in logs
  }
} catch (error) {
  console.error('Failed to create result:', error);
}
```

---

## 6. Frontend Integration Example (React)

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function ResultActions({ resultId, fileName, studentEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleDownloadPDF = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/results/download/${fileName}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendEmail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      // This would require a new endpoint: POST /api/results/:id/resend-email
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/results/${resultId}/resend-email`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert('Email resent to ' + studentEmail);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="result-actions">
      <button
        onClick={handleDownloadPDF}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Downloading...' : '📥 Download PDF'}
      </button>
      
      <button
        onClick={handleResendEmail}
        disabled={loading}
        className="btn btn-secondary"
      >
        {loading ? 'Sending...' : '📧 Resend Email'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default ResultActions;
```

---

## 7. Email Template Information

### Email Contents Breakdown

**Subject:**
```
Result Sheet: [COURSE_CODE] - [GRADE] Published
Example: Result Sheet: CS201 - A Published
```

**Email Body:**
- University header with logo
- Greeting with student name
- Result summary table with:
  - Course name and code
  - Academic year and semester
  - Exam type
  - Marks obtained (e.g., 85/100)
  - Final grade (e.g., A)
- **Download button** (main CTA)
- Alternative access instructions
- Important notes and contact information

**Attachment:**
- PDF file with name like: `result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf`
- Size: 50-100 KB
- Can be saved and opened offline

---

## 8. Monitoring & Logging

### Check PDF Generation in Logs
```bash
# View successful PDF generations
grep "Result PDF email sent successfully" backend.log

# View failed PDF attempts
grep "Failed to send result PDF" backend.log

# View all result-related logs
grep "result" backend.log | grep -i pdf
```

### Sample Log Outputs
```
[⏰ 2026-04-05 10:30:45] Result PDF email sent successfully: <507f1f77bcf86cd799439099>
[⏰ 2026-04-05 10:30:46] Generated PDF: result-507f1f77bcf86cd799439011-507f1f77bcf86cd799439012-1712345678901.pdf
[⏰ 2026-04-05 10:30:47] Email sent to: ahmed@university.edu
```

---

## Troubleshooting Common Issues

### Issue: PDF not generated
**Solution:**
```javascript
// Check if file exists
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../uploads/results/result-*.pdf');
console.log('Files exist:', fs.existsSync(filePath));
```

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify email in database: `student.email`
- Check SMTP credentials in .env
- Verify frontend URL is correct

### Issue: Download link broken
**Solution:**
- Verify `FRONTEND_URL` in env
- Check file exists in `uploads/results/`
- Verify user is authenticated
- Check file permissions

---

## Success Indicators

When the system is working correctly, you should observe:

1. ✓ Admin creates result in < 5 seconds
2. ✓ PDF appears in `uploads/results/` directory
3. ✓ Student receives email within 1-2 minutes
4. ✓ Email contains PDF attachment
5. ✓ Download link works from email
6. ✓ PDF opens and displays correctly
7. ✓ Portal download button works
8. ✓ Multiple results don't conflict
9. ✓ No server errors in logs
10. ✓ No file permission issues

---

**Last Updated:** 2026-04-05
**Version:** 1.0
**Author:** Development Team
