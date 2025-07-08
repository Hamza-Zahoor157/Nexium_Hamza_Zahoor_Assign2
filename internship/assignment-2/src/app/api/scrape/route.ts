import { NextResponse } from 'next/server';
import { scrapeBlogContent } from '@/lib/scraper';

export const runtime = 'edge'; // Optional: for better performance

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    const content = await scrapeBlogContent(url);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping failed' },
      { status: 500 }
    );
  }
}