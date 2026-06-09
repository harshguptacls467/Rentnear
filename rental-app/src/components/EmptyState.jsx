
const EmptyState = ({ 
  icon: Icon, 
  title, 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm mt-8 animate-fade-in-up">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
        {Icon ? <Icon size={40} className="text-gray-300" /> : <div className="w-10 h-10 bg-gray-200 rounded-full" />}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        {message}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="mt-6 text-primary font-bold hover:underline transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
