import { useState, useRef, useEffect } from 'react';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Select = ({ label, id, options = [], error, className = '', value, onChange, placeholder = 'Select an option', ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optValue) => {
    // Simulate event object to keep compatibility with existing onChange handlers
    if (onChange) {
      onChange({
        target: {
          name: props.name || id,
          value: optValue
        }
      });
    }
    setIsOpen(false);
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          id={id}
          className={`relative block w-full rounded-xl py-3 px-4 sm:text-sm transition-all shadow-sm cursor-pointer select-none
            ${error 
              ? 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-500' 
              : isOpen
                ? 'bg-white border-primary ring-2 ring-primary/20'
                : 'bg-white border-gray-200 hover:border-gray-300'} 
            border`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            {error && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : error ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto py-2 thin-scrollbar">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors
                      ${value === opt.value ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="block truncate">{opt.label}</span>
                    {value === opt.value && <Check className="h-4 w-4" />}
                  </div>
                ))}
                {options.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
