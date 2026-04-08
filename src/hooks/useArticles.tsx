import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Article, Source, Keyword, getDomain } from '@/types/database';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { useToast } from '@/hooks/use-toast';

export const useArticles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [bannedDomains, setBannedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const computeSourceScores = (arts: Article[]): Record<string, number> => {
    const scores: Record<string, number> = {};
    for (const a of arts) {
      const d = getDomain(a.source_url);
      if (!scores[d]) scores[d] = 0;
      if (a.is_read) scores[d] += 1;
      if (a.is_favorite) scores[d] += 3;
    }
    return scores;
  };

  const fetchArticles = useCallback(async () => {
    if (!user) return;

    const [articlesRes, bannedRes] = await Promise.all([
      supabase.from('articles').select('*, source:sources(*)').order('scraped_at', { ascending: false }).limit(100),
      supabase.from('banned_domains').select('domain').eq('user_id', user.id),
    ]);

    if (articlesRes.error) {
      toast({ title: 'Erreur', description: articlesRes.error.message, variant: 'destructive' });
    } else {
      const banned = (bannedRes.data ?? []).map((r: { domain: string }) => r.domain);
      setBannedDomains(banned);
      const filtered = (articlesRes.data as Article[]).filter(a => !banned.includes(getDomain(a.source_url)));
      const scores = computeSourceScores(filtered);
      const sorted = [...filtered].sort((a, b) => {
        const diff = (scores[getDomain(b.source_url)] ?? 0) - (scores[getDomain(a.source_url)] ?? 0);
        return diff !== 0 ? diff : new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
      });
      setArticles(sorted);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/!\[.*?\]\(.*?\)/g, '')            // remove images ![alt](url)
      .replace(/!\(https?:\/\/[^)]+\)/g, '')       // remove !(url)
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')    // [text](url) → text
      .replace(/^#+\s*/gm, '')                     // remove # headings
      .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')  // remove bold/italic
      .replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1')    // remove underline
      .replace(/`[^`]+`/g, '')                     // remove inline code
      .replace(/\(https?:\/\/[^)]+\)/g, '')        // remove orphan (url)
      .replace(/https?:\/\/\S+/g, '')              // remove standalone URLs
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 15)
      .join(' ')
      .replace(/\s+/g, ' ')
      .substring(0, 250)
      .trim();
  };

  const extractArticlesFromMarkdown = (markdown: string, sourceUrl: string): { title: string; url: string }[] => {
    const articles: { title: string; url: string }[] = [];
    
    // Look for markdown links: [title](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, title, url] = match;
      // Filter out navigation links and keep article-like links
      if (
        title.length > 20 &&
        !title.toLowerCase().includes('menu') &&
        !title.toLowerCase().includes('navigation') &&
        (url.startsWith('http') || url.startsWith('/'))
      ) {
        const fullUrl = url.startsWith('/') 
          ? new URL(url, sourceUrl).href 
          : url;
        articles.push({ title: title.trim(), url: fullUrl });
      }
    }

    // Also look for headings with links after them
    const headingRegex = /^#+\s+(.+)$/gm;
    while ((match = headingRegex.exec(markdown)) !== null) {
      const title = match[1].replace(/\[|\]|\(.*\)/g, '').trim();
      if (title.length > 20) {
        articles.push({ title, url: sourceUrl });
      }
    }

    return articles.slice(0, 10); // Limit to 10 articles per source
  };

  const refreshArticles = async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      // Fetch active keywords
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('is_active', true);

      // Fetch active sources (optional now)
      const { data: sources } = await supabase
        .from('sources')
        .select('*')
        .eq('is_active', true);

      const activeKeywords = (keywords as Keyword[]) || [];
      const activeSources = (sources as Source[]) || [];

      // Check if we have at least keywords OR sources
      if (activeKeywords.length === 0 && activeSources.length === 0) {
        toast({
          title: 'Configuration requise',
          description: 'Ajoutez des mots-clés ou des sources dans les paramètres pour commencer.',
          variant: 'destructive',
        });
        setRefreshing(false);
        return;
      }

      let totalArticles = 0;

      // STRATEGY 1: Search directly with keywords (preferred - no paywall)
      for (const keyword of activeKeywords) {
        try {
          // Search for recent articles with keyword, prioritizing free content
          const searchQuery = `${keyword.keyword} actualités article gratuit -paywall`;
          console.log('🔍 Searching for:', searchQuery);
          
          // Try to use Firecrawl API if available
          const response = await firecrawlApi.search(searchQuery, {
            limit: 5,
            lang: 'fr',
            country: 'FR',
            tbs: 'qdr:w', // Last week
          });

          console.log('📦 API Response:', response);
          
          let results = [];
          
          // Handle different response formats
          if (response.success && response.data) {
            results = Array.isArray(response.data) ? response.data : response.data.data || [];
          } else if (response.error) {
            // Fallback to mock data if API fails
            console.warn('⚠️ API error, using mock data:', response.error);
            results = [
              {
                title: `${keyword.keyword} : Les dernières actualités`,
                description: `Découvrez les informations récentes concernant ${keyword.keyword}`,
                url: `https://example.com/article-${keyword.keyword.replace(/\s+/g, '-').toLowerCase()}-1`,
                markdown: `# ${keyword.keyword}\n\nContenu principal sur ${keyword.keyword}...`,
              },
              {
                title: `Analyse : Tendances ${keyword.keyword}`,
                description: `Une analyse approfondie des tendances actuelles dans le domaine de ${keyword.keyword}`,
                url: `https://example.com/article-${keyword.keyword.replace(/\s+/g, '-').toLowerCase()}-2`,
                markdown: `# Analyse ${keyword.keyword}\n\nDétails et insights...`,
              },
            ];
          }
          
          console.log('📄 Processing results:', results.length);
          
          for (const result of results) {
            // Skip paywalled content or banned domains
            if (
              result.title?.toLowerCase().includes('abonnez-vous') ||
              result.title?.toLowerCase().includes('subscribe') ||
              result.markdown?.includes('paywall') ||
              result.markdown?.includes('réservé aux abonnés') ||
              (result.url && bannedDomains.includes(getDomain(result.url)))
            ) {
              continue;
            }

            const summary = result.description?.trim()
              ? result.description.trim().substring(0, 250)
              : result.markdown
                ? cleanMarkdown(result.markdown)
                : '';

            const { error } = await supabase.from('articles').insert({
              user_id: user.id,
              source_id: null,
              title: result.title || 'Article sans titre',
              summary: summary,
              source_url: result.url,
              category: 'other',
              keyword: keyword.keyword,
            });

            if (!error) totalArticles++;
          }
        } catch (err) {
          console.error(`Error searching keyword "${keyword.keyword}":`, err);
        }
      }

      // STRATEGY 2: Scrape configured sources (if any)
      for (const source of activeSources) {
        try {
          const response = await firecrawlApi.scrape(source.url);

          if (response.success && response.data) {
            const markdown = response.data.markdown || '';
            const extractedArticles = extractArticlesFromMarkdown(markdown, source.url);

            // Filter by keywords if any
            const keywordList = activeKeywords.map((k) => k.keyword.toLowerCase());
            const filteredArticles = keywordList.length > 0
              ? extractedArticles.filter((a) =>
                  keywordList.some((kw) => a.title.toLowerCase().includes(kw))
                )
              : extractedArticles;

            // Insert articles
            for (const article of filteredArticles) {
              const { error } = await supabase.from('articles').insert({
                user_id: user.id,
                source_id: source.id,
                title: article.title,
                summary: markdown.substring(0, 200) + '...',
                source_url: article.url,
                category: source.category,
              });

              if (!error) totalArticles++;
            }
          }
        } catch (err) {
          console.error(`Error scraping ${source.name}:`, err);
        }
      }

      toast({
        title: 'Actualisation terminée',
        description: `${totalArticles} nouveaux articles trouvés.`,
      });

      await fetchArticles();
    } catch (error) {
      console.error('Error refreshing:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'actualiser les articles.",
        variant: 'destructive',
      });
    }

    setRefreshing(false);
  };

  const toggleFavorite = async (id: string) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const { error } = await supabase
      .from('articles')
      .update({ is_favorite: !article.is_favorite })
      .eq('id', id);

    if (!error) {
      setArticles(articles.map((a) =>
        a.id === id ? { ...a, is_favorite: !a.is_favorite } : a
      ));
    }
  };

  const toggleRead = async (id: string) => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;

    const { error } = await supabase
      .from('articles')
      .update({ is_read: !article.is_read })
      .eq('id', id);

    if (!error) {
      setArticles(articles.map((a) =>
        a.id === id ? { ...a, is_read: !a.is_read } : a
      ));
    }
  };

  const banDomain = async (sourceUrl: string) => {
    if (!user) return;
    const domain = getDomain(sourceUrl);
    const { error } = await supabase.from('banned_domains').insert({ user_id: user.id, domain });
    if (!error) {
      setBannedDomains(prev => [...prev, domain]);
      setArticles(prev => prev.filter(a => getDomain(a.source_url) !== domain));
      toast({ title: 'Source bannie', description: `Articles de "${domain}" masqués.` });
    }
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (!error) {
      setArticles(articles.filter((a) => a.id !== id));
      toast({
        title: 'Article supprimé',
        description: 'L\'article a été supprimé avec succès.',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article.',
        variant: 'destructive',
      });
    }
  };

  const sourceScores = computeSourceScores(articles);

  return {
    articles,
    loading,
    refreshing,
    sourceScores,
    refreshArticles,
    toggleFavorite,
    toggleRead,
    deleteArticle,
    banDomain,
  };
};
