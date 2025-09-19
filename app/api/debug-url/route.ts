import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers = request.headers;
  const host = headers.get('host');
  const protocol = headers.get('x-forwarded-proto') || 'https';
  const origin = headers.get('origin');
  
  return NextResponse.json({
    host,
    protocol,
    origin,
    fullUrl: `${protocol}://${host}`,
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    },
    timestamp: new Date().toISOString()
  });
}