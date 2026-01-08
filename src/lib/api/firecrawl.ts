import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type SearchOptions = {
  limit?: number;
  lang?: string;
  country?: string;
  tbs?: string; // Time filter: 'qdr:h' (hour), 'qdr:d' (day), 'qdr:w' (week), 'qdr:m' (month)
};

export const firecrawlApi = {
  async scrape(url: string): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Search the web directly using keywords
  async search(query: string, options?: SearchOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: { query, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};