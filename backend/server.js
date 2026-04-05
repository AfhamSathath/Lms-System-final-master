const path = require('path');
const dotenv = require('dotenv');
// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoose = require('mongoose');

const courseRoutes = require('./routes/courseroutes');
const resultRoutes = require('./routes/resultroutes');
const fileroutes = require('./routes/fileroutes');
const notificationRoutes = require('./routes/notificationroutes');
const timetableRoutes = require('./routes/timetableroutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userroutes = require('./routes/userroutes');
const authRoutes = require('./routes/authroutes');
const lecturerAssignmentRoutes = require('./routes/lecturerAssignmentRoutes');
const subjectFileRoutes = require('./routes/subjectFileRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const financeRoutes = require('./routes/financeRoutes');
const repeatExamRoutes = require('./routes/repeatExamRoutes');
const repeatSubjectRegistrationRoutes = require('./routes/repeatSubjectRegistrationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const examOfficerDashboardRoutes = require('./routes/examOfficerDashboardRoutes');
const bursarDashboardRoutes = require('./routes/bursarDashboardRoutes');

const app = express();

// Connect to database
require('./config/database')();

// ================= CORS CONFIGURATION =================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Sanitize data
app.use(mongoSanitize());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/subjects', courseRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/files', fileroutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userroutes);
app.use('/api/auth', authRoutes);
app.use('/api/lecturer-assignments', lecturerAssignmentRoutes);
app.use('/api/subject-files', subjectFileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/repeatexams', repeatExamRoutes);
app.use('/api/repeat-registration', repeatSubjectRegistrationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exam-officer', examOfficerDashboardRoutes);
app.use('/api/bursar', bursarDashboardRoutes);

// Error handler
const errorHandler = require('./middleware/error');
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Server Status: RUNNING`);
    console.log(`==================================================`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    console.log(`==================================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});