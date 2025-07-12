'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaviconImageProps {
  url?: string | null;
  blobUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FaviconImage({ url, blobUrl, size = 'md', className }: FaviconImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Use blobUrl if available, otherwise fall back to url
  const imageUrl = blobUrl || url;

  if (!imageUrl || imageError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted rounded',
        sizeClasses[size],
        className
      )}>
        <Globe size={iconSizes[size]} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt="Site favicon"
      className={cn(sizeClasses[size], 'rounded', className)}
      onError={() => setImageError(true)}
    />
  );
} 