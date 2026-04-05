import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiMessageSquare, FiStar, FiSend, FiCheckCircle, FiAlertCircle, FiBookOpen, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StudentFeedback = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    teachingQuality: 5,
    courseContent: 5,
    resourcesAvailability: 5,
    overallExperience: 5,
    comments: '',
    isAnonymous: false
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [enrollRes, feedbackRes] = await Promise.all([
        api.get(`/api/enrollments/student/${user.id}`),
        api.get('/api/feedback/my')
      ]);
      setEnrollments(enrollRes.data.enrollments || []);
      setFeedbacks(feedbackRes.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  const hasSubmitted = (courseId) => feedbacks.some(f => f.course?._id === courseId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    setSubmitting(true);
    try {
      await api.post('/api/feedback', {
        course: selectedCourse._id,
        ratings: {
          teachingQuality: form.teachingQuality,
          courseContent: form.courseContent,
          resourcesAvailability: form.resourcesAvailability,
          overallExperience: form.overallExperience
        },
        comments: form.comments,
        semester: selectedCourse.semester,
        academicYear: selectedCourse.academicYear,
        isAnonymous: form.isAnonymous
      });
      
      toast.success('Feedback submitted successfully. Thank you!');
      setSelectedCourse(null);
      setForm({
        teachingQuality: 5,
        courseContent: 5,
        resourcesAvailability: 5,
        overallExperience: 5,
        comments: '',
        isAnonymous: false
      });
      fetchData();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
       setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight font-outfit">Student Feedback</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Shape the future of education with your valuable insights.</p>
        </div>
        {!selectedCourse && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4">
             <div className="p-3 bg-fuchsia-50 rounded-2xl text-fuchsia-600">
                <FiMessageSquare className="h-6 w-6" />
             </div>
             <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Submissions</p>
                <p className="text-xl font-black text-slate-700 leading-none">{feedbacks.length} / {enrollments.length}</p>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
           <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
             <FiBookOpen className="text-indigo-600" />
             Your Courses
           </h3>
           <div className="space-y-4">
             {enrollments.map((enrollment) => (
               <button 
                 key={enrollment._id}
                 disabled={hasSubmitted(enrollment.course?._id)}
                 onClick={() => setSelectedCourse(enrollment.course)}
                 className={`w-full group rounded-[2.5rem] p-6 text-left transition-all duration-500 relative overflow-hidden ${
                   selectedCourse?._id === enrollment.course?._id 
                    ? 'bg-slate-900 shadow-2xl scale-105 border-0' 
                    : hasSubmitted(enrollment.course?._id)
                    ? 'bg-emerald-50 border border-emerald-100 opacity-60 cursor-default shadow-inner'
                    : 'bg-white border border-slate-100 hover:shadow-xl hover:border-indigo-200'
                 }`}
               >
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                       <p className={`text-[10px] font-black uppercase tracking-widest ${
                         selectedCourse?._id === enrollment.course?._id ? 'text-indigo-400' : hasSubmitted(enrollment.course?._id) ? 'text-emerald-500' : 'text-slate-400'
                       }`}>
                         {enrollment.course?.courseCode}
                       </p>
                       {hasSubmitted(enrollment.course?._id) && (
                         <span className="bg-emerald-500 text-white p-1 rounded-full text-[8px]">
                           <FiCheckCircle />
                         </span>
                       )}
                    </div>
                    <h4 className={`text-md font-extrabold mb-2 leading-tight ${selectedCourse?._id === enrollment.course?._id ? 'text-white' : 'text-slate-700'}`}>
                      {enrollment.course?.courseName}
                    </h4>
                    <p className={`text-[10px] font-bold ${selectedCourse?._id === enrollment.course?._id ? 'text-slate-500' : 'text-slate-400'}`}>
                      SEM {enrollment.course?.semester} • {enrollment.academicYear}
                    </p>
                 </div>
               </button>
             ))}
           </div>
        </div>

        <div className="lg:col-span-8">
           {selectedCourse ? (
             <div className="bg-white rounded-[4rem] shadow-2xl p-12 border border-slate-100 relative overflow-hidden h-full">
               <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-5">
                  <FiMessageSquare className="w-96 h-96" />
               </div>

               <div className="relative z-10">
                 <button 
                   onClick={() => setSelectedCourse(null)}
                   className="text-slate-400 hover:text-rose-500 text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-1 transition-all"
                 >
                   ← Cancel Submission
                 </button>

                 <div className="flex items-center gap-5 mb-12">
                   <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 text-white">
                      <FiStar className="h-8 w-8" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 leading-none mb-2">Faculty Evaluation</h2>
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Evaluating: {selectedCourse.courseName}</p>
                   </div>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       {[
                         { id: 'teachingQuality', label: 'Teaching Quality', description: 'Pedagogy & Delivery' },
                         { id: 'courseContent', label: 'Course Content', description: 'Relevance & Depth' },
                         { id: 'resourcesAvailability', label: 'Resources', description: 'Tools & Lab Access' },
                         { id: 'overallExperience', label: 'Overall Vibe', description: 'Satisfaction Level' }
                       ].map((item) => (
                         <div key={item.id} className="group transition-all">
                            <div className="flex justify-between items-end mb-4">
                               <div>
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                  <p className="text-[10px] text-slate-400 font-bold leading-none">{item.description}</p>
                               </div>
                               <span className="text-4xl font-black text-indigo-100 group-hover:text-indigo-600 transition-colors">{form[item.id]}</span>
                            </div>
                            <div className="flex gap-2">
                               {[1, 2, 3, 4, 5].map(num => (
                                 <button 
                                   key={num}
                                   type="button"
                                   onClick={() => setForm({ ...form, [item.id]: num })}
                                   className={`flex-1 h-12 rounded-2xl transition-all duration-300 font-black text-lg ${
                                     form[item.id] === num 
                                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                                     : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                   }`}
                                 >
                                   {num}
                                 </button>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>

                    <div>
                       <div className="flex items-center gap-2 mb-4">
                          <FiMessageSquare className="text-indigo-400" />
                          <p className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Your Comments</p>
                       </div>
                       <textarea 
                         value={form.comments}
                         onChange={(e) => setForm({ ...form, comments: e.target.value })}
                         className="w-full bg-slate-50 border-0 rounded-[2.5rem] p-8 text-slate-700 font-medium focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all min-h-[150px] placeholder-slate-300"
                         placeholder="Be specific, constructive feedback helps your lecturers improve..."
                         maxLength={500}
                       />
                       <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-3">
                             <input 
                               type="checkbox"
                               id="anonymous"
                               checked={form.isAnonymous}
                               onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                               className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                             />
                             <label htmlFor="anonymous" className="text-xs font-extrabold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">Submit Anonymously</label>
                          </div>
                          <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{form.comments.length}/500</span>
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-slate-900 text-white rounded-[2rem] py-6 font-black text-lg uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 md:hover:gap-6"
                    >
                      {submitting ? 'Encrypting & Sending...' : 'Submit Evaluation'}
                      <FiSend className="text-indigo-400 group-hover:rotate-12 transition-transform h-6 w-6" />
                    </button>
                 </form>
               </div>
             </div>
           ) : (
             <div className="bg-white rounded-[4rem] shadow-xl p-20 border border-slate-100 h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 border border-slate-100">
                   <FiMessageSquare className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-4 leading-none">Your Voice Matters.</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed italic">
                  "Education is the most powerful weapon which you can use to change the world." - Provide feedback to improve yours.
                </p>
                <div className="flex gap-4 items-center p-4 bg-indigo-50 rounded-3xl border border-indigo-100 pr-10">
                   <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                      <FiAlertCircle />
                   </div>
                   <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">Select a course from the left to begin evaluation</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
