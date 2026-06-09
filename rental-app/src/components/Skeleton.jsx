
const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  // Base classes for the pulse animation and background color
  const baseClasses = 'bg-gray-200 animate-pulse';
  
  // Handle different shapes
  const variantClasses = {
    circular: 'rounded-full',
    text: 'rounded-md h-4',
    rectangular: 'rounded-xl',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}></div>
  );
};

export default Skeleton;
