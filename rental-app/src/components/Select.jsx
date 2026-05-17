import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const Select = ({ label, id, options = [], error, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`block w-full rounded-xl py-3 px-4 sm:text-sm transition-all shadow-sm appearance-none cursor-pointer
            ${error 
              ? 'bg-red-50 border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
              : 'bg-white border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'} 
            border`}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Custom Arrow Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          {error && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
          <ChevronDown className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
