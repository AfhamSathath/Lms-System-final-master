import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, FileText, Eye, EyeOff } from 'lucide-react';

/**
 * REPEAT SUBJECT REGISTRATION FORM
 * Real-world scenario-based workflow inspired by University of Moratuwa MIS
 * 
 * Features:
 * - Multi-step form with validation
 * - Draft save functionality
 * - Workflow tracking
 * - Real-time status updates
 */

const RepeatSubjectRegistrationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Select Subject, 2: Confirm Details, 3: Review & Submit
  const [eligibleSubjects, setEligibleSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [repeatReason, setRepeatReason] = useState('FAILED');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch eligible subjects
  useEffect(() => {
    const fetchEligibleSubjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/repeat-registration/eligible-subjects`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setEligibleSubjects(response.data.eligibleSubjects || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load eligible subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleSubjects();
  }, []);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setError('');
    setStep(2);
  };

  const handleBackToSelection = () => {
    setStep(1);
    setSelectedSubject(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/repeat-registration/draft`,
        {
          subject: selectedSubject.subjectId,
          repeatReason,
          additionalComments: comments
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSuccess('Draft saved! You can review and submit anytime.');
      setTimeout(() => {
        navigate('/repeat-subjects');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    // First save draft, then submit
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/repeat-registration/draft`,
        {
          subject: selectedSubject.subjectId,
          repeatReason,
          additionalComments: comments
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Then submit the draft
      const registrationId = response.data.registration._id;
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/repeat-registration/${registrationId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSuccess('✓ Application submitted successfully! Waiting for HOD approval.');
      setTimeout(() => {
        navigate('/repeat-subjects');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 1: SELECT SUBJECT
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Repeat Subject Registration
            </h1>
            <p className="text-blue-200">
              Eastern University of Sri Lanka - Trincomalee Campus
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <p className="ml-3 text-white font-semibold">Select Subject</p>
            </div>
            <div className="flex-1 border-t-2 border-gray-600 mx-3 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <p className="ml-3 text-gray-400">Confirm Details</p>
            </div>
            <div className="flex-1 border-t-2 border-gray-600 mx-3 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <p className="ml-3 text-gray-400">Review & Submit</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mt-0.5 mr-3" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <div className="flex items-start">
                <CheckCircle className="text-green-500 mt-0.5 mr-3" size={20} />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg text-blue-900 mb-2">📋 Information</h3>
            <p className="text-blue-800 mb-3">
              You can repeat a subject only if you have received a failing or low grade (F, E, D, D+, C-).
              Select the subject you wish to repeat below.
            </p>
            <div className="bg-white bg-opacity-60 p-3 rounded text-sm text-blue-700">
              <strong>Workflow:</strong> Submit → HOD Approval → Registrar Approval → Fee Payment → Exam Schedule
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white mt-4">Loading eligible subjects...</p>
            </div>
          ) : eligibleSubjects.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Subjects Available</h3>
              <p className="text-gray-600">
                You don't currently have any subjects eligible for repetition. 
                Keep in mind that you can only repeat subjects with failing or low grades.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {eligibleSubjects.map((subject) => (
                <div
                  key={subject.subjectId}
                  className="bg-white rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-orange-500"
                  onClick={() => handleSelectSubject(subject)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">
                        {subject.subjectCode}
                      </h4>
                      <p className="text-gray-600 mt-1">{subject.subjectName}</p>
                      <div className="mt-3 flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Credits:</span>
                          <span className="ml-2 font-semibold text-gray-900">{subject.credits}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Previous Grade:</span>
                          <span className="ml-2 font-bold text-red-600">{subject.previousGrade}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Marks:</span>
                          <span className="ml-2 font-semibold text-gray-900">{subject.previousMarks}</span>
                        </div>
                      </div>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 2: CONFIRM DETAILS
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Confirm Details</h1>
            <p className="text-blue-200">Step 2 of 3</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <p className="ml-3 text-white font-semibold text-sm">Select Subject</p>
            </div>
            <div className="flex-1 border-t-2 border-green-500 mx-2 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <p className="ml-3 text-white font-semibold text-sm">Confirm Details</p>
            </div>
            <div className="flex-1 border-t-2 border-gray-600 mx-2 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <p className="ml-3 text-gray-400 text-sm">Review & Submit</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <AlertCircle className="inline text-red-500 mr-2" size={16} />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Subject Summary */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Selected Subject</h3>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Subject Code</p>
                  <p className="text-xl font-bold text-gray-900">{selectedSubject.subjectCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subject Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedSubject.subjectName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Credits</p>
                  <p className="text-lg font-bold text-gray-900">{selectedSubject.credits}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Previous Grade</p>
                  <p className="text-lg font-bold text-red-600">{selectedSubject.previousGrade}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-6">Application Details</h3>

            {/* Reason for Repeat */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Reason for Repetition <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 border-gray-200 rounded cursor-pointer hover:border-blue-500 transition-all" style={{borderColor: repeatReason === 'FAILED' ? '#3b82f6' : ''}}>
                  <input
                    type="radio"
                    value="FAILED"
                    checked={repeatReason === 'FAILED'}
                    onChange={(e) => setRepeatReason(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-900">Failed Subject (Grade F)</span>
                </label>
                <label className="flex items-center p-3 border-2 border-gray-200 rounded cursor-pointer hover:border-blue-500 transition-all" style={{borderColor: repeatReason === 'GRADE_IMPROVEMENT' ? '#3b82f6' : ''}}>
                  <input
                    type="radio"
                    value="GRADE_IMPROVEMENT"
                    checked={repeatReason === 'GRADE_IMPROVEMENT'}
                    onChange={(e) => setRepeatReason(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-900">Grade Improvement (D/D+/C-)</span>
                </label>
              </div>
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Additional Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional: Explain your reasons for repeating this subject..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
              />
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> The repeat fee of LKR 2,500 is mandatory if your application is approved.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <button
                onClick={handleBackToSelection}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                disabled={submitting}
              >
                ← Back
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  disabled={submitting}
                >
                  Review & Submit →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: REVIEW & SUBMIT
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Review & Submit</h1>
            <p className="text-blue-200">Step 3 of 3 - Final Review</p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <p className="ml-3 text-white font-semibold text-sm">Select Subject</p>
            </div>
            <div className="flex-1 border-t-2 border-green-500 mx-2 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <p className="ml-3 text-white font-semibold text-sm">Confirm Details</p>
            </div>
            <div className="flex-1 border-t-2 border-blue-500 mx-2 mt-5"></div>
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <p className="ml-3 text-white font-semibold text-sm">Review & Submit</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <AlertCircle className="inline text-red-500 mr-2" size={16} />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <CheckCircle className="inline text-green-500 mr-2" size={16} />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Application Summary</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-blue-500 hover:text-blue-700 font-semibold text-sm flex items-center gap-2"
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-gray-600">Subject</p>
                <p className="text-xl font-bold text-gray-900">{selectedSubject.subjectCode}</p>
                <p className="text-gray-700">{selectedSubject.subjectName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-semibold text-gray-900">
                    {repeatReason === 'FAILED' ? 'Failed Subject' : 'Grade Improvement'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Previous Grade</p>
                  <p className="font-bold text-red-600 text-lg">{selectedSubject.previousGrade}</p>
                </div>
              </div>

              {comments && (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="text-gray-900 italic mt-1">"{comments}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Cost Information</h3>
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Repeat Subject Fee</span>
                <span className="font-bold text-lg text-gray-900">LKR 2,500</span>
              </div>
              <p className="text-sm text-gray-600">
                This fee is payable after your application is approved by HOD and Registrar.
              </p>
            </div>
          </div>

          {/* Workflow Timeline */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Expected Workflow</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Clock size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Submit Application</p>
                  <p className="text-sm text-gray-600">Your application will be submitted for HOD review</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">HOD Approval (3-5 days)</p>
                  <p className="text-sm text-gray-600">Department head will review and approve your request</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Registrar Approval (2-3 days)</p>
                  <p className="text-sm text-gray-600">Registrar office will finalize authorization</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Fee Payment (7-14 days allowed)</p>
                  <p className="text-sm text-gray-600">Pay the repeat fee via the Student Portal</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Exam Scheduling</p>
                  <p className="text-sm text-gray-600">Your exam date will be allocated and notified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 border border-gray-200 rounded p-6 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 text-blue-500" required />
              <span className="text-sm text-gray-700">
                I confirm that I have reviewed all details and understand the workflow, fees, and deadlines. 
                I authorize the submission of this repeat subject application.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
              disabled={submitting}
            >
              ← Back
            </button>

            <button
              onClick={handleSubmitApplication}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit Application'}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default RepeatSubjectRegistrationForm;
