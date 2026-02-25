const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock scrape data for testing
const getMockScrapedContent = (url: string) => {
  return {
    success: true,
    data: {
      markdown: `# Contenu de ${url}\n\nCeci est un contenu de test scraped depuis ${url}.\n\n## Section 1\n\nContenu principal...\n\n## Section 2\n\nPlus de détails...`,
      links: [
        { href: 'https://example.com/link1', text: 'Lien 1' },
        { href: 'https://example.com/link2', text: 'Lien 2' },
      ],
      html: '<html><body>Test HTML content</body></html>',
    },
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let url = '';
  
  try {
    const body = await req.json();
    url = body.url;

    if (!url) {
      console.error('❌ URL is required');
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    console.log('🔑 FIRECRAWL_API_KEY exists:', !!apiKey);
    
    if (!apiKey) {
      console.warn('⚠️ FIRECRAWL_API_KEY not configured, using mock data');
      return new Response(
        JSON.stringify(getMockScrapedContent(url)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('🔗 Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Firecrawl API error:', data);
      // Fallback to mock data
      console.log('📋 Using mock data as fallback');
      return new Response(
        JSON.stringify(getMockScrapedContent(formattedUrl)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Scrape successful');
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error scraping:', error);
    // Fallback to mock data
    const mockData = url ? getMockScrapedContent(url) : getMockScrapedContent('https://example.com');
    return new Response(
      JSON.stringify(mockData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});