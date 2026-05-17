import React from 'react';

const TextArea = ({ label, id, error, maxLength, value = '', className = '', ...props }) => {
  // Ensure value is treated as a string to count length
  const currentLength = String(value).length;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-end mb-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        {maxLength && (
          <span className={`text-xs font-medium ${currentLength > maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          className={`block w-full rounded-xl py-3 px-4 sm:text-sm transition-all shadow-sm resize-y
            ${error 
              ? 'bg-red-50 border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'bg-white border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'} 
            border`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextArea;
