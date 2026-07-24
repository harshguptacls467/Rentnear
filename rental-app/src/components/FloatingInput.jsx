import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FloatingInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  icon: Icon,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative mb-4 w-full">
      <div
        className={`relative flex items-center border rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 ${
          error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/20'
            : focused
            ? 'border-primary ring-2 ring-primary/20 shadow-sm'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {Icon && (
          <div className="pl-4 text-gray-400 flex items-center justify-center">
            <Icon size={18} />
          </div>
        )}
        <div className="relative flex-1">
          <input
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=" "
            className="peer w-full px-4 py-3 bg-transparent text-gray-800 text-sm outline-none placeholder-transparent pt-5 pb-1.5 transition-all"
            {...props}
          />
          <label
            className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 origin-[0_0] scale-100 ${
              focused || value
                ? 'scale-75 -translate-y-3.5 text-xs text-primary'
                : 'text-sm'
            }`}
          >
            {label}
          </label>
        </div>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-4 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium pl-1 mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
};

export default FloatingInput;
