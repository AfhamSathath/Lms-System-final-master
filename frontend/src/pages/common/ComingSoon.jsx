import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full border border-gray-100"
      >
        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-5xl text-indigo-600 mb-8 mx-auto shadow-inner">
          <FiClock className="animate-pulse" />
        </div>
        
        <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-tight uppercase">
          {title || 'Coming Soon'}
        </h1>
        
        <p className="text-gray-500 text-lg mb-10 font-medium">
          We're working hard to bring this feature to life. Stay tuned for updates!
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 mx-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all transform active:scale-95 shadow-xl"
          >
            <FiArrowLeft /> Go Back
          </button>
          
          <div className="pt-8 border-t border-gray-50">
            <p className="text-[10px] items-center uppercase font-black text-gray-300 tracking-[0.2em]">
              University MIS • Phase 2 Development
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
