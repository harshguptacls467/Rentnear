import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle, PlusCircle } from 'lucide-react';

const FileUpload = ({ label, error, onChange, maxFiles = 5, maxSizeMB = 2 }) => {
  const [files, setFiles] = useState([]);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e) => {
    setLocalError('');
    const selectedFiles = Array.from(e.target.files);
    
    // Check total limit
    if (files.length + selectedFiles.length > maxFiles) {
      setLocalError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    const validFiles = [];
    let hasSizeError = false;

    selectedFiles.forEach((file) => {
      if (file.size > maxSizeBytes) {
        hasSizeError = true;
      } else {
        // Create an object URL so we can instantly show an image preview
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        });
        validFiles.push(file);
      }
    });

    if (hasSizeError) {
      setLocalError(`Some files exceeded the ${maxSizeMB}MB limit and were skipped.`);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    
    // Pass the new files up to the parent component
    if(onChange) onChange(newFiles);
    
    // Clear the internal input value so the same file can be selected again if deleted
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (indexToRemove) => {
    const fileToRemove = files[indexToRemove];
    // Clean up memory
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const newFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(newFiles);
    if(onChange) onChange(newFiles);
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      {/* Upload Dropzone */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          files.length >= maxFiles 
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60' 
            : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-primary cursor-pointer'
        } ${displayError ? 'border-red-300 bg-red-50' : ''}`}
        onClick={() => files.length < maxFiles && fileInputRef.current?.click()}
      >
        <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${displayError ? 'text-red-400' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-700 font-semibold">
          Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
        </p>
        <p className="text-xs text-gray-400 mt-2 font-medium">PNG, JPG up to {maxSizeMB}MB (Max {maxFiles} files)</p>
        
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={files.length >= maxFiles}
        />
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="mt-3 flex items-center text-sm text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 mr-1.5" /> {displayError}
        </p>
      )}

      {/* Thumbnails Preview Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {files.map((file, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-100">
              <img 
                src={file.preview} 
                alt="preview" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {/* "Add More" Placeholder */}
          {files.length < maxFiles && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-gray-200 aspect-square flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
            >
              <PlusCircle size={24} className="mb-2" />
              <span className="text-xs font-semibold">Add more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
