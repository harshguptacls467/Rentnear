import React from 'react';
import { AlertCircle } from 'lucide-react';

const Input = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`block w-full rounded-xl py-3 px-4 sm:text-sm transition-all shadow-sm
            ${error 
              ? 'bg-red-50 border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'bg-white border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'} 
            border`}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
