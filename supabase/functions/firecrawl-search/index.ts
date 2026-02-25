const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock data for testing
const getMockArticles = (query: string) => {
  const mockArticles = [
    {
      title: `Les dernières actualités sur ${query}`,
      description: `Découvrez les informations récentes concernant ${query}. Cet article explore les développements importants du secteur.`,
      url: `https://example.com/article-${query.replace(/\s+/g, '-').toLowerCase()}-1`,
      markdown: `# ${query}\n\nContenu principal sur ${query}...`,
      screenshot: null,
      statusCode: 200,
    },
    {
      title: `${query} : Analyse approfondie`,
      description: `Une analyse détaillée des tendances actuelles dans le domaine de ${query}`,
      url: `https://example.com/article-${query.replace(/\s+/g, '-').toLowerCase()}-2`,
      markdown: `# Analyse ${query}\n\nDétails et insights...`,
      screenshot: null,
      statusCode: 200,
    },
    {
      title: `Ce qu'il faut savoir sur ${query}`,
      description: `Un guide complet pour comprendre les enjeux clés de ${query}`,
      url: `https://example.com/article-${query.replace(/\s+/g, '-').toLowerCase()}-3`,
      markdown: `# Guide ${query}\n\nInformations essentielles...`,
      screenshot: null,
      statusCode: 200,
    },
  ];
  return mockArticles;
};

Deno.serve(async (req) => {
  console.log('📨 Incoming request:', req.method);
  console.log('📨 Headers:', Object.fromEntries(req.headers));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let query = '';
  
  try {
    const body = await req.json();
    query = body.query;
    const options = body.options;

    if (!query) {
      console.error('❌ Query is required');
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    console.log('🔑 FIRECRAWL_API_KEY exists:', !!apiKey);
    
    if (!apiKey) {
      console.warn('⚠️ FIRECRAWL_API_KEY not configured, using mock data');
      const mockData = getMockArticles(query);
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Searching with Firecrawl:', query);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

    console.log('📊 Firecrawl response status:', response.status);
    const data = await response.json();
    console.log('📦 Firecrawl response data:', data);

    if (!response.ok) {
      console.error('❌ Firecrawl API error:', data);
      // Fallback to mock data on error
      console.log('📋 Using mock data as fallback');
      return new Response(
        JSON.stringify({
          success: true,
          data: getMockArticles(query),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Search successful, results:', data.data?.length || 0);
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error searching:', error);
    // Fallback to mock data on error
    const mockData = query ? getMockArticles(query) : getMockArticles('articles');
    return new Response(
      JSON.stringify({
        success: true,
        data: mockData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
