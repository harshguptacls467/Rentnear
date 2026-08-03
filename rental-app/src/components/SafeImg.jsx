import { useState } from 'react';
import { ImageOff, User } from 'lucide-react';

/**
 * Crash-Resistant Image Component
 * Automatically catches broken image URLs, 404s, CORS failures, or network errors
 * and falls back to a graceful placeholder or default avatar.
 */
const SafeImg = ({
  src,
  alt = '',
  className = '',
  fallbackType = 'generic', // 'avatar' | 'product' | 'generic'
  fallbackSrc,
  ...props
}) => {
  const [error, setError] = useState(false);

  // If no source provided or error occurred
  if (!src || error) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          onError={() => setError(true)}
          {...props}
        />
      );
    }

    if (fallbackType === 'avatar') {
      return (
        <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
          <User size={24} />
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-2 text-center select-none ${className}`}>
        <ImageOff size={24} className="mb-1 opacity-50" />
        <span className="text-[10px] text-gray-400 font-medium">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default SafeImg;
