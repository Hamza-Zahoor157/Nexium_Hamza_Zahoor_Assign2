'use client';
import { useState } from 'react';
import { scrapeBlogContent } from '@/lib/scraper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function BlogSummariser() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const scrapedContent = await scrapeBlogContent(url);
      setContent(scrapedContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <Card className="mt-8">
        <CardHeader>
          <h1 className="text-2xl font-bold">Blog Summariser</h1>
          <p className="text-muted-foreground">
            Enter a blog URL to scrape and summarize content
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/blog/post"
                className="flex-1"
                required
              />
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Scrape'}
              </Button>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            
            {content && (
              <div className="mt-6 space-y-2">
                <h2 className="text-xl font-semibold">Scraped Content</h2>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}