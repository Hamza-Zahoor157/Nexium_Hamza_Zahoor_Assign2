export async function clientScrapeBlogContent(url: string): Promise<string> {
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error(`API request failed`);
    
    const { content } = await response.json();
    
    if (!content) throw new Error('No content received');
    return content;
    
  } catch (error) {
    console.error('Scraping failed:', error);
    throw new Error(
      `Failed to get content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}