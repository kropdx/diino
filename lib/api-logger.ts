import { NextRequest } from 'next/server';

export function logApiRequest(
  request: NextRequest,
  responseTime: number,
  status: number
) {
  if (process.env.NODE_ENV !== 'development') return;

  const logData = {
    method: request.method,
    url: request.url,
    pathname: new URL(request.url).pathname,
    status,
    duration: `${responseTime.toFixed(2)}ms`,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
  };

  // Color code based on response time
  if (responseTime > 1000) {
    console.error('🔴 Slow API Request:', logData);
  } else if (responseTime > 500) {
    console.warn('🟡 Medium API Request:', logData);
  } else {
    console.log('🟢 Fast API Request:', logData);
  }
}