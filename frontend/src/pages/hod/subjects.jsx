import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiBook, 
  FiArrowRight, FiUpload, FiDownload, FiCheck, FiFilter, 
  FiUser, FiFileText, FiCheckCircle, FiClipboard, FiClock, FiAlertCircle,
  FiXCircle, FiRefreshCw, FiChevronDown, FiInfo, FiGrid, FiUsers, FiAward
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/Authcontext';
import { motion, AnimatePresence } from 'framer-motion';

// Subject data based on curriculum (User provided)
const subjectOptions = {
  'Computer Science': {
    '1st Year': {
      1: [
        { code: 'CO1121', name: 'Basic Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO1122', name: 'Basic Computer Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1112' },
        { code: 'CO1112', name: 'Practical work on CO1122', credits: 1, category: 'Practical' },
        { code: 'CO1123', name: 'Formal Methods for Problem Solving', credits: 3, category: 'Lecture' },
        { code: 'CO1124', name: 'Computer Systems & PC Applications', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1114' },
        { code: 'CO1114', name: 'Practical work on CO1124', credits: 1, category: 'Practical' },
        { code: 'CO1125', name: 'Statistics for Science and Technology', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1115' },
        { code: 'CO1115', name: 'Practical work on CO1125', credits: 1, category: 'Practical' },
        { code: 'CO1126', name: 'Management Information System', credits: 3, category: 'Management' },
        { code: 'GEP-I', name: 'General English Proficiency - I', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO1221', name: 'Systems Analysis & Design', credits: 3, category: 'Lecture' },
        { code: 'CO1222', name: 'Data Structures & Algorithms', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1212' },
        { code: 'CO1212', name: 'Practical work on CO1222', credits: 1, category: 'Practical' },
        { code: 'CO1223', name: 'Data Base Management Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1213' },
        { code: 'CO1213', name: 'Practical work on CO1223', credits: 1, category: 'Practical' },
        { code: 'CO1224', name: 'MultiMedia & HyperMedia Development', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1214' },
        { code: 'CO1214', name: 'Practical work on CO1224', credits: 1, category: 'Practical' },
        { code: 'CO1225', name: 'Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CO1226', name: 'Social Harmony', credits: 2, category: 'General' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'CO2121', name: 'Advanced Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO2122', name: 'Operating Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2112' },
        { code: 'CO2112', name: 'Practical work on CO2122', credits: 1, category: 'Practical' },
        { code: 'CO2123', name: 'Software Engineering', credits: 3, category: 'Lecture' },
        { code: 'CO2124', name: 'Internet and Web Design', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2114' },
        { code: 'CO2114', name: 'Practical work on CO2124', credits: 1, category: 'Practical' },
        { code: 'CO2125', name: 'Object Oriented Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2115' },
        { code: 'CO2115', name: 'Practical work on CO2125', credits: 1, category: 'Practical' },
        { code: 'CO2126', name: 'Sri Lankan Studies', credits: 2, category: 'General' },
        { code: 'GEP-III', name: 'General English Proficiency - III', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO2221', name: 'Data Communication Systems', credits: 3, category: 'Lecture' },
        { code: 'CO2222', name: 'Visual System Development Tools', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2212' },
        { code: 'CO2212', name: 'Practical work on CO2222', credits: 1, category: 'Practical' },
        { code: 'CO2223', name: 'Computer Graphics', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2213' },
        { code: 'CO2213', name: 'Practical work on CO2223', credits: 1, category: 'Practical' },
        { code: 'CO2224', name: 'Human Computer Interaction', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2214' },
        { code: 'CO2214', name: 'Practical work on CO2224', credits: 1, category: 'Practical' },
        { code: 'CO2225', name: 'Software Management Techniques', credits: 3, category: 'Management' },
        { code: 'CO2226', name: 'Automata Theory', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'CS3121', name: 'Logic Programming & Expert Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3111' },
        { code: 'CS3111', name: 'Practical work on CS3121', credits: 1, category: 'Practical' },
        { code: 'CS3122', name: 'Advanced Database Management Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3112' },
        { code: 'CS3112', name: 'Practical work on CS3122', credits: 1, category: 'Practical' },
        { code: 'CS3123', name: 'Systems & Network Administration', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3113' },
        { code: 'CS3113', name: 'Practical work on CS3123', credits: 1, category: 'Practical' },
        { code: 'CS3124', name: 'Data Security', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3114' },
        { code: 'CS3114', name: 'Practical work on CS3124', credits: 1, category: 'Practical' },
        { code: 'CS3135', name: 'Theory of Computing', credits: 3, category: 'Lecture' },
        { code: 'EC3101', name: 'Foundations of Management', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'CS3221', name: 'Assembly Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3211' },
        { code: 'CS3211', name: 'Practical work on CS3221', credits: 1, category: 'Practical' },
        { code: 'CS3222', name: 'Software Quality Assurance', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3212' },
        { code: 'CS3212', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3233', name: 'Professional Issues in IT', credits: 3, category: 'Lecture' },
        { code: 'CS3224', name: 'Computer Networks', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3214' },
        { code: 'CS3214', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3235', name: 'Industrial Training/Project', credits: 6, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'CS4121', name: 'Advanced Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CS4122', name: 'Machine Learning', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4112' },
        { code: 'CS4112', name: 'Practical work on CS4122', credits: 1, category: 'Practical' },
        { code: 'CS4123', name: 'Distributed Systems', credits: 3, category: 'Lecture' },
        { code: 'CS4124', name: 'Research Methodology', credits: 3, category: 'Lecture' },
        { code: 'CS41P1', name: 'Research Project - Part I', credits: 3, category: 'Project' },
      ],
      2: [
        { code: 'CS4221', name: 'Advanced Networking', credits: 3, category: 'Lecture' },
        { code: 'CS4222', name: 'Cloud Computing', credits: 3, category: 'Lecture' },
        { code: 'CS4223', name: 'Ethical Hacking', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4213' },
        { code: 'CS4213', name: 'Practical work on CS4223', credits: 1, category: 'Practical' },
        { code: 'CS42P2', name: 'Research Project - Part II', credits: 6, category: 'Project' },
      ]
    }
  },
  'Software Engineering': {
    '1st Year': {
      1: [
        { code: 'SE1101', name: 'Fundamentals of Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1101P' },
        { code: 'SE1101P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'SE1102', name: 'Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'SE1103', name: 'Digital Logic Design', credits: 3, category: 'Lecture' },
        { code: 'SE1104', name: 'Communication Skills', credits: 2, category: 'General' },
        { code: 'SE1105', name: 'Introduction to Software Engineering', credits: 3, category: 'Lecture' },
      ],
      2: [
        { code: 'SE1201', name: 'Object Oriented Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1201P' },
        { code: 'SE1201P', name: 'OOP Lab', credits: 1, category: 'Practical' },
        { code: 'SE1202', name: 'Data Structures', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1202P' },
        { code: 'SE1202P', name: 'Data Structures Lab', credits: 1, category: 'Practical' },
        { code: 'SE1203', name: 'Database Systems', credits: 3, category: 'Lecture' },
        { code: 'SE1204', name: 'Web Development Basics', credits: 3, category: 'Lecture' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'SE2101', name: 'Software Requirements Engineering', credits: 3, category: 'Lecture' },
        { code: 'SE2102', name: 'Algorithms Analysis', credits: 3, category: 'Lecture' },
        { code: 'SE2103', name: 'UI/UX Design', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2103P' },
        { code: 'SE2103P', name: 'UI/UX Lab', credits: 1, category: 'Practical' },
        { code: 'SE2104', name: 'Professional Development', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'SE2201', name: 'Software Design and Architecture', credits: 3, category: 'Lecture' },
        { code: 'SE2202', name: 'Mobile App Development', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2202P' },
        { code: 'SE2202P', name: 'Mobile Dev Lab', credits: 1, category: 'Practical' },
        { code: 'SE2203', name: 'Quality Assurance', credits: 3, category: 'Lecture' },
        { code: 'SE2204', name: 'Operating Systems', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'SE3101', name: 'Software Project Management', credits: 3, category: 'Management' },
        { code: 'SE3102', name: 'Enterprise Architecture', credits: 3, category: 'Lecture' },
        { code: 'SE3103', name: 'Cloud Applications Development', credits: 3, category: 'Lecture' },
        { code: 'SE3104', name: 'Software Testing', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE3104P' },
        { code: 'SE3104P', name: 'Testing Lab', credits: 1, category: 'Practical' },
      ],
      2: [
        { code: 'SE3201', name: 'DevOps Practices', credits: 3, category: 'Lecture' },
        { code: 'SE3202', name: 'Advanced Web Development', credits: 3, category: 'Lecture' },
        { code: 'SE3203', name: 'Ethics in Computing', credits: 2, category: 'General' },
        { code: 'SE32P1', name: 'Group Project', credits: 4, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'SE4101', name: 'Software Evolution', credits: 3, category: 'Lecture' },
        { code: 'SE4102', name: 'IT Governance', credits: 3, category: 'Management' },
        { code: 'SE41P1', name: 'Capstone Project - Part I', credits: 4, category: 'Project' },
      ],
      2: [
        { code: 'SE4201', name: 'Software Entrepreneurship', credits: 3, category: 'Management' },
        { code: 'SE42P2', name: 'Capstone Project - Part II', credits: 6, category: 'Project' },
        { code: 'SE4202', name: 'Industrial Internship', credits: 4, category: 'Project' },
      ]
    }
  },
  'Information Technology': {
    '1st Year': {
      1: [
        { code: 'IT1101', name: 'Introduction to IT', credits: 3, category: 'Lecture' },
        { code: 'IT1102', name: 'Programming Fundamentals', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1102P' },
        { code: 'IT1102P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'IT1103', name: 'Mathematics for IT', credits: 3, category: 'Lecture' },
        { code: 'IT1104', name: 'Digital Literacy', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'IT1201', name: 'Web Technologies', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1201P' },
        { code: 'IT1201P', name: 'Web Lab', credits: 1, category: 'Practical' },
        { code: 'IT1202', name: 'Database Management', credits: 3, category: 'Lecture' },
        { code: 'IT1203', name: 'Computer Networks Basics', credits: 3, category: 'Lecture' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'IT2101', name: 'System Administration', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT2101P' },
        { code: 'IT2101P', name: 'SysAdmin Lab', credits: 1, category: 'Practical' },
        { code: 'IT2102', name: 'Information Security', credits: 3, category: 'Lecture' },
        { code: 'IT2103', name: 'Business Analysis', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'IT2201', name: 'Network Security', credits: 3, category: 'Lecture' },
        { code: 'IT2202', name: 'Cloud Infrastructure', credits: 3, category: 'Lecture' },
        { code: 'IT2203', name: 'IT Support Services', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'IT3101', name: 'Enterprise Networks', credits: 3, category: 'Lecture' },
        { code: 'IT3102', name: 'Cyber Security', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT3102P' },
        { code: 'IT3102P', name: 'Security Lab', credits: 1, category: 'Practical' },
        { code: 'IT3103', name: 'IT Project Management', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'IT3201', name: 'Data Center Management', credits: 3, category: 'Lecture' },
        { code: 'IT3202', name: 'IT Service Management', credits: 3, category: 'Management' },
        { code: 'IT32P1', name: 'Industrial Placement', credits: 6, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'IT4101', name: 'Emerging Technologies', credits: 3, category: 'Lecture' },
        { code: 'IT4102', name: 'IT Strategy', credits: 3, category: 'Management' },
        { code: 'IT41P1', name: 'Final Year Project - Part I', credits: 4, category: 'Project' },
      ],
      2: [
        { code: 'IT4201', name: 'Digital Transformation', credits: 3, category: 'Lecture' },
        { code: 'IT42P2', name: 'Final Year Project - Part II', credits: 6, category: 'Project' },
      ]
    }
  }
};

const HodSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: '',
    year: '',
    semester: '',
    category: 'Lecture',
    hasPractical: false,
    practicalCode: '',
    description: '',
    department: user.department
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];
  const categories = ['Lecture', 'Practical', 'General', 'Management', 'Project'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [searchTerm, selectedYear, selectedSemester, selectedCategory, subjects]);

  // Update available subjects when year or semester changes
  useEffect(() => {
    if (formData.year && formData.semester && user.department) {
      const deptSubjects = subjectOptions[user.department]?.[formData.year]?.[formData.semester] || [];
      setAvailableSubjects(deptSubjects);
    } else {
      setAvailableSubjects([]);
    }
  }, [formData.year, formData.semester, user.department]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const subjectsRes = await api.get(`/api/subjects?department=${encodeURIComponent(user.department)}`);

      const subjectsList = subjectsRes.data.subjects;
      setSubjects(subjectsList);
      setFilteredSubjects(subjectsList);
      
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (selectedYear !== 'all') {
      filtered = filtered.filter(s => s.year === selectedYear);
    }
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(s => s.semester === parseInt(selectedSemester));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term)
      );
    }
    setFilteredSubjects(filtered);
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubjectSelect = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;

    const selected = availableSubjects.find(sub => sub.code === selectedCode);
    if (selected) {
      setFormData({
        ...formData,
        name: selected.name,
        code: selected.code,
        credits: selected.credits,
        category: selected.category,
        hasPractical: selected.hasPractical || false,
        practicalCode: selected.practicalCode || '',
        department: user.department,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      credits: '',
      year: '',
      semester: '',
      department: user.department,
      category: 'Lecture',
      hasPractical: false,
      practicalCode: '',
      description: '',
    });
  };

  const handleAddSubject = async e => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        credits: parseInt(formData.credits),
        semester: parseInt(formData.semester),
        department: user.department
      };
      await api.post('api/subjects', submitData);
      toast.success('Subject added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Add failed');
    }
  };

  const openEditModal = subject => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      year: subject.year,
      semester: subject.semester,
      department: subject.department,
      category: subject.category || 'Lecture',
      hasPractical: subject.hasPractical || false,
      practicalCode: subject.practicalCode || '',
      description: subject.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubject = async e => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        credits: parseInt(formData.credits),
        semester: parseInt(formData.semester)
      };
      await api.put(`api/subjects/${selectedSubject._id}`, submitData);
      toast.success('Subject updated successfully');
      setShowEditModal(false);
      setSelectedSubject(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteSubject = async id => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`api/subjects/${id}`);
      toast.success('Subject deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSeedSubjects = async () => {
    try {
      const res = await api.post('api/subjects/seed', { department: user.department });
      toast.success(res.data.message);
      setShowSeedModal(false);
      fetchData();
    } catch (error) {
      toast.error('Seeding failed');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error('Please select a CSV file');

    const uploadData = new FormData();
    uploadData.append('file', bulkFile);

    try {
      await api.post('api/subjects/bulk-upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bulk upload successful');
      setShowBulkUploadModal(false);
      setBulkFile(null);
      fetchData();
    } catch (error) {
      toast.error('Bulk upload failed');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,code,credits,year,semester,department,category,hasPractical,practicalCode,description\n" +
      `Basic Mathematics,CO1121,3,1st Year,1,${user.department},Lecture,false,,\n` +
      `Programming Lab,CO1112,1,1st Year,1,${user.department},Practical,false,,\n` +
      `Data Structures,CO1222,3,1st Year,2,${user.department},Lecture,true,CO1212,\n` +
      `Data Structures Lab,CO1212,1,1st Year,2,${user.department},Practical,false,,`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects_template.csv");
    link.click();
  };

  const getYearColor = (year) => {
    const colors = {
      '1st Year': 'bg-white border border-black text-slate-800',
      '2nd Year': 'bg-white border border-black text-slate-800',
      '3rd Year': 'bg-white border border-black text-slate-800',
      '4th Year': 'bg-white border border-black text-slate-800'
    };
    return colors[year] || 'bg-white border border-black text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Lecture': 'bg-white border border-black text-slate-800',
      'Practical': 'bg-white border border-black text-slate-800',
      'General': 'bg-white border border-black text-slate-800',
      'Management': 'bg-white border border-black text-slate-800',
      'Project': 'bg-white border border-black text-slate-800'
    };
    return colors[category] || 'bg-white border border-black text-gray-800';
  };


  if (loading) return <Loader fullScreen />;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-black p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Subject Management</h1>
              <p className="text-slate-500 font-medium">Academic oversight for <span className="text-indigo-600 font-bold">{user.department}</span></p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <FiPlus /> Add Subject
              </button>
              <button
                onClick={() => setShowSeedModal(true)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 border border-indigo-600 transition-all flex items-center gap-2"
              >
                <FiRefreshCw /> Bulk Update
              </button>
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-white border border-black transition-all flex items-center gap-2"
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search subjects..."
                className="pl-12 pr-6 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-6 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="px-6 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
            </select>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-6 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 w-full transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSubjects.map((subject, idx) => (
              <motion.div 
                key={subject._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2.5rem] p-8 border border-black shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <FiBook />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {subject.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${getCategoryColor(subject.category)}`}>
                      {subject.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2 line-clamp-1">{subject.name}</h3>
                <div className="flex gap-2 mb-8 items-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getYearColor(subject.year)}`}>{subject.year}</span>
                  <span className="text-slate-200">/</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">Semester {subject.semester}</span>
                  <span className="text-slate-200">•</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">{subject.credits} Credits</span>
                </div>


                <div className="flex gap-3">
                  <Link 
                    to={`/hod/subject/${subject._id}/assessments`}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <FiAward /> Assessments
                  </Link>
                  <button 
                    onClick={() => openEditModal(subject)}
                    className="flex-1 py-3 border border-indigo-200 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteSubject(subject._id)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] mt-8 border border-dashed border-black">
            <FiBook className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold mb-6">No subjects found for this criteria</p>
            <button
              onClick={() => setShowSeedModal(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
            >
              Sync with Curriculum
            </button>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Create New Subject"
      >
        <form onSubmit={handleAddSubject} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Year</option>
                {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">From Curriculum</label>
              <select
                onChange={handleSubjectSelect}
                value={formData.code}
                className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-xl font-bold appearance-none cursor-pointer"
                disabled={!formData.year || !formData.semester}
              >
                <option value="">
                  {!formData.year || !formData.semester
                    ? 'Select year and semester first'
                    : availableSubjects.length === 0
                      ? 'No curriculum data for this semester'
                      : '-- Choose pre-defined subject --'}
                </option>
                {availableSubjects.map(sub => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Full subject name"
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Course Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="e.g. CO1221"
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                min="1"
                max="8"
                required
                placeholder="1-8"
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="hasPractical"
                checked={formData.hasPractical}
                onChange={handleInputChange}
                className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
              />
              <label className="text-sm font-bold text-slate-700">Has Practical Component</label>
            </div>

            {formData.hasPractical && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Practical Course Code</label>
                <input
                  type="text"
                  name="practicalCode"
                  value={formData.practicalCode}
                  onChange={handleInputChange}
                  placeholder="e.g. CO1211"
                  className="w-full px-5 py-4 bg-white border border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 mt-1"
                />
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform active:scale-95">
             Create Subject
          </button>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedSubject(null); resetForm(); }}
        title="Edit Subject"
      >
        <form onSubmit={handleEditSubject} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Course Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Credits</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 bg-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all transform active:scale-95 shadow-xl shadow-indigo-100">
             Save Changes
          </button>
        </form>
      </Modal>

      {/* Initialize / Seed Modal */}
      <Modal
        isOpen={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        title="Sync Curriculum Data"
      >
        <div className="pt-4 space-y-6">
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl text-indigo-600 text-xl shadow-sm"><FiInfo /></div>
            <p className="text-xs font-bold text-indigo-700 leading-tight">This will sync the subjects in your department with the official curriculum. It will add missing subjects and update existing ones with latest names/credits.</p>
          </div>

          <p className="text-sm text-slate-500 font-medium px-2">Continuing will automatically create all standard subjects for Year 1-4 based on the authorized faculty curriculum data.</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSeedSubjects}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              <FiCheckCircle /> Sync Now
            </button>
            <button
              onClick={() => setShowSeedModal(false)}
              className="w-full py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => { setShowBulkUploadModal(false); setBulkFile(null); }}
        title="Bulk Import Subjects"
      >
        <form onSubmit={handleBulkUpload} className="space-y-6 pt-4">
          <div className="p-8 border-4 border-dashed border-black rounded-[2.5rem] text-center hover:border-indigo-200 transition-colors group relative cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={e => setBulkFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <FiUpload />
            </div>
            <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">
              {bulkFile ? bulkFile.name : 'Click to select CSV file'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
             <button
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!bulkFile}
              >
                Start Import
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <FiDownload /> Template.csv
              </button>
          </div>
        </form>
      </Modal>


    </div>
  );
};

export default HodSubjects;
