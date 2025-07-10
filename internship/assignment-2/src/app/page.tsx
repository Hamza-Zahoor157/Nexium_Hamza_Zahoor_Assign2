'use client';
import { useState } from 'react';
import { clientScrapeBlogContent } from '@/lib/clientScraper';
import { generateMockSummary } from '@/lib/summarizer';
import { translateToUrdu } from '@/lib/translation';
import { saveSummaryToSupabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function BlogSummariser() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [urduTranslation, setUrduTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setNotification({ type: 'error', message: 'Please enter a URL' });
      return;
    }

    setIsLoading(true);
    setNotification(null);
    setContent('');
    setSummary('');
    setUrduTranslation('');

    try {
      const scrapedContent = await clientScrapeBlogContent(url);
      setContent(scrapedContent);

      const generatedSummary = generateMockSummary(scrapedContent);
      setSummary(generatedSummary);

      const generatedUrdu = translateToUrdu(generatedSummary);
      setUrduTranslation(generatedUrdu);

      await saveSummaryToSupabase(url, generatedSummary, generatedUrdu);
      
      setNotification({
        type: 'success',
        message: 'Blog summary saved successfully!'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process blog content';
      setNotification({
        type: 'error',
        message: errorMessage
      });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-4xl space-y-4">
      {/* Notification Alert */}
      {notification && (
        <Alert variant={notification.type === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>
            {notification.type === 'success' ? 'Success!' : 'Error'}
          </AlertTitle>
          <AlertDescription>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <Card>
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Scrape'}
              </Button>
            </div>

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