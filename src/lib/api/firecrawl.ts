type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type SearchOptions = {
  limit?: number;
  lang?: string;
  country?: string;
  tbs?: string;
};

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

export const firecrawlApi = {
  async scrape(url: string): Promise<FirecrawlResponse> {
    try {
      console.log('🔗 Scraping URL:', url);
      
      if (!FIRECRAWL_API_KEY) {
        console.error('❌ VITE_FIRECRAWL_API_KEY not set');
        return { success: false, error: 'API key not configured' };
      }
      
      const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Firecrawl error:', response.status, error);
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      console.log('✅ Scrape successful');
      return data;
    } catch (err) {
      console.error('❌ Scrape exception:', err);
      return { success: false, error: String(err) };
    }
  },

  async search(query: string, options?: SearchOptions): Promise<FirecrawlResponse> {
    try {
      console.log('🔍 Searching:', query);
      
      if (!FIRECRAWL_API_KEY) {
        console.error('❌ VITE_FIRECRAWL_API_KEY not set');
        return { success: false, error: 'API key not configured' };
      }
      
      const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: options?.limit || 10,
          lang: options?.lang || 'fr',
          country: options?.country || 'FR',
          tbs: options?.tbs,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Firecrawl error:', response.status, error);
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      console.log('✅ Search successful');
      return data;
    } catch (err) {
      console.error('❌ Search exception:', err);
      return { success: false, error: String(err) };
    }
  },
};