import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export const maxDuration = 30;

const USER_AGENTS = [
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function htmlToText(html: string): string {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  
  document.querySelectorAll('script, style, iframe, noscript').forEach(el => el.remove());
  
  let text = document.body.textContent || '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]+/g, '\n')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url?.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid URL required' },
        { status: 400 }
      );
    }

    for (const agent of USER_AGENTS) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': agent }
        });

        if (res.ok) {
          const html = await res.text();
          const plainText = htmlToText(html);
          
          if (plainText.length > 100) {
            return NextResponse.json({ content: plainText.slice(0, 100000) }); 
          }
        }
      } catch (e) {
        continue; 
      }
    }

    throw new Error('All scraping methods failed');
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to extract text content' },
      { status: 500 }
    );
  }
}