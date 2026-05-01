import React, { useRef, useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

const SignaturePad = ({ onSave, onCancel, width = 400, height = 150 }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event.touches && event.touches[0]) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const { x, y } = getCoordinates(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    event.preventDefault();
    const { x, y } = getCoordinates(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto">
      <div className="relative w-full bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-auto block touch-none"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-bold uppercase tracking-widest text-[10px]">
            Draw your signature here
          </div>
        )}
      </div>

      <div className="flex w-full mt-4 gap-3">
        <button
          type="button"
          onClick={clear}
          className="flex-1 flex items-center justify-center py-3 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <FiRefreshCw className="mr-2" /> Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          className="flex-[2] flex items-center justify-center py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
        >
          <FiCheck className="mr-2" /> Use Drawing
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
