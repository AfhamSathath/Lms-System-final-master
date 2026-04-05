const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Sanitize the password (removing spaces if provided)
    const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: pass
      }
    });

    // Verification step
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP ERROR: Connection failed. Check .env credentials.', error);
      } else {
        console.log('SMTP SUCCESS: Server is ready to handle university notifications.');
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"Trincomalee Campus, Eastern University Of Sri Lanka" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: `
          <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- University Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px; text-align: center;">
               <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                  <tr>
                    <td align="center">
                      <center>
                        <img src="https://upload.wikimedia.org/wikipedia/en/a/a0/EUSL_logo2.png" alt="EUSL Logo" width="120" style="width: 120px; height: auto; display: block; margin: 0 auto;">
                      </center>
                    </td>
                  </tr>
               </table>
               <h1 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.5; text-align: center;">
                  Trincomalee Campus<br/>
                  <span style="font-weight: 400; font-size: 14px; opacity: 0.8;">Eastern University of Sri Lanka</span>
               </h1>
            </div>
            
            <!-- Dynamic Content -->
            <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
               ${options.html}
            </div>

            <!-- Global Footer -->
            <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
               <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">
                  Management Information System | Security & Academic Registry
               </p>
               <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">
                  &copy; 2026 Trincomalee Campus, EUSL. Support: mis-support@esn.ac.lk
               </p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Branded email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('CRITICAL BRANDED EMAIL ERROR:', error);
      throw error;
    }
  }

  // --- REGISTRATION / ONBOARDING ---
  async sendWelcomeEmail(user, password) {
    const html = `
      <h2 style="font-size: 24px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Portal Provisioning Successful</h2>
      <p>Welcome to the Eastern University digital ecosystem, <strong>${user.name}</strong>.</p>
      <p>Your academic account is now live. Use the certificates below to access the campus management portal:</p>
      <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
         <p style="margin: 0 0 10px 0;"><strong>Unified Identity:</strong> ${user.studentId || user.lecturerId}</p>
         <p style="margin: 0 0 10px 0;"><strong>Official Campus Email:</strong> ${user.email}</p>
         <p style="margin: 0;"><strong>Secure Password:</strong> <span style="font-family: monospace; color: #1e3a8a; font-weight: 800;">${password}</span></p>
      </div>
      <p style="font-size: 13px; color: #ef4444; font-weight: 600;">⚠️ MANDATORY ACTION: Change your password upon your first successful login.</p>
      <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase;">Launch Portal</a>
    `;

    return await this.sendEmail({ email: user.email, subject: 'Official: Your University Portal Access Credentials', html });
  }

  // --- ACADEMIC NOTIFICATIONS ---
  async sendGradeNotification(student, enrollment) {
    if (!student || !student.email || !student.email.includes('@')) {
      console.warn('Student does not have a valid email or student object is invalid:', student?._id || 'unknown');
      return;
    }
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 0;">Examination Result Published</h2>
      <p>Dear ${student.name}, the Academic Board has finalized and certified your standing for:</p>
      <div style="background: #ecfeff; border: 1px solid #0891b2; padding: 25px; border-radius: 16px; margin: 30px 0;">
         <p style="margin: 0 0 8px 0; font-weight: bold; color: #0891b2;">${enrollment.course.courseName}</p>
         <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1;">
               <p style="margin: 0; font-size: 10px; color: #0891b2; font-weight: 800; text-transform: uppercase;">Official Grade</p>
               <p style="margin: 0; font-size: 32px; font-weight: 900; color: #0e7490;">${enrollment.grade}</p>
            </div>
            <div style="flex: 1; border-left: 2px solid #0891b2; padding-left: 20px;">
               <p style="margin: 0; font-size: 10px; color: #0891b2; font-weight: 800; text-transform: uppercase;">Score Analysis</p>
               <p style="margin: 0; font-size: 20px; font-weight: 900;">${enrollment.totalMarks}%</p>
            </div>
         </div>
      </div>
      <p style="font-size: 12px; color: #64748b;">Your official transcript at <strong>Trincomalee Campus</strong> has been updated.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Result Alert: ${enrollment.course.courseCode} - Final Grade Published`, html });
  }

  async sendResultPublicationEmail(student, result, action = 'published') {
    if (!student || !student.email || !student.email.includes('@')) {
      console.warn('Student does not have a valid email or student object is invalid:', student?._id || 'unknown');
      return;
    }

    const Result = require('../models/result');
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verb = action === 'updated' ? 'updated' : 'published';
    const titleAction = action === 'updated' ? 'Updated Result Notification' : 'New Result Published Notification';

    const studentResults = await Result.find({ student: student._id })
      .populate('subject', 'name code credits')
      .sort({ year: 1, semester: 1, examType: 1 });

    if (!studentResults || studentResults.length === 0) {
      console.warn('No results found for student when sending publication email:', student._id);
      return;
    }

    const latestSubject = result.subject?.name || 'your latest subject';
    const latestCode = result.subject?.code ? ` (${result.subject.code})` : '';
    const totalSubjects = studentResults.length;

    const hasFail = studentResults.some(r => ['F', 'E', 'D', 'D+', 'C-'].includes(r.grade));

    const resultsSummary = studentResults
      .map(r => {
        const isFailing = ['F', 'E', 'D', 'D+', 'C-'].includes(r.grade);
        const color = isFailing ? '#dc2626' : '#1e293b';
        return `<span style="display: block; margin-bottom: 5px;">• ${r.subject?.code || 'N/A'} - ${r.subject?.name || 'Untitled'}: <strong style="color: ${color};">${r.grade || 'TBD'}</strong></span>`;
      })
      .join('');

    const pdfBuffer = await this.generateResultsPDF(student, studentResults);

    let totalGP = 0;
    let totalCredits = 0;
    studentResults.forEach(r => {
      const credits = r.subject?.credits || 0;
      if (r.gradePoint !== undefined && credits) {
        totalGP += r.gradePoint * credits;
        totalCredits += credits;
      }
    });
    const cumulativeGPA = totalCredits > 0 ? totalGP / totalCredits : 0;

    const html = `
      ${hasFail ? `
      <div style="text-align: center; margin-bottom: 30px;">
         <div style="display: inline-block; background: #fee2e2; color: #ef4444; padding: 12px 24px; border-radius: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; border: 1px solid #fca5a5;">
            ⚠️ Academic Alert: Low Standing Detected
         </div>
      </div>
      ` : ''}

      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">${titleAction}</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your ${result.year} Semester ${result.semester} ${result.examType} result for <strong>${latestSubject}${latestCode}</strong> has been ${verb}.</p>
      <p>This email includes a consolidated transcript for all published subjects in your academic record.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Current Transcript Progress</p>
        <p style="margin: 8px 0 0 0; color: #475569;">${totalSubjects} total published subject${totalSubjects === 1 ? '' : 's'} included in your record.</p>
        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 850; color: ${hasFail ? '#dc2626' : '#1e3a8a'};">Cumulative GPA: ${cumulativeGPA.toFixed(2)}</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e3a8a;">All published results</p>
        <div style="font-size: 13px; color: #475569; line-height: 1.6;">${resultsSummary}</div>
      </div>

      <div style="background: #f0fdf4; border: 1px dashed #86efac; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-weight: bold; color: #166534;">📎 Attached: Official PDF Transcript</p>
      </div>

      <p style="text-align: center; margin: 25px 0;"><a href="${portalUrl}/login" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase;">Portal Access</a></p>
      <p style="font-size: 12px; color: #64748b;">If you notice any discrepancy, contact the Academic Registry immediately.</p>
    `;

    const mailOptions = {
      from: `"Trincomalee Campus, Eastern University Of Sri Lanka" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: `${titleAction}: ${latestSubject}${latestCode}`,
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px; text-align: center;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <center>
                      <img src="https://upload.wikimedia.org/wikipedia/en/a/a0/EUSL_logo2.png" alt="EUSL Logo" width="120" style="width: 120px; height: auto; display: block; margin: 0 auto;">
                    </center>
                  </td>
                </tr>
             </table>
             <h1 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.5; text-align: center;">
                Trincomalee Campus<br/>
                <span style="font-weight: 400; font-size: 14px; opacity: 0.8;">Eastern University of Sri Lanka</span>
             </h1>
          </div>
          <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
             ${html}
          </div>
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
             <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">Management Information System | Security & Academic Registry</p>
             <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">&copy; 2026 Trincomalee Campus, EUSL. Support: mis-support@esn.ac.lk</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Transcript_${student.studentId || student._id}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Consolidated result email sent for student:', student.email, 'messageId:', info.messageId);
    return info;
  }

  async sendAttendanceWarning(student, enrollment) {
    const html = `
      <div style="text-align: center; margin-bottom: 30px;">
         <div style="display: inline-block; background: #fee2e2; color: #ef4444; padding: 12px 24px; rounded: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border: 1px solid #fca5a5;">
            Action Required
         </div>
      </div>
      <h2 style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 0; text-align: center;">Academic Status: Low Attendance</h2>
      <p>Our surveillance of course participation indicates that your attendance for <strong>${enrollment.course.courseName}</strong> has dropped below institutional requirements.</p>
      <div style="background: #fff1f2; border: 2px dashed #f43f5e; padding: 25px; border-radius: 16px; margin: 30px 0; text-align: center;">
         <p style="margin: 0; font-size: 11px; font-weight: 800; color: #f43f5e; uppercase;">Current Compliance Rating</p>
         <p style="margin: 5px 0 0 0; font-size: 42px; font-weight: 900; color: #be123c;">${enrollment.attendancePercentage.toFixed(1)}%</p>
      </div>
      <p style="font-weight: bold; color: #1e293b;">CRITICAL: Failure to maintain 75% attendance will result in a mandatory block from the Final Examination Session.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'URGENT: Academic Compliance Alert - Low Attendance', html });
  }

  async sendEnrollmentConfirmation(student, course) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Registration Confirmed</h2>
      <p>Dear ${student.name}, this is an official confirmation of your course enrollment at <strong>Trincomalee Campus</strong>.</p>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 8px solid #1e3a8a;">
         <p style="margin: 0; font-size: 18px; font-weight: 800;">${course.courseName || course.name}</p>
         <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Status: Officially Enrolled</p>
      </div>
      <p>Please check your LMS dashboard for course materials and schedules.</p>
    `;
    return await this.sendEmail({ email: student.email, subject: `Confirmed: Enrollment in ${course.courseCode || course.code}`, html });
  }



  // --- REPEAT EXAM NOTIFICATIONS ---
  async sendRepeatRequestForHOD(hod, student, course) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e40af; margin-top: 0;">Authorization Required</h2>
      <p>Head of Department, <strong>Prof. ${hod.name}</strong>,</p>
      <p>A student has submitted a formal application for a Repeat Examination within your jurisdiction:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0 0 10px 0;"><strong>Candidate Name:</strong> ${student.name}</p>
         <p style="margin: 0;"><strong>Course Unit:</strong> ${course.courseName} (${course.courseCode})</p>
      </div>
      <p>Please log in to the HOD Portal to adjudicate this request.</p>
    `;

    return await this.sendEmail({ email: hod.email, subject: `HOD Action Required: Repeat Exam - ${student.name}`, html });
  }

  async sendRepeatDecisionToStudent(student, course, status, reason) {
    const isApproved = status === 'approved';
    const color = isApproved ? '#059669' : '#dc2626';

    const html = `
       <h2 style="color: ${color}; font-size: 24px; font-weight: 900; margin-top: 0;">Board Decision: ${status.toUpperCase()}</h2>
       <p>The academic review for your repeat examination request in <strong>${course.courseName}</strong> has been finalized.</p>
       <div style="border-left: 4px solid ${color}; background: #f8fafc; padding: 25px; margin: 30px 0;">
          <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 800; text-transform: uppercase;">Official Remarks</p>
          <p style="margin: 10px 0 0 0; color: #1e293b; font-weight: 500; font-style: italic;">"${reason || 'Decision finalized as per Faculty policy.'}"</p>
       </div>
       ${isApproved ? '<p>Please consult the Registrar for sessional scheduling.</p>' : '<p>Contact your academic counselor for further guidance.</p>'}
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Exam Adjudication: ${status.toUpperCase()}`, html });
  }


  // --- FINANCE ALERTS ---
  async sendFinanceNotification(student, finance) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e293b; margin-top: 0;">Electronic Fee Statement</h2>
      <p>Financial obligation alert for <strong>${student.name}</strong>.</p>
      <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 30px 0;">
         <div style="background: #1e293b; padding: 15px 25px; color: white; display: flex; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800;">INVOICE RECORD</span>
            <span style="font-size: 11px; font-weight: 800;">DUE: ${new Date(finance.dueDate).toLocaleDateString()}</span>
         </div>
         <div style="padding: 30px;">
            <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: 800;">${finance.title}</p>
            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px;">${finance.description}</p>
            <p style="margin: 0; font-size: 32px; font-weight: 950; color: #1e3a8a;">$${finance.amount.toFixed(2)}</p>
         </div>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">Payments must be reconciled before the deadline to avoid portal suspension.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Fee Statement: ${finance.title} - Eastern University`, html });
  }

  // --- REPEAT SUBJECT REGISTRATION NOTIFICATIONS ---
  /**
   * Send to student confirming draft registration creation
   */
  async sendRepeatRegistrationDraftConfirmation(student, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Repeat Subject Draft Created</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>You have successfully created a draft registration for subject repetition. Please review the details below and submit when ready.</p>
      
      <div style="background: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Subject Details:</p>
        <p style="margin: 5px 0;"><strong>Code:</strong> ${registration.subjectCode}</p>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${registration.subjectName}</p>
        <p style="margin: 5px 0;"><strong>Credits:</strong> ${registration.credits}</p>
        <p style="margin: 5px 0;"><strong>Previous Grade:</strong> <span style="color: #dc2626; font-weight: bold;">${registration.previousAttempt.grade}</span></p>
        <p style="margin: 5px 0;"><strong>Marks:</strong> ${registration.previousAttempt.marks}</p>
      </div>

      <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #92400e;">
          ⚠️ <strong>Next Step:</strong> Review this draft and submit your application. Once submitted, it will be forwarded to your Head of Department for approval.
        </p>
      </div>

      <a href="${process.env.FRONTEND_URL}/repeat-subjects" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Applications</a>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Draft Created: Repeat Subject Registration', html });
  }

  /**
   * Send to student confirming successful submission
   */
  async sendRepeatRegistrationSubmissionConfirmation(student, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Application Submitted Successfully ✓</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration application has been officially submitted and is now pending Head of Department (HOD) approval.</p>
      
      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; margin: 20px 0; border-radius: 12px;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #166534;">📋 Application Summary:</p>
        <table style="width: 100%; font-size: 13px;">
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0; font-weight: bold;">Subject Code:</td>
            <td>${registration.subjectCode}</td>
          </tr>
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0; font-weight: bold;">Subject Name:</td>
            <td>${registration.subjectName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0; font-weight: bold;">Previous Grade:</td>
            <td><span style="color: #dc2626; font-weight: bold;">${registration.previousAttempt.grade}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Academic Year:</td>
            <td>${registration.academicYear}</td>
          </tr>
        </table>
      </div>

      <div style="background: #ecfeff; border: 1px solid #0891b2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #0c4a6e;">
          <strong>Status Timeline:</strong> Your application is now with the Head of Department. You will receive a notification once they review and respond.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; margin: 15px 0;">
        <strong>Expected Response Time:</strong> 3-5 working days
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Repeat Subject Application Submitted', html });
  }

  async sendRepeatRegistrationSubmissionFailure(student, registration, error) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #dc2626; margin-top: 0;">Submission Failed</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>We encountered an error while submitting your repeat subject application. Please review the details below and try again.</p>
      <div style="background: #fee2e2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #991b1b;"><strong>Error Details:</strong></p>

        <p style="margin: 8px 0; color: #1e293b; font-style: italic;">${error.message || 'An unexpected error occurred. Please try again later.'}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/repeat-subjects" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Retry Submission</a>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Error: Repeat Subject Application Submission Failed', html });
  }


  async sendRepeatRegistrationUpdate(student, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Application Updated</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject application has been updated. Please review the changes and resubmit if necessary.</p>
      <div style="background: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Updated Subject Details:</p>
        <p style="margin: 5px 0;"><strong>Code:</strong> ${registration.subjectCode}</p>
        <p style="margin: 5px 0;"><strong>Name:</strong> ${registration.subjectName}</p>
        <p style="margin: 5px 0;"><strong>Credits:</strong> ${registration.credits}</p>
        <p style="margin: 5px 0;"><strong>Previous Grade:</strong> <span style="color: #dc2626; font-weight: bold;">${registration.previousAttempt.grade}</span></p>
        <p style="margin: 5px 0;"><strong>Marks:</strong> ${registration.previousAttempt.marks}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/repeat-subjects" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Applications</a>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Repeat Subject Application Updated', html });
  }


  // --- CONSOLIDATED BULK RESULTS ---
  /**
   * Send bulk exam results notification with PDF to student
   * Groups all results into a single email with PDF attachment
   * @param {Object} student - Student object
   * @param {Array} results - Array of result objects with populated subject field
   */
  async sendBulkResultsNotificationWithPDF(student, results) {
    try {
      if (!student || !student.email || !student.email.includes('@')) {
        console.warn('Student does not have a valid email or student object is invalid:', student?._id || 'unknown');
        return;
      }

      if (!results || results.length === 0) {
        console.warn('No results to send for student:', student._id);
        return;
      }

      const Result = require('../models/result');
      const allResults = await Result.find({ student: student._id })
        .populate('subject', 'name code credits')
        .sort({ year: 1, semester: 1, examType: 1 });

      if (!allResults || allResults.length === 0) {
        console.warn('No transcript results found for student:', student._id);
        return;
      }

      // Generate a full transcript PDF using all results
      const pdfBuffer = await this.generateResultsPDF(student, allResults);

      // Check for any failed grades to show "Red Alert"
      const failedResults = allResults.filter(r => ['F', 'E', 'D', 'D+', 'C-'].includes(r.grade));
      const hasFail = failedResults.length > 0;

      const totalPublishedResults = allResults.length;
      
      let totalGP = 0;
      let totalCredits = 0;
      allResults.forEach(r => {
        const credits = r.subject?.credits || 0;
        if (r.gradePoint !== undefined && credits) {
          totalGP += r.gradePoint * credits;
          totalCredits += credits;
        }
      });
      const overallGPAValue = totalCredits > 0 ? totalGP / totalCredits : 0;

      // Create a subjects list for the HTML body
      const resultsSummary = allResults
        .map(r => {
          const isFailing = ['F', 'E', 'D', 'D+', 'C-'].includes(r.grade);
          const color = isFailing ? '#dc2626' : '#1e293b';
          const fontWeight = isFailing ? '900' : '500';
          return `<tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">${r.subject?.code || 'N/A'}</td>
                    <td style="padding: 10px 5px; color: #334155; font-size: 13px;">${r.subject?.name || 'Untitled'}</td>
                    <td style="padding: 10px 0; text-align: right; color: ${color}; font-weight: ${fontWeight}; font-size: 14px;">${r.grade || 'TBD'}</td>
                  </tr>`;
        })
        .join('');

      const html = `
        ${hasFail ? `
        <div style="text-align: center; margin-bottom: 30px;">
           <div style="display: inline-block; background: #fee2e2; color: #ef4444; padding: 12px 24px; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border: 1px solid #fca5a5; animation: pulse 2s infinite;">
              ⚠️ Academic Alert: Low Standing Detected
           </div>
        </div>
        ` : `
        <div style="text-align: center; margin-bottom: 30px;">
           <div style="display: inline-block; background: #f0fdf4; color: #166534; padding: 12px 24px; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; border: 1px solid #86efac;">
              Official Result Notification
           </div>
        </div>
        `}

        <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0; text-align: center;">Academic Status Report</h2>
        <p>Dear <strong>${student.name}</strong>,</p>
        <p>Your examination results have been finalized. This email provides a consolidated view of all results published in your academic record.</p>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #f1f5f9;">
                <th style="text-align: left; padding: 5px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Code</th>
                <th style="text-align: left; padding: 5px 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Subject</th>
                <th style="text-align: right; padding: 5px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${resultsSummary}
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; color: #475569; font-weight: bold;">Current Cumulative GPA</span>
            <span style="font-size: 24px; font-weight: 950; color: ${hasFail ? '#dc2626' : '#1e3a8a'};">${overallGPAValue.toFixed(2)}</span>
          </div>
        </div>

        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-weight: bold; color: #1e3a8a;">📎 Attached: Official Transcript (PDF)</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Includes detailed breakdown of marks and credits for all ${totalPublishedResults} subjects.</p>
        </div>

        ${hasFail ? `
        <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0; font-weight: bold; color: #991b1b;">Next Steps for Repeat Subjects:</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #b91c1c;">Please log in to your portal immediately to apply for Repeat Examinations. Failure to address failing grades may impact your progression.</p>
        </div>
        ` : ''}

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #1e3a8a; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase;">Portal Access</a>
        </p>
      `;

      return await this.sendEmail({ email: student.email, subject: `OFFICIAL: Academic Result Notification - GPA ${overallGPAValue.toFixed(2)}`, html });
    } catch (error) {
      console.error('ERROR SENDING CONSOLIDATED RESULTS EMAIL:', error);
      throw error;
    }
  }



  /**
   * Send to HOD for application review
   */
  async sendRepeatSubjectSubmissionToHOD(hod, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e40af; margin-top: 0;">Action Required: New Repeat Subject Application</h2>
      <p>Dear Prof. ${hod.name},</p>
      <p>A student from your department has submitted a formal application for subject repetition. Your approval is required before proceeding to the Registrar.</p>
      
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e3a8a;">Student Information:</p>
        <p style="margin: 8px 0;">
          <strong>Name:</strong> ${registration.studentName}<br/>
          <strong>Student Index:</strong> ${registration.studentIndex}<br/>
          <strong>Department:</strong> ${registration.department}
        </p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #1e293b;">Subject Details:</p>
        <p style="margin: 8px 0;">
          <strong>Subject Code:</strong> ${registration.subjectCode}<br/>
          <strong>Subject Name:</strong> ${registration.subjectName}<br/>
          <strong>Credits:</strong> ${registration.credits}<br/>
          <strong>Previous Grade:</strong> <span style="color: #dc2626; font-weight: bold;">${registration.previousAttempt.grade}</span> (${registration.previousAttempt.marks} marks)
        </p>
      </div>

      <p style="margin: 20px 0; font-size: 13px; color: #64748b;">
        <strong>Additional Comments from Student:</strong><br/>
        ${registration.additionalComments || '(None provided)'}
      </p>

      <a href="${process.env.FRONTEND_URL}/hod/repeat-applications/${registration._id}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Review Application</a>
    `;

    return await this.sendEmail({ email: hod.email, subject: `HOD Review Required: ${registration.studentName} - ${registration.subjectCode}`, html });
  }

  /**
   * Send to student when HOD approves
   */
  async sendRepeatApplicationHODApproved(student, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">HOD Approval Granted ✓</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Excellent news! Your Head of Department has approved your repeat subject application. Your application is now being forwarded to the Registrar for final authorization.</p>
      
      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #166534;">Subject Approved:</p>
        <p style="margin: 8px 0; font-size: 16px; font-weight: bold;">${registration.subjectCode} - ${registration.subjectName}</p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0;">
        <strong>Next Step:</strong> The Registrar will review and approve your application. Once approved, you will receive payment instructions for the repeat subject fee (LKR ${registration.repeatFeeAmount}).
      </p>

      <p style="font-size: 12px; color: #64748b;">
        <strong>Estimated Timeline:</strong><br/>
        ✓ HOD Approval: Complete<br/>
        → Registrar Review: 2-3 days<br/>
        → Fee Payment: 7-14 days to pay<br/>
        → Exam Scheduling: Upon payment
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Great News: Your Repeat Application Approved by HOD', html });
  }

  /**
   * Send to student when HOD rejects
   */
  async sendRepeatApplicationRejected(student, registration, reason) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #dc2626; margin-top: 0;">Application Status: Not Approved</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>We regret to inform you that your repeat subject application for the following has not been approved at this time.</p>
      
      <div style="background: #fff1f2; border: 2px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">Subject:</p>
        <p style="margin: 8px 0; font-size: 16px;">${registration.subjectCode} - ${registration.subjectName}</p>
      </div>

      <div style="border-left: 4px solid #dc2626; background: #fafafa; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Reason for Decision:</strong></p>
        <p style="margin: 8px 0; font-style: italic;">${reason || 'Not specified. Please contact your department for details.'}</p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0;">
        <strong>Next Steps:</strong> Please contact your Head of Department or Academic Advisor to discuss alternative options or resubmit your application with additional information.
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Repeat Subject Application - Decision Notification', html });
  }

  /**
   * Send to student when revision is requested
   */
  async sendRepeatApplicationRevisionRequested(student, registration, comments) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #f59e0b; margin-top: 0;">Revision Requested</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your application has been returned for revision. Please address the feedback provided by your Head of Department and resubmit.</p>
      
      <div style="background: #fffbeb; border: 2px solid #fcd34d; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #78350f; font-size: 14px;">HOD Comments:</p>
        <p style="margin: 10px 0 0 0; font-style: italic;">${comments}</p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0;">
        Please log into your dashboard to edit your application and resubmit.
      </p>

      <a href="${process.env.FRONTEND_URL}/repeat-subjects" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Update & Resubmit</a>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Repeat Application - Revision Requested', html });
  }

  /**
   * Send to student when Registrar approves and fee notice is sent
   */
  async sendRepeatApplicationApprovedWithFeeNotice(student, registration, invoice) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Official Approval & Payment Due</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject application has been officially approved by the Registrar. To complete your registration, you must pay the repeat subject fee outlined below.</p>
      
      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; margin: 20px 0; border-radius: 12px;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #166534;">Subject Approved:</p>
        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">${registration.subjectCode} - ${registration.subjectName}</p>
        
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0;"><strong>Fee Amount:</strong></td>
            <td style="text-align: right; font-weight: bold;">LKR ${registration.repeatFeeAmount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
            <td style="text-align: right;">${invoice.invoiceNumber || registration.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Payment Due Date:</strong></td>
            <td style="text-align: right; color: #dc2626; font-weight: bold;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0;">
        <strong>Payment Instructions:</strong><br/>
        1. Log in to your Student Portal<br/>
        2. Navigate to Finance → Invoices<br/>
        3. Upload proof of payment for verification<br/>
        4. Wait for Bursar approval (typically 24 hours)<br/>
        5. Once approved, exam slot will be scheduled
      </p>

      <a href="${process.env.FRONTEND_URL}/finance" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">View Invoices & Pay</a>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Important: Repeat Fee Payment Required - Approved Application', html });
  }

  /**
   * Send repeated reminder about repeat fee
   */
  async sendRepeatFeeDueNotification(student, registration, invoice) {
    const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #f59e0b; margin-top: 0;">⏰ Payment Reminder: Repeat Subject Fee</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>This reminder is to notify you that your repeat subject fee payment is due in <strong>${daysUntilDue} days</strong>.</p>
      
      <div style="background: #fffbeb; border: 2px solid #fcd34d; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Payment Details:</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${registration.subjectCode} - ${registration.subjectName}</p>
        <p style="margin: 5px 0;"><strong>Amount Due:</strong> LKR ${registration.repeatFeeAmount}</p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      </div>

      <div style="background: #ff9999; border: 1px solid #ff6666; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">⚠️ Late Payment Consequences:</p>
        <p style="margin: 5px 0; font-size: 12px;">Failure to pay by the due date may result in:</p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Cancellation of exam registration</li>
          <li>Additional late payment charges</li>
          <li>Academic penalties</li>
        </ul>
      </div>

      <a href="${process.env.FRONTEND_URL}/finance" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
    `;

    return await this.sendEmail({ email: student.email, subject: `Urgent: Repeat Fee Due in ${daysUntilDue} Days`, html });
  }

  /**
   * Send to student when payment is confirmed
   */
  async sendRepeatFeePaymentConfirmation(student, registration) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Payment Confirmed ✓</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject fee has been successfully received and verified. Your exam slot will be allocated shortly.</p>
      
      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; margin: 20px 0; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #166534;">Receipt Details:</p>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0;"><strong>Payment Reference:</strong></td>
            <td style="text-align: right;">${registration.paymentReference}</td>
          </tr>
          <tr style="border-bottom: 1px solid #86efac;">
            <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
            <td style="text-align: right; font-weight: bold;">LKR ${registration.repeatFeeAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Date Processed:</strong></td>
            <td style="text-align: right;">${new Date(registration.paymentReceivedDate).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0; background: #f8fafc; padding: 12px; border-radius: 6px;">
        <strong>Next Step:</strong> The Examination Officer will allocate your exam date, time, and venue within 2-3 working days. You will receive an email notification with your exam schedule.
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Payment Received: Repeat Subject Fee Confirmed', html });
  }

  /**
   * Send to student when exam slot is allocated
   */
  async sendRepeatExamScheduleNotification(student, registration) {
    const examDate = new Date(registration.allocatedExamSlot.date);

    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e40af; margin-top: 0;">📅 Your Exam Schedule</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject exam has been officially scheduled. Please note the details below and mark your calendar.</p>
      
      <div style="background: #ecfeff; border: 3px solid #0891b2; padding: 25px; margin: 20px 0; border-radius: 12px;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #0c4a6e; font-size: 16px;">EXAM SCHEDULE</p>
        
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 2px solid #0891b2;">
            <td style="padding: 12px 0; font-weight: bold;">Subject:</td>
            <td style="text-align: right;">${registration.subjectCode} - ${registration.subjectName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #cffafe;">
            <td style="padding: 12px 0; font-weight: bold;">📅 Date:</td>
            <td style="text-align: right; font-weight: bold; font-size: 16px; color: #0c4a6e;">${examDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #cffafe;">
            <td style="padding: 12px 0; font-weight: bold;">🕐 Time:</td>
            <td style="text-align: right; font-weight: bold;">${registration.allocatedExamSlot.time}</td>
          </tr>
          <tr style="border-bottom: 1px solid #cffafe;">
            <td style="padding: 12px 0; font-weight: bold;">📍 Venue:</td>
            <td style="text-align: right;"><strong>${registration.allocatedExamSlot.venue}</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: bold;">Exam Code:</td>
            <td style="text-align: right;">${registration.allocatedExamSlot.examCode}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #991b1b;">Important Reminders:</p>
        <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 12px;">
          <li>Arrive 15 minutes before your scheduled exam time</li>
          <li>Bring your Student ID card and admission letter</li>
          <li>Mobile phones are NOT permitted in the exam hall</li>
          <li>In case of emergency, contact the Exam Officer immediately</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
        For any questions regarding your exam schedule, contact the Examination Officer at exam-office@eusl.ac.lk
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Official: Exam Scheduled - ${registration.subjectCode} on ${examDate.toLocaleDateString()}`, html });
  }

  /**
   * Send to student when rejected by Registrar
   */
  async sendRepeatApplicationRejectedByRegistrar(student, registration, reason) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #dc2626; margin-top: 0;">Application Status: Not Approved</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>We regret to inform you that your repeat subject application has not been approved after Registrar review.</p>
      
      <div style="background: #fff1f2; border: 2px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">Subject:</p>
        <p style="margin: 8px 0; font-size: 16px;">${registration.subjectCode} - ${registration.subjectName}</p>
      </div>

      <div style="border-left: 4px solid #dc2626; background: #fafafa; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Reason:</strong></p>
        <p style="margin: 8px 0; font-style: italic;">${reason || 'Not specified. Please contact the Registrar for clarification.'}</p>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 15px 0;">
        <strong>Next Steps:</strong> Please contact the Academic Registry or your department to discuss your options.
      </p>
    `;

    return await this.sendEmail({ email: student.email, subject: 'Repeat Subject Application - Registrar Decision', html });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
      <h2 style="font-size: 22px; font-weight: 950; color: #1e3a8a; margin-top: 0;">Portal Recovery Protocol</h2>
      <p>A request to reset your University Management System password has been initiated for <strong>${user.email}</strong>.</p>
      <p style="margin: 30px 0;">
         <a href="${resetUrl}" style="background: #1e3a8a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block;">Reset My Password</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
         If you did not initiate this request, please contact the campus security office immediately. This link will expire in 10 minutes.
      </p>
    `;
    return await this.sendEmail({ email: user.email, subject: 'MIS Security: Password Reset Request', html });
  }

  async sendFeedbackNotification(lecturer, course) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e40af; margin-top: 0;">Unit Evaluation Alert</h2>
      <p>New academic feedback has been registered for your course unit:</p>
      <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border-right: 8px solid #1e3a8a;">
         <p style="margin: 0; font-size: 18px; font-weight: 800;">${course.courseName}</p>
         <p style="margin: 5px 0 0 0; color: #64748b; font-weight: bold;">Course ID: ${course.courseCode}</p>
      </div>
      <p>Access the feedback analytics through your Lecturer Dashboard.</p>
    `;
    return await this.sendEmail({ email: lecturer.email, subject: `Faculty Feedback: ${course.courseCode}`, html });
  }

  async sendLecturerCourseAssignmentEmail(lecturer, course) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">New Course Assignment</h2>
      <p>Dear ${lecturer.name},</p>
      <p>You have been assigned to teach the following course unit for the current term:</p>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-size: 18px; font-weight: 900; color: #1e3a8a;">${course.courseName}</p>
         <p style="margin: 5px 0 0 0; color: #64748b;"><strong>Course Code:</strong> ${course.courseCode}</p>
         <p style="margin: 5px 0 0 0; color: #64748b;"><strong>Semester:</strong> ${course.semester || 'N/A'}</p>
      </div>
      <p>Please review the syllabus and prepare your teaching resources in the Lecturer Portal.</p>
    `;
    return await this.sendEmail({ email: lecturer.email, subject: `New Teaching Assignment: ${course.courseCode}`, html });
  }

  async sendDeanApprovalRequestEmail(dean, requestType, details) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #4338ca; margin-top: 0;">Action Required from Dean</h2>
      <p>Dear ${dean.name},</p>
      <p>The following request requires your review and approval:</p>
      <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-size: 18px; font-weight: 900; color: #4338ca;">${requestType}</p>
         <p style="margin: 10px 0 0 0; color: #475569;">${details || 'Please review the request in your Dean Dashboard.'}</p>
      </div>
      <p>Please access the Dean portal to complete the approval workflow.</p>
    `;
    return await this.sendEmail({ email: dean.email, subject: `Dean Approval Needed: ${requestType}`, html });
  }

  // --- REGISTRAR NOTIFICATIONS ---
  async sendEnrollmentApprovalEmail(student, status) {
    const isApproved = status === 'active';
    const html = `
      <h2 style="font-size: 22px; font-weight: 950; color: #0891b2; margin-top: 0;">Official Registry Action</h2>
      <p>The Trincomalee Campus Registrar has finalized the status for student index <strong>${student.studentId}</strong>.</p>
      <div style="background: #ecfeff; border: 2px solid #0891b2; padding: 30px; border-radius: 20px; margin: 30px 0; text-align: center;">
         <p style="margin: 0; font-size: 12px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 1px;">Current Enrollment Status</p>
         <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 950; color: ${isApproved ? '#0891b2' : '#be123c'};">
            ${isApproved ? 'AUTHORIZED ✓' : 'DEACTIVATED ✕'}
         </p>
      </div>
      ${isApproved ? '<p style="font-weight: 700;">Complete your semester course registration within the next 48 hours.</p>' : '<p>Please report to the Registrar\'s office for status clarification.</p>'}
    `;
    return await this.sendEmail({ email: student.email, subject: `Official: Enrollment Application ${isApproved ? 'Approved' : 'Status Alert'}`, html });
  }

  // --- BURSAR NOTIFICATIONS ---
  async sendPaymentReconciliationEmail(student, finance) {
    const html = `
      <h2 style="font-size: 22px; font-weight: 950; color: #059669; margin-top: 0;">Financial Settlement Verified</h2>
      <p>Dear ${student.name}, your payment has been successfully cleared by the institutional bursary.</p>
      <div style="border: 2px solid #10b981; border-radius: 20px; padding: 30px; margin: 30px 0; background: #f0fdf4;">
         <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #10b981; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
               <p style="margin: 0; font-size: 10px; font-weight: 800; color: #059669;">RECEIPT NO</p>
               <p style="margin: 0; font-weight: bold;">EUSL/FIN/${finance._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 10px; font-weight: 800; color: #059669;">SETTLED DATE</p>
               <p style="margin: 0; font-weight: bold;">${new Date().toLocaleDateString()}</p>
            </div>
         </div>
         <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">VERIFIED AMOUNT</p>
         <p style="margin: 0; font-size: 42px; font-weight: 950; color: #059669;">$${finance.amount.toFixed(2)}</p>
      </div>
    `;
    return await this.sendEmail({ email: student.email, subject: `Bursary: Official Payment Receipt - ${finance.title}`, html });
  }

  // --- EXAM OFFICER NOTIFICATIONS ---
  async sendResultCertificationEmail(student, enrollment) {
    const html = `
      <div style="text-align: center; margin-bottom: 30px;">
         <span style="background: #4338ca; color: white; padding: 10px 20px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase;">Institutional Certification</span>
      </div>
      <h2 style="font-size: 22px; font-weight: 950; color: #1e1b4b; margin-top: 0; text-align: center;">Official Audit Finalized</h2>
      <p>The Trincomalee Campus Examination Board has officially certified the academic results for <strong>${student.studentId}</strong>.</p>
      <div style="background: #4338ca; padding: 40px; border-radius: 24px; color: white; margin: 30px 0; position: relative;">
         <p style="margin: 0; font-size: 11px; opacity: 0.8; font-weight: 800;">COURSE TRACE</p>
         <p style="margin: 5px 0 25px 0; font-size: 20px; font-weight: 900; line-height: 1.3;">${enrollment.course.courseName}</p>
         <div style="display: flex; gap: 40px; border-top: 1px solid rgba(255,255,255,0.2); pt: 25px;">
            <div>
               <p style="margin: 0; font-size: 10px; opacity: 0.8; font-weight: 800;">FINAL GRADE</p>
               <p style="margin: 0; font-size: 48px; font-weight: 950;">${enrollment.grade}</p>
            </div>
            <div style="border-left: 1px solid rgba(255,255,255,0.2); padding-left: 40px;">
               <p style="margin: 0; font-size: 10px; opacity: 0.8; font-weight: 800;">VERIFICATION</p>
               <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 800; color: #10b981;">CERTIFIED ✓</p>
            </div>
         </div>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center;">This transcript entry is now permanent and officially recognized by the Eastern University.</p>
    `;
    return await this.sendEmail({ email: student.email, subject: `Official Audit: Results Certified - Trincomalee Campus`, html });
  }

  // --- LIBRARIAN NOTIFICATIONS ---
  async sendLibraryOverdueEmail(student, book) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #ef4444; margin-top: 0;">Library Resource Overdue Alert</h2>
      <p>Dear ${student.name}, our records indicate that a borrowed resource is past its return date:</p>
      <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0 0 5px 0;"><strong>Accession Title:</strong> ${book.title}</p>
         <p style="margin: 0;"><strong>Due Date:</strong> <span style="color: #ef4444; font-weight: bold;">${new Date(book.dueDate).toLocaleDateString()}</span></p>
      </div>
      <p style="font-weight: 700;">Please return to the Central Library immediately to avoid secondary institutional penalties.</p>
    `;
    return await this.sendEmail({ email: student.email, subject: `Library Alert: Resource Overdue - ${book.title}`, html });
  }

  async sendLibraryReservationEmail(student, book) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Resource Reservation Available</h2>
      <p>Dear ${student.name}, the resource you reserved is now ready for collection:</p>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0;"><strong>Accession Title:</strong> ${book.title}</p>
      </div>
      <p>This item will be held at the circulation desk for 48 hours.</p>
    `;
    return await this.sendEmail({ email: student.email, subject: `Library: Reserved Item Available - ${book.title}`, html });
  }

  async sendLibraryNewAcquisitionEmail(user, book) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">New Library Resource Added</h2>
      <p>Dear ${user.name},</p>
      <p>The library has added a new resource that may be of interest to you:</p>
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0;"><strong>Title:</strong> ${book.title}</p>
         <p style="margin: 5px 0 0 0;"><strong>Author:</strong> ${book.author || 'Unknown'}</p>
         <p style="margin: 5px 0 0 0;"><strong>Category:</strong> ${book.category || 'General'}</p>
      </div>
      <p>Visit the Library Portal to reserve or borrow this resource.</p>
    `;
    return await this.sendEmail({ email: user.email, subject: `Library Update: New Resource Added - ${book.title}`, html });
  }

  // --- REGISTRAR MEDICAL NOTIFICATIONS ---
  async sendMedicalApprovalEmail(student, status, reason) {
    const isApproved = status === 'approved';
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Medical Certificate Adjudication</h2>
      <p>The Registrar's office has finalized the review of your medical excuse submission.</p>
      <div style="background: ${isApproved ? '#f0fdf4' : '#fff1f2'}; border: 1px solid ${isApproved ? '#bbfc' : '#fecaca'}; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: 800; color: ${isApproved ? '#166534' : '#991b1b'};">Status: ${status.toUpperCase()}</p>
         <p style="margin: 10px 0 0 0; font-size: 13px; font-style: italic;">"${reason || 'Review complete based on institutional health policies.'}"</p>
      </div>
    `;
    return await this.sendEmail({ email: student.email, subject: `Registrar: Medical Submission ${status.toUpperCase()}`, html });
  }

  // --- ACADEMIC STAFF DISPATCH ---
  async sendAssignmentDeadlineEmail(student, assignment) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 0;">Impending Assessment Deadline</h2>
      <p>Final reminder for the following assessment submission:</p>
      <div style="background: #f8fafc; border: 2px solid #1e3a8a; padding: 25px; border-radius: 16px; margin: 30px 0;">
         <p style="margin: 0 0 5px 0; font-weight: 800; color: #1e3a8a;">${assignment.title}</p>
         <p style="margin: 0; font-size: 13px; color: #64748b;">${assignment.courseCode} | Deadline: ${new Date(assignment.dueDate).toLocaleString()}</p>
      </div>
      <p style="font-size: 12px; color: #ef4444; text-align: center; font-weight: bold;">LATE SUBMISSIONS ARE SUBJECT TO INSTITUTIONAL PENALTIES.</p>
    `;
    return await this.sendEmail({ email: student.email, subject: `Alert: Assignment Deadline - ${assignment.title}`, html });
  }

  async sendCourseCancellationEmail(students, course, reason) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 0;">Lecture Cancellation Notice</h2>
      <p>The following academic session has been officially cancelled/rescheduled:</p>
      <div style="background: #fff1f2; border-left: 8px solid #dc2626; padding: 25px; border-radius: 4px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold;">Unit: ${course.courseName} (${course.courseCode})</p>
         <p style="margin: 10px 0 0 0; font-style: italic;">Reason: ${reason || 'Administrative Rescheduling.'}</p>
      </div>
      <p>Please check your course feed for the rescheduled timeline.</p>
    `;
    // For simplicity, we assume this is called for an array of emails if being sent to many
    for (const email of students) {
      await this.sendEmail({ email, subject: `CANCELLATION: ${course.courseCode} Session`, html });
    }
  }

  // --- SYSTEM ADMIN ---
  async sendSystemMaintenanceEmail(users, startTime, duration) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">System Security Maintenance</h2>
      <p>Official notice regarding upcoming University Portal downtime:</p>
      <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #cbd5e1;">
         <p style="margin: 0 0 10px 0;"><strong>Start Window:</strong> ${startTime}</p>
         <p style="margin: 0;"><strong>Expected Duration:</strong> ${duration}</p>
      </div>
      <p style="font-size: 13px; color: #64748b;">Access to the MIS, Student Records, and Faculty Portals will be restricted during this period.</p>
    `;
    for (const email of users) {
      await this.sendEmail({ email, subject: 'Infrastructure Notice: System Maintenance', html });
    }
  }

  async sendAdminAnnouncementEmail(users, announcement) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1f2937; margin-top: 0;">Administrative Announcement</h2>
      <p>${announcement.message}</p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-size: 16px; font-weight: 800; color: #1e3a8a;">${announcement.title}</p>
         ${announcement.details ? `<p style="margin: 10px 0 0 0; color: #475569;">${announcement.details}</p>` : ''}
      </div>
      <p style="font-size: 12px; color: #64748b;">Please follow any actions requested by the academic administration.</p>
    `;
    for (const email of users) {
      await this.sendEmail({ email, subject: `Administrative Notice: ${announcement.title}`, html });
    }
  }

  // --- SECURITY & ACCOUNT LIFECYCLE ---
  async sendLoginAlertEmail(user, loginData) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 0;">New Login Detected</h2>
      <p>Dear ${user.name}, we detected a successful login to your University Portal from a new location or device.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0 0 10px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
         <p style="margin: 0 0 10px 0;"><strong>Device/IP:</strong> ${loginData.ip || 'Unknown Terminal'}</p>
         <p style="margin: 0;"><strong>Location:</strong> ${loginData.location || 'Unauthorized Zone'}</p>
      </div>
      <p style="font-size: 13px; color: #ef4444; font-weight: bold;">If this was not you, please trigger a Password Reset immediately and alert the Campus Security Desk.</p>
    `;
    return await this.sendEmail({ email: user.email, subject: 'Security Alert: New Account Login', html });
  }

  async sendPasswordChangeConfirmEmail(user) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 0;">Password Integrity Verified</h2>
      <p>Security Notification: The password for your <strong>Trincomalee Campus</strong> MIS account was successfully updated.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbfc; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
         <p style="margin: 0; font-weight: 800; color: #059669;">IDENTITY PROTECTION ACTIVE ✓</p>
      </div>
    `;
    return await this.sendEmail({ email: user.email, subject: 'Security Notice: Password Updated Successfully', html });
  }

  async sendProfileUpdateEmail(user, fields) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Sensitive Profile Modification</h2>
      <p>Dear ${user.name}, the following core identification fields were recently modified in your profile:</p>
      <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #cbd5e1;">
         <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Modified Groups: ${fields.join(', ')}</p>
      </div>
      <p style="font-size: 12px; color: #64748b;">This automated audit notice ensures the integrity of your academic record.</p>
    `;
    return await this.sendEmail({ email: user.email, subject: 'Audit: Sensitive Profile Data Updated', html });
  }

  async sendRoleChangeEmail(user, oldRole, newRole) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #4338ca; margin-top: 0;">Institutional Privilege Elevation</h2>
      <p>Dear ${user.name}, your administrative access level within the University MIS has been officially updated.</p>
      <div style="background: #fafafa; border: 1px solid #e0e7ff; border-radius: 16px; padding: 30px; margin: 30px 0; display: flex; justify-content: space-between; align-items: center;">
         <div style="text-align: center; flex: 1;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 800;">PREVIOUS ROLE</p>
            <p style="margin: 5px 0 0 0; font-weight: bold; color: #64748b; text-transform: uppercase;">${oldRole}</p>
         </div>
         <div style="padding: 0 20px; color: #4338ca; font-weight: 950;">→</div>
         <div style="text-align: center; flex: 1;">
            <p style="margin: 0; font-size: 10px; color: #4338ca; font-weight: 800;">CURRENT PRIVILEGE</p>
            <p style="margin: 5px 0 0 0; font-weight: 900; color: #4338ca; text-transform: uppercase;">${newRole}</p>
         </div>
      </div>
      <p style="font-size: 13px; color: #64748b;">Your portal navigation tools will be updated upon your next session initialization.</p>
    `;
    return await this.sendEmail({ email: user.email, subject: 'Official: Institutional Role Assignment Updated', html });
  }

  async sendAccountDeletionEmail(user) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #be123c; margin-top: 0;">Access Termination Notice</h2>
      <p>Official communication for <strong>${user.name}</strong>.</p>
      <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; color: #be123c; font-weight: bold;">Your university dashboard and identity records have been officially scheduled for decommission/deletion.</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">Ref: Institutional Policy on Account Lifecycle Management.</p>
    `;
    return await this.sendEmail({ email: user.email, subject: 'URGENT: Portal Access Termination Notice', html });
  }

  async sendActivityNotification(user, activity) {
    const html = `
      <h2 style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin-top: 0;">MIS Activity Logged</h2>
      <p>Dear ${user.name}, we logged a new activity on your account:</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0;"><strong>Activity:</strong> ${activity.title || 'System Interaction'}</p>
         <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">${activity.description || ''}</p>
      </div>
    `;
    return await this.sendEmail({ email: user.email, subject: `Activity Notice: ${activity.title || 'Account Update'}`, html });
  }

  // --- BULK EXAM RESULT NOTIFICATIONS ---
  /**
   * Generate PDF with all exam results for a student
   * @param {Object} student - Student object with name, studentId, email
   * @param {Array} results - Array of result objects with subject, grade, marks, examType, year, semester
   * @returns {Buffer} PDF buffer
   */
  async generateResultsPDF(student, results) {
    const PDFDocument = require('pdfkit');

    return new Promise((resolve, reject) => {
      try {
        console.log('Starting PDF generation for student:', student.name, 'with', results.length, 'results');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

        doc.on('end', () => {
          console.log('PDF generation completed, buffer size:', chunks.length);
          try {
            const buffer = Buffer.concat(chunks);
            console.log('Final PDF buffer length:', buffer.length);
            if (buffer.length === 0) {
              reject(new Error('Generated PDF buffer is empty'));
            } else {
              resolve(buffer);
            }
          } catch (concatError) {
            console.error('Error concatenating PDF chunks:', concatError);
            reject(concatError);
          }
        });

        const failedResults = results.filter(result => {
          const grade = (result.grade || '').toString().trim().toUpperCase();
          return result.status === 'fail' || grade === 'F' || grade === 'E';
        });

        const isFailed = result => {
          const grade = (result.grade || '').toString().trim().toUpperCase();
          return result.status === 'fail' || grade === 'F' || grade === 'E';
        };

        const addTableHeader = () => {
          const headerTop = doc.y;
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f2937');
          doc.text('Code', 50, headerTop);
          doc.text('Subject', 95, headerTop);
          doc.text('Year', 280, headerTop);
          doc.text('Sem', 330, headerTop);
          doc.text('Exam', 370, headerTop);
          doc.text('Cred', 435, headerTop);
          doc.text('Grade', 495, headerTop);
          doc.moveTo(50, headerTop + 14).lineTo(550, headerTop + 14).stroke();
          doc.moveDown(1);
        };

        // Header
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('Academic Transcript', { align: 'center' });
        doc.fontSize(10).font('Helvetica').fillColor('#475569').text('Trincomalee Campus, Eastern University Of Sri Lanka', { align: 'center' });
        doc.moveDown(1);

        // Simple student info
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(`Student: ${student.name || 'N/A'}`, 50);
        doc.fontSize(10).font('Helvetica').fillColor('#475569').text(`ID: ${student.studentId || 'N/A'} | Department: ${student.department || 'N/A'}`, 50);
        doc.moveDown(1);

        // Year & Semester-wise GPA summary
        const termStats = {};
        results.forEach(result => {
          const year = result.year || 'Unknown Year';
          const semester = result.semester || 'Unknown Semester';
          const key = `${year} - Sem ${semester}`;
          if (!termStats[key]) {
            termStats[key] = { credits: 0, gradePoints: 0, count: 0 };
          }
          const credit = (result.subject && result.subject.credits) || 0;
          termStats[key].credits += credit;
          termStats[key].gradePoints += credit * (result.gradePoint || 0);
          termStats[key].count += 1;
        });

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Year & Semester-wise GPA');
        doc.moveDown(0.4);
        Object.entries(termStats).forEach(([term, data]) => {
          const termGPA = data.credits > 0 ? (data.gradePoints / data.credits).toFixed(2) : 'N/A';
          doc.fontSize(9).font('Helvetica').fillColor('#111827').text(`${term} — GPA: ${termGPA}`, { indent: 10 });
        });
        doc.moveDown(0.8);

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('Detailed Results', { underline: true });
        doc.moveDown(0.4);

        const groupedByTerm = {};
        results.forEach(result => {
          const year = result.year || 'Unknown Year';
          const semester = result.semester || 'Unknown Semester';
          const key = `${year} - Semester ${semester}`;
          if (!groupedByTerm[key]) groupedByTerm[key] = [];
          groupedByTerm[key].push(result);
        });

        let overallCredits = 0;
        let overallGradePoints = 0;
        const rowHeight = 18;

        Object.entries(groupedByTerm).forEach(([termLabel, termResults], sectionIndex) => {
          if (sectionIndex > 0) {
            doc.addPage();
          }

          doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(termLabel);
          doc.moveDown(0.3);
          addTableHeader();
          let currentY = doc.y;

          termResults.forEach(result => {
            if (currentY > 720) {
              doc.addPage();
              doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`${termLabel} (continued)`);
              doc.moveDown(0.3);
              addTableHeader();
              currentY = doc.y;
            }

            const subject = result.subject || {};
            const subjectName = subject.name || 'N/A';
            const subjectCode = subject.code || 'N/A';
            const examType = result.examType ? result.examType.toUpperCase() : 'N/A';
            const grade = result.grade || 'N/A';
            const credits = subject.credits || 0;
            const failed = isFailed(result);

            doc.fillColor('#0f172a').font('Helvetica');
            doc.text(subjectCode, 50, currentY);
            doc.text(subjectName, 95, currentY);
            doc.text(result.year || 'N/A', 280, currentY);
            doc.text(result.semester ? result.semester.toString() : 'N/A', 330, currentY);
            doc.text(examType, 370, currentY);
            doc.text(credits.toString(), 435, currentY);

            if (failed) {
              doc.fillColor('#b91c1c').font('Helvetica-Bold').text(grade.toString(), 495, currentY);
            } else {
              doc.fillColor('#0f172a').font('Helvetica').text(grade.toString(), 495, currentY);
            }

            if (result.gradePoint !== undefined && credits) {
              overallCredits += credits;
              overallGradePoints += credits * result.gradePoint;
            }

            currentY += rowHeight;
          });

          doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
          currentY += 18;

          const termCredits = termResults.reduce((sum, r) => sum + ((r.subject && r.subject.credits) || 0), 0);
          const termGradePoints = termResults.reduce((sum, r) => sum + (((r.subject && r.subject.credits) || 0) * (r.gradePoint || 0)), 0);
          const termGPA = termCredits > 0 ? (termGradePoints / termCredits).toFixed(2) : 'N/A';

          doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(`Term GPA: ${termGPA}    Credits: ${termCredits}`, 50, currentY);
          doc.moveDown(1);
        });

        const overallGPA = overallCredits > 0 ? (overallGradePoints / overallCredits).toFixed(2) : 'N/A';

        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('CUMULATIVE TRANSCRIPT SUMMARY', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#0f172a');
        doc.text(`Total Published Subjects: ${results.length}`);
        doc.text(`Total Credits Earned: ${overallCredits}`);
        doc.text(`Cumulative GPA: ${overallGPA}`);

        if (failedResults.length) {
          if (doc.y + failedResults.length * 14 + 60 > 760) {
            doc.addPage();
          }

          doc.moveDown(1);
          doc.fillColor('#b91c1c').font('Helvetica-Bold').text('FAILED SUBJECTS ALERT', { continued: false });
          doc.moveDown(0.2);
          doc.fontSize(9).font('Helvetica').fillColor('#991b1b').text(`The following ${failedResults.length} subject${failedResults.length === 1 ? '' : 's'} require attention and repeat action:`, { indent: 10 });
          doc.moveDown(0.2);

          failedResults.forEach((result) => {
            const subject = result.subject || {};
            doc.text(`• ${subject.code || 'N/A'} - ${subject.name || 'N/A'} | ${result.year || 'N/A'} Sem ${result.semester || 'N/A'} | Grade: ${result.grade || 'N/A'}`, { indent: 15 });
          });

          doc.fillColor('#0f172a').font('Helvetica');
          doc.moveDown(1);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(7).font('Helvetica').fillColor('#475569').text('This is an official transcript of examination results from Eastern University of Sri Lanka, Trincomalee Campus.', { align: 'center' });
        doc.text('For verification, contact: Academic Registry | mis-support@esn.ac.lk', { align: 'center' });
        doc.text(`Generation Date & Time: ${new Date().toLocaleString()}`, { align: 'center' });

        console.log('Ending PDF document');
        doc.end();
      } catch (error) {
        console.error('Error in PDF generation setup:', error);
        reject(error);
      }
    });
  }



  // ================================
  // ENHANCED REPEAT REGISTRATION WORKFLOW EMAILS
  // ================================

  /**
   * Send notification to HOD when student submits repeat registration
   */
  async sendRepeatRegistrationSubmissionNotification(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Repeat Subject Application Submitted</h2>
      <p>A student from your department has submitted a repeat subject registration application requiring your approval.</p>

      <div style="background: #f1f5f9; border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">STUDENT DETAILS</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">${student.name}</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">ID: ${student.studentId}</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">SUBJECT</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">${subject.name}</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">Code: ${subject.code}</p>
            </div>
         </div>
         <p style="margin: 15px 0 0 0; font-size: 13px;"><strong>Reason for Repeat:</strong> ${registration.reason}</p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Action Required: Review and approve/reject this application in your HOD Dashboard.</p>
      </div>

      <p>Please log in to your dashboard to process this application.</p>
    `;

    // Find HOD email - this would need to be implemented based on department
    // For now, we'll assume HOD emails are stored or can be retrieved
    const hodEmail = `hod@${student.department.toLowerCase()}.eusl.ac.lk`; // Placeholder
    return await this.sendEmail({ email: hodEmail, subject: `HOD Review Required: Repeat Registration - ${student.studentId}`, html });
  }

  /**
   * Send notification to student when HOD approves application
   */
  async sendRepeatApplicationHODApproved(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">HOD Approval Received</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration application has been <strong style="color: #059669;">APPROVED</strong> by your Head of Department.</p>

      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #166534;">Subject Approved for Repeat:</p>
         <p style="margin: 10px 0; font-size: 18px; font-weight: 900; color: #166534;">${subject.name} (${subject.code})</p>
         <p style="margin: 0; font-size: 13px; color: #4b5563;">Application ID: ${registration._id.toString().slice(-8).toUpperCase()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Your application is now with the Registrar for final approval</li>
            <li>You will receive another notification once the Registrar reviews it</li>
            <li>After Registrar approval, Exam Officer will allocate fees</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Registration: HOD Approved - ${subject.code}`, html });
  }

  /**
   * Send notification to student when application is rejected
   */
  async sendRepeatApplicationRejected(registration, rejectedBy, reason) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #dc2626; margin-top: 0;">Registration Application Rejected</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>We regret to inform you that your repeat subject registration application has been <strong style="color: #dc2626;">REJECTED</strong>.</p>

      <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #991b1b;">Subject: ${subject.name} (${subject.code})</p>
         <p style="margin: 10px 0 0 0; font-size: 13px; color: #7f1d1d;">Rejected By: ${rejectedBy}</p>
         <p style="margin: 5px 0 0 0; font-size: 13px; color: #7f1d1d;">Application ID: ${registration._id.toString().slice(-8).toUpperCase()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Reason for Rejection:</p>
         <p style="margin: 10px 0; font-style: italic;">"${reason || 'No specific reason provided. Please contact the relevant authority for clarification.'}"</p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Contact the ${rejectedBy} for detailed explanation</li>
            <li>You may submit a new application if eligible</li>
            <li>Check eligibility requirements before re-applying</li>
         </ul>
      </div>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Registration: Rejected - ${subject.code}`, html });
  }

  /**
   * Send notification to student when Registrar approves
   */
  async sendRepeatApplicationRegistrarApproved(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Registrar Approval Received</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration application has received <strong style="color: #059669;">REGISTRAR APPROVAL</strong>.</p>

      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #166534;">Subject Approved for Repeat:</p>
         <p style="margin: 10px 0; font-size: 18px; font-weight: 900; color: #166534;">${subject.name} (${subject.code})</p>
         <p style="margin: 0; font-size: 13px; color: #4b5563;">Application ID: ${registration._id.toString().slice(-8).toUpperCase()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Application forwarded to Exam Officer for review</li>
            <li>After Exam Officer review, it goes to Admin for final approval</li>
            <li>Once approved by all authorities, Exam Officer will allocate repeat examination fees</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Registration: Registrar Approved - ${subject.code}`, html });
  }

  /**
   * Send notification to student when Exam Officer reviews application
   */
  async sendRepeatApplicationExamOfficerReviewed(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Exam Officer Review Completed</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration application has been reviewed by the Exam Officer and forwarded to Admin for final approval.</p>

      <div style="background: #f1f5f9; border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e3a8a;">Subject: ${subject.name} (${subject.code})</p>
         <p style="margin: 10px 0; font-size: 13px; color: #4b5563;">Application ID: ${registration._id.toString().slice(-8).toUpperCase()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Application is now with Admin for final approval</li>
            <li>Once Admin approves, Exam Officer will allocate repeat examination fees</li>
            <li>You will receive fee details and payment instructions</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Registration: Exam Officer Reviewed - ${subject.code}`, html });
  }

  /**
   * Send notification to student when Admin approves application
   */
  async sendRepeatApplicationAdminApproved(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Final Admin Approval Received</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration application has received <strong style="color: #059669;">FINAL ADMIN APPROVAL</strong>.</p>

      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #166534;">Subject Approved for Repeat:</p>
         <p style="margin: 10px 0; font-size: 18px; font-weight: 900; color: #166534;">${subject.name} (${subject.code})</p>
         <p style="margin: 0; font-size: 13px; color: #4b5563;">Application ID: ${registration._id.toString().slice(-8).toUpperCase()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Exam Officer will now allocate repeat examination fees</li>
            <li>You will receive fee details and payment instructions via email</li>
            <li>After payment, Exam Officer will verify and schedule your exam</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Registration: Final Admin Approved - ${subject.code}`, html });
  }

  /**
   * Send fee due notification to student
   */
  async sendRepeatFeeDueNotification(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Repeat Examination Fee Notice</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat subject registration has been approved. Please pay the repeat examination fee to proceed.</p>

      <div style="background: #f1f5f9; border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">FEE DETAILS</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">Repeat Examination Fee</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">Subject: ${subject.name} (${subject.code})</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">AMOUNT DUE</p>
               <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #1e3a8a;">LKR ${registration.repeatFeeAmount.toLocaleString()}</p>
            </div>
         </div>
         <div style="border-top: 1px solid #cbd5e1; padding-top: 15px;">
            <p style="margin: 0; font-size: 13px;"><strong>Invoice Number:</strong> ${registration.invoiceNumber}</p>
            <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Due Date:</strong> Within 7 days</p>
         </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Payment Instructions:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Pay online via the University Payment Portal</li>
            <li>Upload payment receipt/proof in your student dashboard</li>
            <li>Include the Invoice Number in payment reference</li>
            <li>Payment must be verified by Exam Officer before exam scheduling</li>
         </ul>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Important Notes:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 12px;">
            <li>Late payments may result in exam scheduling delays</li>
            <li>Keep payment proof safe for verification</li>
            <li>Contact bursar office if you face payment difficulties</li>
         </ul>
      </div>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Exam Fee Due: ${registration.invoiceNumber} - LKR ${registration.repeatFeeAmount}`, html });
  }

  /**
   * Send notification to Exam Officer when student submits payment proof
   */
  async sendRepeatPaymentSubmittedNotification(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Payment Proof Submitted - Verification Required</h2>
      <p>A student has submitted payment proof for repeat examination fees requiring your verification.</p>

      <div style="background: #f1f5f9; border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">STUDENT DETAILS</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">${student.name}</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">ID: ${student.studentId}</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">PAYMENT</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">LKR ${registration.repeatFeeAmount.toLocaleString()}</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">Invoice: ${registration.invoiceNumber}</p>
            </div>
         </div>
         <p style="margin: 15px 0 0 0; font-size: 13px;"><strong>Subject:</strong> ${subject.name} (${subject.code})</p>
         <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>Payment Reference:</strong> ${registration.paymentReference || 'Not provided'}</p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Action Required: Verify payment proof and approve/reject in your Exam Officer Dashboard.</p>
      </div>

      <p>Please log in to your dashboard to process this payment verification.</p>
    `;

    // This would need to be sent to the actual Exam Officer email
    const examOfficerEmail = 'exam.officer@eusl.ac.lk'; // Placeholder
    return await this.sendEmail({ email: examOfficerEmail, subject: `Payment Verification Required: ${student.studentId} - ${registration.invoiceNumber}`, html });
  }

  /**
   * Send notification to student when payment is verified
   */
  async sendRepeatPaymentVerifiedNotification(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #059669; margin-top: 0;">Payment Verified Successfully</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat examination fee payment has been <strong style="color: #059669;">VERIFIED</strong> and approved.</p>

      <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
               <p style="margin: 0; font-weight: bold; color: #166534;">Payment Verified</p>
               <p style="margin: 5px 0 0 0; font-size: 13px; color: #4b5563;">Invoice: ${registration.invoiceNumber}</p>
               <p style="margin: 0; font-size: 13px; color: #4b5563;">Amount: LKR ${registration.repeatFeeAmount.toLocaleString()}</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 24px; font-weight: 900; color: #166534;">✓ VERIFIED</p>
            </div>
         </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Exam Officer will now schedule your repeat examination</li>
            <li>You will receive exam date, time, and venue details via email</li>
            <li>Prepare for the examination according to the schedule</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Payment Verified: Repeat Exam Scheduled Soon - ${subject.code}`, html });
  }

  /**
   * Send notification to student when payment is rejected
   */
  async sendRepeatPaymentRejectedNotification(registration, reason) {
    const student = registration.student;
    const subject = registration.subject;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #dc2626; margin-top: 0;">Payment Verification Failed</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat examination fee payment proof has been <strong style="color: #dc2626;">REJECTED</strong> during verification.</p>

      <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <p style="margin: 0; font-weight: bold; color: #991b1b;">Payment Rejected</p>
         <p style="margin: 10px 0; font-size: 13px; color: #7f1d1d;">Invoice: ${registration.invoiceNumber}</p>
         <p style="margin: 0; font-size: 13px; color: #7f1d1d;">Amount: LKR ${registration.repeatFeeAmount.toLocaleString()}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Reason for Rejection:</p>
         <p style="margin: 10px 0; font-style: italic;">"${reason || 'Payment proof is invalid or insufficient. Please check payment details and resubmit.'}"</p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Next Steps:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Review the rejection reason carefully</li>
            <li>Make payment again if needed (use correct reference)</li>
            <li>Upload new payment proof in your dashboard</li>
            <li>Contact the bursar office for payment assistance</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please check your dashboard for detailed status updates.</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Payment Rejected: Resubmit Proof - ${registration.invoiceNumber}`, html });
  }

  /**
   * Send exam schedule notification to student
   */
  async sendRepeatExamScheduleNotification(registration) {
    const student = registration.student;
    const subject = registration.subject;
    const examSlot = registration.allocatedExamSlot;
    const html = `
      <h2 style="font-size: 22px; font-weight: 900; color: #1e3a8a; margin-top: 0;">Repeat Examination Scheduled</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your repeat examination has been scheduled. Please find the details below.</p>

      <div style="background: #f1f5f9; border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; margin: 30px 0;">
         <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">Examination Details</p>
         </div>

         <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">SUBJECT</p>
               <p style="margin: 5px 0 0 0; font-weight: bold;">${subject.name}</p>
               <p style="margin: 0; font-size: 13px; color: #64748b;">Code: ${subject.code}</p>
            </div>
            <div style="text-align: right;">
               <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">EXAM CODE</p>
               <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${examSlot.examCode}</p>
            </div>
         </div>

         <div style="border-top: 1px solid #cbd5e1; padding-top: 15px;">
            <div style="display: flex; justify-content: space-around; text-align: center;">
               <div>
                  <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">DATE</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${new Date(examSlot.date).toLocaleDateString()}</p>
               </div>
               <div>
                  <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">TIME</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${examSlot.time}</p>
               </div>
               <div>
                  <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1e3a8a;">VENUE</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${examSlot.venue}</p>
               </div>
            </div>
         </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #856404;">Important Examination Instructions:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Report to the examination hall 15 minutes before the scheduled time</li>
            <li>Bring your student ID card and admission card</li>
            <li>Electronic devices are strictly prohibited</li>
            <li>Late arrival may result in denial of entry</li>
         </ul>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 0; font-weight: bold; color: #1e293b;">Contact Information:</p>
         <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 12px;">
            <li>Exam Officer: exam.officer@eusl.ac.lk</li>
            <li>Academic Registry: registry@eusl.ac.lk</li>
            <li>Emergency: +94 123 456 789</li>
         </ul>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; font-weight: bold;">Best of luck with your examination!</p>
    `;

    return await this.sendEmail({ email: student.email, subject: `Repeat Exam Scheduled: ${examSlot.examCode} - ${new Date(examSlot.date).toLocaleDateString()}`, html });
  }

  // --- RESULT PDF & EMAIL NOTIFICATION ---
  /**
   * Generate and send result PDF via email with downloadable link
   * @param {Object} student - Student object with name, email, studentId
   * @param {Object} result - Result object with subject, grade, marks, year, semester, examType
   * @returns {Promise<Object>} - Returns { filePath, fileName, pdfUrl }
   */
  async sendResultPDFEmail(student, result) {
    const fs = require('fs');
    const path = require('path');
    const Result = require('../models/result');

    return new Promise(async (resolve, reject) => {
      try {
        if (!student || !student.email || !student.email.includes('@')) {
          console.warn('Student does not have a valid email or student object is invalid:', student?._id || 'unknown');
          return reject(new Error('Invalid student email'));
        }
        // Create uploads/results directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../uploads/results');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Load all results for the student to generate a complete transcript
        const studentResults = await Result.find({ student: student._id })
          .populate('subject', 'name code credits')
          .sort({ year: 1, semester: 1, examType: 1 });

        if (!studentResults || studentResults.length === 0) {
          return reject(new Error('No results found for student to generate transcript'));
        }

        const timestamp = Date.now();
        const fileName = `transcript-${student.studentId || student._id}-${timestamp}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const pdfBuffer = await this.generateResultsPDF(student, studentResults);
        fs.writeFileSync(filePath, pdfBuffer);

        const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5001';
        const pdfUrl = `${baseUrl.replace(/\/$/, '')}/api/results/download/${fileName}`;
        const html = `
          <h2 style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 0; text-align: center;">Official Academic Transcript Ready</h2>
          <p style="font-size: 16px; margin: 20px 0;">Dear <strong>${student.name}</strong>,</p>
          <p>Your official academic transcript is now available as a single PDF document. This transcript contains all published subjects and grades for your record.</p>
          <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 30px; border-radius: 16px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 15px 0; font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase;">Attached: Full Academic Transcript</p>
            <p style="margin: 0; font-size: 13px; color: #475569;">Includes ${studentResults.length} published subject${studentResults.length === 1 ? '' : 's'} across all recorded semesters.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase;">📥 Download Transcript</a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 20px 0;">For official transcript verification, please contact the Academic Registry.</p>
        `;

        const mailOptions = {
          from: `"Trincomalee Campus, Eastern University Of Sri Lanka" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `Official Academic Transcript - ${student.name}`,
          html: `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px; text-align: center;">
                 <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                    <tr>
                      <td align="center">
                        <center>
                          <img src="https://upload.wikimedia.org/wikipedia/en/a/a0/EUSL_logo2.png" alt="EUSL Logo" width="120" style="width: 120px; height: auto; display: block; margin: 0 auto;">
                        </center>
                      </td>
                    </tr>
                 </table>
                 <h1 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; line-height: 1.5; text-align: center;">
                    Trincomalee Campus<br/>
                    <span style="font-weight: 400; font-size: 14px; opacity: 0.8;">Eastern University of Sri Lanka</span>
                 </h1>
              </div>
              <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
                 ${html}
              </div>
              <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                 <p style="margin: 0; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">Management Information System | Academic Registry</p>
                 <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">&copy; 2026 Trincomalee Campus, EUSL. Support: mis-support@esn.ac.lk</p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Result PDF email sent successfully:', info.messageId);

        resolve({
          filePath: filePath,
          fileName: fileName,
          pdfUrl: pdfUrl,
          messageId: info.messageId,
          success: true
        });
      } catch (error) {
        console.error('Error generating or sending transcript PDF email:', error);
        reject(error);
      }
    });
  }
}

module.exports = new EmailService();
