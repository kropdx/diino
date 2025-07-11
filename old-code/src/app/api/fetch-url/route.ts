import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { put } from '@vercel/blob';

type FetchUrlResponse = {
  title: string;
  favicon: string | null;
  faviconBlobUrl?: string | null;
  url: string;
  error?: string;
  message?: string;
};

async function uploadFaviconToBlob(faviconUrl: string, hostname: string): Promise<string | null> {
  try {
    console.log('Downloading favicon from:', faviconUrl);

    // Download the favicon
    const response = await fetch(faviconUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Failed to download favicon:', response.status);
      return null;
    }

    // Get the content type and create appropriate filename
    const contentType = response.headers.get('content-type') || 'image/x-icon';
    const extension = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : contentType.includes('svg')
          ? 'svg'
          : contentType.includes('jpeg') || contentType.includes('jpg')
            ? 'jpg'
            : 'ico';

    // Create a unique filename based on hostname and timestamp
    const timestamp = Date.now();
    const filename = `favicons/${hostname.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, response.body!, {
      access: 'public',
      contentType,
    });

    console.log('Favicon uploaded to Vercel Blob:', blob.url);
    return blob.url;
  } catch (error) {
    console.error('Error uploading favicon to blob:', error);
    return null;
  }
}

export async function GET(request: Request) {
  console.log('Fetch URL endpoint called');

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    console.log('Request URL:', url);

    if (!url) {
      console.error('No URL provided');
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Ensure URL has a protocol
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log('Processing URL:', targetUrl);

    // Validate URL
    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (e) {
      console.error('Invalid URL:', targetUrl, e);
      return NextResponse.json(
        { error: 'Invalid URL', message: 'Please provide a valid URL' },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    console.log('Fetching content from:', targetUrl);
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        // 10 second timeout
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error(`HTTP error! status: ${response.status} ${response.statusText}`, {
          url: targetUrl,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorText,
        });
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching URL:', {
        url: targetUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch URL',
          message: error instanceof Error ? error.message : 'Network error',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }

    try {
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract the page title
      const title = $('title').first().text().trim();
      console.log('Extracted title:', title);

      // Try to find the best quality icon available
      let favicon: string | null = null;
      let bestIconSize = 0;

      // Helper function to extract size from sizes attribute
      const getSizeFromAttr = (sizesAttr: string | undefined): number => {
        if (!sizesAttr) return 0;
        const match = sizesAttr.match(/(\d+)x\d+/);
        return match ? parseInt(match[1]) : 0;
      };

      // Check all apple-touch-icons and prefer larger sizes
      $('link[rel*="apple-touch-icon"]').each((_, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const sizes = $elem.attr('sizes');
        const size = getSizeFromAttr(sizes);

        if (href && size > bestIconSize) {
          favicon = href;
          bestIconSize = size;
        } else if (href && !favicon) {
          // Use any apple-touch-icon if no sized one found
          favicon = href;
        }
      });

      // If no apple-touch-icon, check for high-res favicon variants
      if (!favicon) {
        $('link[rel="icon"]').each((_, elem) => {
          const $elem = $(elem);
          const href = $elem.attr('href');
          const sizes = $elem.attr('sizes');
          const type = $elem.attr('type');
          const size = getSizeFromAttr(sizes);

          // Prefer larger sizes and PNG/WebP formats
          if (href && size > bestIconSize) {
            favicon = href;
            bestIconSize = size;
          } else if (href && !favicon && (type?.includes('png') || type?.includes('webp'))) {
            favicon = href;
          }
        });
      }

      // Fallback to shortcut icon if nothing else found
      if (!favicon) {
        favicon = $('link[rel="shortcut icon"]').attr('href') || null;
      }

      // Check for mask-icon (Safari pinned tab)
      if (!favicon) {
        favicon = $('link[rel="mask-icon"]').attr('href') || null;
      }

      // Last resort: check Open Graph image
      if (!favicon) {
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
          favicon = ogImage;
        }
      }

      console.log('Best favicon found:', favicon, 'Size:', bestIconSize);

      // If favicon is a relative URL, convert it to absolute
      if (favicon) {
        try {
          if (favicon.startsWith('//')) {
            favicon = urlObj.protocol + favicon;
          } else if (favicon.startsWith('/')) {
            favicon = `${urlObj.protocol}//${urlObj.hostname}${favicon}`;
          } else if (!favicon.startsWith('http')) {
            favicon = `${urlObj.protocol}//${urlObj.hostname}/${favicon.replace(/^\.?\//, '')}`;
          }
          console.log('Processed favicon URL:', favicon);

          // For Open Graph images, verify it's a valid image URL
          if (favicon && (favicon.includes('og:image') || bestIconSize === 0)) {
            console.log('Using Open Graph or fallback image:', favicon);
          }
        } catch (e) {
          console.error('Error processing favicon URL:', e);
          favicon = null;
        }
      } else {
        // Fallback to /favicon.ico if no other icon found
        try {
          favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
          console.log('Using default favicon URL:', favicon);
        } catch (e) {
          console.error('Error constructing favicon URL:', e);
        }
      }

      // Upload favicon to Vercel Blob if we found one
      let faviconBlobUrl = null;
      if (favicon) {
        faviconBlobUrl = await uploadFaviconToBlob(favicon, urlObj.hostname);
      }

      const responseData: FetchUrlResponse = {
        title: title || urlObj.hostname,
        favicon,
        faviconBlobUrl,
        url: targetUrl,
      };

      console.log('Returning response:', JSON.stringify(responseData, null, 2));
      return NextResponse.json(responseData);
    } catch (error) {
      console.error('Error processing HTML:', {
        url: targetUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Even if we couldn't parse the HTML, return the basic URL info
      return NextResponse.json({
        title: urlObj.hostname,
        favicon: null,
        url: targetUrl,
      });
    }
  } catch (error) {
    console.error('Unexpected error in fetch-url endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
