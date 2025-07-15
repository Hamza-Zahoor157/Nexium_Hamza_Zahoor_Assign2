'use client';
import { useState, useEffect } from 'react';
import { clientScrapeBlogContent } from '@/lib/clientScraper';
import { generateMockSummary } from '@/lib/summarizer';
import { translateToUrdu } from '@/lib/translation';
import { saveSummaryToSupabase, fetchSummaries } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { saveBlogContent } from '@/actions/blog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<Summary[]>([]);
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulate progress
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

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
    setProgress(33);

    try {
      const scrapedContent = await clientScrapeBlogContent(url);
      setContent(scrapedContent);
      setProgress(50);

      const generatedSummary = generateMockSummary(scrapedContent);
      setSummary(generatedSummary);
      setProgress(75);

      const generatedUrdu = translateToUrdu(generatedSummary);
      setUrduTranslation(generatedUrdu);
      setProgress(90);

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
      setProgress(100);

      setNotification({
        type: 'success',
        message: `Saved successfully to both databases! Supabase ID: ${supabaseResult.value.id} MongoDB ID: ${mongoResult.value.insertedId}`
      });

      // Show toast notification
      toast.success("Summary saved successfully!", {
      description: "The content has been processed and stored in both databases.",
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
      toast.error("Error processing content", {
      description: errorMessage,
    });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSummaryId(expandedSummaryId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast("Copied to clipboard!");
  };

  return (
    <main className="container mx-auto p-4 max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-center">Blog Summariser</h1>
        <p className="text-muted-foreground text-center">
          Extract, summarize and translate blog content with AI-powered processing
        </p>
      </div>

      {notification && (
        <Alert variant={notification.type === 'success' ? 'default' : 'destructive'}>
          <AlertTitle>
            {notification.type === 'success' ? 'Success!' : 'Error'}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Process New Blog</CardTitle>
          <CardDescription>
            Enter a blog URL to extract and summarize content
          </CardDescription>
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
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !url}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Scrape & Summarize'}
              </Button>
            </div>
            {isLoading && (
              <Progress value={progress} className="h-2" />
            )}
          </form>
        </CardContent>
      </Card>

      {summary && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
            <TabsTrigger value="translation">Urdu Translation</TabsTrigger>
            <TabsTrigger value="original">Original Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Generated Summary</CardTitle>
                <Badge variant="outline">AI Processed</Badge>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {summary}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="translation">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Urdu Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none font-urdu" dir="rtl">
                  {urduTranslation}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="original">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Content</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm p-4 bg-muted/50 rounded-md overflow-auto max-h-[500px]">
                  {content}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {savedSummaries.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Previously Saved Summaries</CardTitle>
            <CardDescription>
              {savedSummaries.length} summaries stored in database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedSummaries.map((item) => (
              <Card key={item.id} className="border">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {new URL(item.url).hostname}
                        </a>
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {new Date(item.created_at).toLocaleString()}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleExpand(item.id)}
                        className="h-8 w-8"
                      >
                        {expandedSummaryId === item.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedSummaryId === item.id && (
                  <>
                    <Separator />
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Summary</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(item.summary, `summary-${item.id}`)}
                              >
                                {copiedId === `summary-${item.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy summary</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {item.summary}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Urdu Translation</h3>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(item.urdu_translation, `urdu-${item.id}`)}
                              >
                                {copiedId === `urdu-${item.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy translation</TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-muted-foreground font-urdu whitespace-pre-wrap" dir="rtl">
                          {item.urdu_translation}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        ID: {item.id}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          Visit Original
                        </a>
                      </Button>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}