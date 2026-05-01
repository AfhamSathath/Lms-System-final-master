import React, { useState, useRef } from 'react';
import { FiEdit3, FiX, FiCheck, FiLoader, FiTrash2, FiUpload, FiFeather, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import SignaturePad from './SignaturePad';

const SignatureUpload = ({ currentSignature, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('draw'); // 'draw' or 'upload'
  const fileInputRef = useRef(null);

  const getSignatureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${path}`;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (mode === 'upload' && !file && !preview) {
      toast.error('Please select an image first');
      return;
    }
    if (mode === 'draw' && !preview) {
      toast.error('Please draw your signature first');
      return;
    }

    const formData = new FormData();
    if (mode === 'upload' && file) {
      formData.append('signature', file);
    } else {
      // Send base64 as a regular field in FormData
      formData.append('signature', preview);
    }

    setUploading(true);
    try {
      const response = await api.post('/api/users/profile/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Digital signature updated successfully');
      onUpdate(response.data.signature);
      setShowModal(false);
      setPreview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update signature');
    } finally {
      setUploading(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your digital signature?')) return;

    setUploading(true);
    try {
      await api.delete('/api/users/profile/signature');
      toast.success('Signature removed');
      onUpdate(null);
      setShowModal(false);
      setPreview(null);
    } catch (error) {
      toast.error('Failed to remove signature');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const signatureUrl = getSignatureUrl(currentSignature);

  return (
    <>
      <div className="mt-2">
        <div 
          onClick={() => setShowModal(true)}
          className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-500 transition-all bg-gray-50 flex flex-col items-center justify-center min-h-[120px]"
        >
          {signatureUrl ? (
            <div className="flex flex-col items-center">
              <img src={signatureUrl} alt="Signature" className="max-h-20 object-contain mb-2" />
              <span className="text-xs text-gray-500">Click to change signature</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <FiEdit3 className="h-8 w-8 mb-2" />
              <span className="text-sm">Click to add digital signature</span>
              <span className="text-xs mt-1">Required for approvals</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all flex items-center justify-center">
            <FiUpload className="text-blue-600 opacity-0 group-hover:opacity-100 h-6 w-6" />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Update Signature</h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button
                onClick={() => handleModeSwitch('draw')}
                className={`flex-1 flex items-center justify-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <FiFeather className="mr-2" /> Draw Signature
              </button>
              <button
                onClick={() => handleModeSwitch('upload')}
                className={`flex-1 flex items-center justify-center py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <FiUpload className="mr-2" /> Upload Image
              </button>
            </div>

            <div className="mb-6">
              {mode === 'draw' ? (
                preview ? (
                  <div className="relative border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50 flex flex-col items-center">
                    <img src={preview} alt="Preview" className="max-h-24 object-contain" />
                    <button 
                      onClick={() => setPreview(null)}
                      className="absolute -top-3 -right-3 bg-white border border-indigo-100 text-indigo-500 p-2 rounded-full shadow-lg hover:bg-indigo-50"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                ) : (
                  <SignaturePad onSave={(data) => setPreview(data)} />
                )
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[150px]">
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-32 object-contain" />
                  ) : signatureUrl ? (
                    <img src={signatureUrl} alt="Current" className="max-h-32 object-contain" />
                  ) : (
                    <>
                      <FiUpload className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Select Image File</p>
                    </>
                  )}
                  
                  <label className="mt-4 flex items-center px-6 py-2 bg-white border border-slate-900 text-slate-900 rounded-xl cursor-pointer hover:bg-slate-900 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-100">
                    <span>{preview ? 'Change Image' : 'Select File'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpload}
                disabled={uploading || !preview}
                className="flex-1 flex items-center justify-center px-4 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-30 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100"
              >
                {uploading ? <FiLoader className="animate-spin mr-2" /> : <FiCheck className="mr-2" />}
                Confirm Signature
              </button>
              {signatureUrl && !preview && (
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="flex items-center justify-center px-5 py-4 border-2 border-red-100 text-red-500 rounded-2xl hover:bg-red-50 transition-all shadow-lg shadow-red-50"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-6">
              PNG or JPG format. Transparent background PNG is recommended.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureUpload;
