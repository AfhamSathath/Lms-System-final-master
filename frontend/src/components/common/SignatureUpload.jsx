import React, { useState, useRef } from 'react';
import { FiEdit3, FiX, FiCheck, FiLoader, FiTrash2, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SignatureUpload = ({ currentSignature, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
    if (!file && !preview) return;

    const formData = new FormData();
    if (file) {
      formData.append('signature', file);
    } else {
      // If we had a drawing canvas, we'd send the base64 here
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
      toast.error(error.response?.data?.message || 'Failed to upload signature');
    } finally {
      setUploading(false);
    }
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

            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-32 object-contain" />
                ) : signatureUrl ? (
                  <img src={signatureUrl} alt="Current" className="max-h-32 object-contain" />
                ) : (
                  <p className="text-gray-400 text-sm">No signature selected</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <label className="flex items-center px-4 py-2 bg-white border border-black text-slate-800 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <FiUpload className="mr-2" />
                  <span>{preview ? 'Change Image' : 'Upload Signature Image'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !preview}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50 font-bold"
                >
                  {uploading ? <FiLoader className="animate-spin mr-2" /> : <FiCheck className="mr-2" />}
                  Save Signature
                </button>
                {signatureUrl && !preview && (
                  <button
                    onClick={handleRemove}
                    disabled={uploading}
                    className="flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
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
