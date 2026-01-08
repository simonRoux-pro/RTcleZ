import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Article, Source, Keyword } from '@/types/database';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { useToast } from '@/hooks/use-toast';

export const useArticles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArticles = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('articles')
      .select('*, source:sources(*)')
      .order('scraped_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setArticles(data as Article[]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

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
      // Fetch active sources
      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .eq('is_active', true);

      if (sourcesError) throw sourcesError;
      if (!sources || sources.length === 0) {
        toast({
          title: 'Aucune source',
          description: 'Ajoutez des sources dans les paramètres pour commencer.',
          variant: 'destructive',
        });
        setRefreshing(false);
        return;
      }

      // Fetch keywords
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*')
        .eq('is_active', true);

      let totalArticles = 0;

      for (const source of sources as Source[]) {
        try {
          const response = await firecrawlApi.scrape(source.url);

          if (response.success && response.data) {
            const markdown = response.data.markdown || '';
            const extractedArticles = extractArticlesFromMarkdown(markdown, source.url);

            // Filter by keywords if any
            const keywordList = (keywords as Keyword[] || []).map((k) => k.keyword.toLowerCase());
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

  return {
    articles,
    loading,
    refreshing,
    refreshArticles,
    toggleFavorite,
    toggleRead,
  };
};
