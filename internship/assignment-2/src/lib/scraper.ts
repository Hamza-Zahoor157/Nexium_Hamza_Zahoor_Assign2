import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeBlogContent(url: string): Promise<string> {
  if (!url.match(/^https?:\/\//i)) {
    throw new Error('Invalid URL - must start with http:// or https://');
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 8000,
      maxRedirects: 3
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, footer, iframe, img, noscript').remove();
    
    // Priority content selectors
    const contentSelectors = [
      'article', 
      '.article-body',
      '.post-content',
      'main > .content',
      'body'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text.length > content.length) content = text;
    }

    return content
      .replace(/\s+/g, ' ')
      .replace(/\[.*?\]/g, '')
      .trim();
  } catch (error) {
    
    console.error(`Scraping failed for ${url}:`, error);
    throw new Error('Failed to fetch content. The website may be blocking automated requests.');
    
  }
}