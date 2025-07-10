import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Summary {
  id: string;
  url: string;
  summary: string;
  urdu_translation: string;
  created_at: string;
}

export async function saveSummaryToSupabase(
  url: string,
  summary: string,
  urduTranslation: string
): Promise<Summary> {
  const { data, error } = await supabase
    .from('summaries')
    .insert({
      url,
      summary,
      urdu_translation: urduTranslation
    })
    .select('*')
    .single();

  if (error) {
    console.error('Supabase error details:', error);
    throw new Error(`Failed to save summary: ${error.message}`);
  }

  return data;
}

export async function fetchSummaries(): Promise<Summary[]> {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}