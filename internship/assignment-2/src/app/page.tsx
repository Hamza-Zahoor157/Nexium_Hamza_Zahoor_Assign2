'use client';
import { useState } from 'react';
import { clientScrapeBlogContent } from '@/lib/clientScraper';
import { generateMockSummary } from '@/lib/summarizer';
import { translateToUrdu } from '@/lib/translation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function BlogSummariser() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [urduTranslation, setUrduTranslation] = useState('');
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
    setContent('');
    setSummary('');
    setUrduTranslation('');

    try {
      // First try client-side scraping via API
      const scrapedContent = await clientScrapeBlogContent(url);
      setContent(scrapedContent);

      // Generate summary
      const generatedSummary = generateMockSummary(scrapedContent);
      setSummary(generatedSummary);

      // Translate to Urdu
      setUrduTranslation(translateToUrdu(generatedSummary));

    } catch (err) {
      setError(
        err instanceof Error ? 
        err.message : 
        'This website cannot be scraped. Try a different URL.'
      );
      console.error('Scraping error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Blog Summariser</CardTitle>
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Processing...' : 'Scrape'}
              </Button>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {summary && (
              <div className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">AI Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Urdu Translation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap font-urdu" dir="rtl">
                      {urduTranslation}
                    </p>
                  </CardContent>
                </Card>

                <details className="border rounded-lg overflow-hidden">
                  <summary className="bg-muted/50 px-4 py-2 cursor-pointer">
                    Show Original Content
                  </summary>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                  </div>
                </details>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}