import { NextResponse } from 'next/server';
import { scrapeBlogContent } from '@/lib/scraper';

export const runtime = 'edge'; 

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid URL starting with http:// or https:// is required' },
        { status: 400 }
      );
    }

    const content = await scrapeBlogContent(url);
    return NextResponse.json({ content });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? 
          error.message : 
          'Internal server error during scraping' 
      },
      { status: 500 }
    );
  }
}