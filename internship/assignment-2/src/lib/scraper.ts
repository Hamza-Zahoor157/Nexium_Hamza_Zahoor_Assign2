import * as cheerio from 'cheerio';
import axios from 'axios';

export async function scrapeBlogContent(url: string): Promise<string> {
  try {
    if (!url.match(/^https?:\/\//i)) {
      throw new Error('Invalid URL format');
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    $('script, style, nav, footer, iframe, img').remove();
    
    const selectors = [
      'article', 
      '.post-content',
      '.article-content',
      'main',
      'body'
    ];

    let content = '';
    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        content += $(element).text() + '\n';
      });
    });

    return content.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('Failed to scrape blog content. Please check the URL and try again.');
  }
}