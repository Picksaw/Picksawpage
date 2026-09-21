import React, { useState, useEffect, useMemo } from 'react';
import { getImageCandidates } from '../utils/imageResolver';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  webpSrc,
  fallbackSrc,
  alt,
  className = '',
  containerClassName = '',
  priority = false,
  width: _width,
  height: _height,
  ...rest
}) => {
  // Generate candidate resolution chain: [local.webp, local.jpg, local.png, fallbackUrl]
  const candidates = useMemo(() => {
    return getImageCandidates(src, webpSrc, fallbackSrc);
  }, [src, webpSrc, fallbackSrc]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsLoaded(false);
  }, [candidates]);

  const currentSource = candidates[currentIndex] || src || '';

  const handleError = () => {
    if (currentIndex < candidates.length - 1) {
      // Try next candidate in the chain (.webp -> .jpg -> .png -> fallback)
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All candidates exhausted, mark as loaded so layout doesn't break
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative w-full h-full min-w-0 min-h-0 overflow-hidden bg-[#F0D8DC]/15 ${containerClassName}`}>
      {/* Soft Skeleton Shimmer while loading */}
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#CFE8F3]/30 via-[#F6E3E6]/60 to-[#CFE8F3]/30 animate-pulse pointer-events-none z-0"
        />
      )}

      {currentSource && (
        <img
          key={currentSource}
          src={currentSource}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full max-w-full max-h-full object-cover object-center transition-opacity duration-300 ease-out z-10 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
};
