import { scrapeBlogContent } from './scraper'; // Add this import

export async function clientScrapeBlogContent(url: string): Promise<string> {
  try {
    // First try the API route
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    const { content } = await response.json();
    return content;
    
  } catch (apiError) {
    console.warn('API scraping failed, trying direct:', apiError);
    
    // Fallback to direct scraping
    try {
      return await scrapeBlogContent(url);
    } catch (directError) {
      throw new Error(
        `Both API and direct scraping failed:\n` +
        `API Error: ${apiError instanceof Error ? apiError.message : 'Unknown'}\n` +
        `Direct Error: ${directError instanceof Error ? directError.message : 'Unknown'}`
      );
    }
  }
}