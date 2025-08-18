import { useState, useCallback, memo } from 'react';
import { OptimizedImage } from './OptimizedImage';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export const ImageWithFallback = memo(({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  width,
  height,
  loading = 'lazy',
  priority = false
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  }, [hasError, imgSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setHasError(false);
  }, []);

  return (
    <OptimizedImage
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      priority={priority}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
});

ImageWithFallback.displayName = 'ImageWithFallback';