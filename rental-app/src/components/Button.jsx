import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ variant = 'primary', size = 'md', children, className = '', ...props }) => {
  // Base classes applied to all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant specific classes using our custom theme colors
  const variants = {
    primary: 'bg-primary text-white hover:bg-[#0b8260] focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-[#8e8884] focus:ring-secondary',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger',
  };

  // Size specific classes
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// PropTypes help document and validate the props passed to the component
Button.propTypes = {
  /**
   * The visual style variant of the button
   */
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  
  /**
   * How large should the button be?
   */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /**
   * The content rendered inside the button
   */
  children: PropTypes.node.isRequired,
  
  /**
   * Additional custom classes
   */
  className: PropTypes.string,
};

export default Button;
