import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  let bgColor;
  let icon = <Info size={20} className="text-blue-400" />;

  if (type === 'success') {
    bgColor = 'bg-gray-900 border-l-4 border-green-500';
    icon = <CheckCircle size={20} className="text-green-500" />;
  } else if (type === 'error') {
    bgColor = 'bg-gray-900 border-l-4 border-red-500';
    icon = <AlertCircle size={20} className="text-red-500" />;
  } else {
    bgColor = 'bg-gray-900 border-l-4 border-blue-500';
  }

  return (
    <div className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl text-white min-w-[300px] max-w-md animate-fade-in-up ${bgColor}`}>
      {icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
