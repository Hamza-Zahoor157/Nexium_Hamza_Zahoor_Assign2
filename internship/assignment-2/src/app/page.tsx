'use client';
import { useState, useEffect } from 'react';
import { clientScrapeBlogContent } from '@/lib/clientScraper';
import { generateMockSummary } from '@/lib/summarizer';
import { translateToUrdu } from '@/lib/translation';
import { saveSummaryToSupabase, fetchSummaries } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { saveBlogContent } from '@/actions/blog'; 

interface Summary {
  id: string;
  url: string;
  summary: string;
  urdu_translation: string;
  created_at: string;
}

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
  const [savedSummaries, setSavedSummaries] = useState<Summary[]>([]);

  // Load saved summaries on mount
  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const summaries = await fetchSummaries();
        setSavedSummaries(summaries);
      } catch (error) {
        console.error('Failed to load summaries:', error);
      }
    };
    loadSummaries();
  }, []);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!url.startsWith('http')) {
    setNotification({ type: 'error', message: 'URL must start with http:// or https://' });
    return;
  }

  setIsLoading(true);
  setNotification(null);

  try {
    const scrapedContent = await clientScrapeBlogContent(url);
    setContent(scrapedContent);

    const generatedSummary = generateMockSummary(scrapedContent);
    setSummary(generatedSummary);

    const generatedUrdu = translateToUrdu(generatedSummary);
    setUrduTranslation(generatedUrdu);

    const [supabaseResult, mongoResult] = await Promise.allSettled([
      saveSummaryToSupabase(url, generatedSummary, generatedUrdu),
      saveBlogContent(url, scrapedContent)
    ]);

    if (supabaseResult.status === 'rejected') {
      throw new Error(`Supabase save failed: ${supabaseResult.reason}`);
    }

    if (mongoResult.status === 'rejected') {
      throw new Error(`MongoDB save failed: ${mongoResult.reason}`);
    }
    
    if (!mongoResult.value.success) {
      throw new Error(mongoResult.value.error);
    }
    setSavedSummaries(prev => [supabaseResult.value, ...prev]);

    setNotification({
      type: 'success',
      message: `Saved successfully! MongoDB ID: ${mongoResult.value.insertedId}`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Failed to process blog content';
    
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

        <CardContent className="space-y-6">
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
          </form>

          {summary && (
            <div className="space-y-4">
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
        </CardContent>
      </Card>

      {savedSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Previously Saved Summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedSummaries.map((item) => (
              <Card key={item.id} className="border">
                <CardHeader>
                  <CardTitle className="text-lg">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {new URL(item.url).hostname}
                    </a>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">Summary:</p>
                  <p className="whitespace-pre-wrap text-sm">{item.summary}</p>
                  <p className="font-medium mt-2">Urdu Translation:</p>
                  <p className="whitespace-pre-wrap text-sm font-urdu" dir="rtl">
                    {item.urdu_translation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}