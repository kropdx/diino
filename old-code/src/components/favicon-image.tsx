'use client';

import React, { useState } from 'react';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedFaviconUrl } from '@/lib/imgix';

interface FaviconImageProps {
  url: string | null; // This can be either original URL or blob URL
  blobUrl?: string | null; // Optional blob URL for imgix optimization
  size?: 'sm' | 'md';
  className?: string;
}

export const FaviconImage: React.FC<FaviconImageProps> = ({
  url,
  blobUrl,
  size = 'md',
  className,
}) => {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!!(url || blobUrl));

  const sizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';

  // Get optimized URL using imgix if blob URL is available
  const imageUrl = getOptimizedFaviconUrl(blobUrl, url, size);

  console.log('FaviconImage render:', { url, blobUrl, imageUrl, failed, loading, size });

  if (!imageUrl || failed) {
    console.log('FaviconImage showing fallback icon:', { imageUrl, failed });
    return <Link2 className={cn(sizeClasses, 'text-muted-foreground', className)} />;
  }

  return (
    <>
      {loading && (
        <div className={cn(sizeClasses, 'animate-pulse bg-muted rounded-sm', className)} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="favicon"
        className={cn(sizeClasses, 'rounded', loading ? 'hidden' : '', className)}
        onLoad={() => {
          console.log('Favicon loaded successfully:', imageUrl);
          setLoading(false);
        }}
        onError={() => {
          console.log('Favicon failed to load:', imageUrl);
          setLoading(false);
          setFailed(true);
        }}
      />
      {failed && <Link2 className={cn(sizeClasses, 'text-muted-foreground', className)} />}
    </>
  );
};
