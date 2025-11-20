import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadResume, resetResume } from '../redux/slices/resumeSlice';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ResumeUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message, parsedData } = useSelector(
    (state) => state.resume
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!user) {
      alert('Please login to upload a resume');
      return;
    }
    dispatch(uploadResume({ userId: user._id, file }));
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Upload Resume</h1>
      
      <div 
        className={`bg-white p-12 rounded-xl shadow-sm border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx"
          onChange={handleChange}
        />
        
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8" />
        </div>
        
        <p className="text-xl font-medium text-slate-900 mb-2">
          Drag and drop your resume here
        </p>
        <p className="text-slate-500 mb-6">
          Supports PDF and DOCX files
        </p>
        
        <button 
          onClick={onButtonClick}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Select File
        </button>
      </div>

      {isLoading && (
        <div className="mt-8 text-center text-slate-600">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          Processing your resume...
        </div>
      )}

      {isError && (
        <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      {isSuccess && parsedData && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Resume Parsed Successfully</h3>
          </div>
          <div className="prose max-w-none">
            <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
