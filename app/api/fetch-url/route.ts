import { NextRequest, NextResponse } from 'next/server';

// Simple URL metadata fetching - in production, you'd want to use a proper metadata scraping library
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // For now, return simple metadata
    // In production, you'd use a library like metascraper or similar
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace('www.', '');
    
    return NextResponse.json({
      url,
      title: domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      faviconBlobUrl: null,
    });
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch URL metadata' }, { status: 500 });
  }
} 