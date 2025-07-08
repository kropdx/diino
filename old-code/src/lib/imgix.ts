// Imgix URL builder for optimized image delivery
export function getImgixUrl(
  blobUrl: string | null | undefined,
  params?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'png' | 'jpg';
    fit?: 'crop' | 'clip' | 'fill' | 'scale' | 'max';
    dpr?: number;
  }
): string | null {
  if (!blobUrl) return null;

  // Extract the path from the Vercel Blob URL
  // Vercel Blob URLs look like: https://[subdomain].public.blob.vercel-storage.com/[path]
  const url = new URL(blobUrl);
  const path = url.pathname.substring(1); // Remove leading slash

  // Get imgix domain from environment variable
  const imgixDomain = process.env.NEXT_PUBLIC_IMGIX_DOMAIN;
  if (!imgixDomain) {
    console.warn('NEXT_PUBLIC_IMGIX_DOMAIN not set, returning original URL');
    return blobUrl;
  }

  // Build imgix URL with parameters
  const imgixUrl = new URL(`https://${imgixDomain}/${path}`);

  // Add optimization parameters
  if (params?.width) imgixUrl.searchParams.set('w', params.width.toString());
  if (params?.height) imgixUrl.searchParams.set('h', params.height.toString());
  if (params?.quality) imgixUrl.searchParams.set('q', params.quality.toString());
  if (params?.format) imgixUrl.searchParams.set('fm', params.format);
  if (params?.fit) imgixUrl.searchParams.set('fit', params.fit);
  if (params?.dpr) imgixUrl.searchParams.set('dpr', params.dpr.toString());

  // Always set auto format and compression
  if (!params?.format) imgixUrl.searchParams.set('fm', 'auto');
  imgixUrl.searchParams.set('auto', 'compress');

  return imgixUrl.toString();
}

// Helper function to get favicon URL with imgix optimization
export function getOptimizedFaviconUrl(
  faviconBlobUrl: string | null | undefined,
  originalFaviconUrl: string | null | undefined,
  size: 'sm' | 'md' | 'lg' = 'md'
): string | null {
  // Size mappings for favicons
  const sizeConfig = {
    sm: { width: 16, height: 16, dpr: 2 },
    md: { width: 32, height: 32, dpr: 2 },
    lg: { width: 64, height: 64, dpr: 2 },
  };

  const config = sizeConfig[size];

  // Prefer blob URL with imgix optimization
  if (faviconBlobUrl) {
    return getImgixUrl(faviconBlobUrl, {
      width: config.width,
      height: config.height,
      dpr: config.dpr,
      format: 'auto',
      fit: 'clip',
      quality: 90,
    });
  }

  // Fallback to original favicon URL
  return originalFaviconUrl || null;
}
