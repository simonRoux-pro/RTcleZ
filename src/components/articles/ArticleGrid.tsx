import { Article, ArticleCategory, CATEGORY_LABELS } from '@/types/database';
import { ArticleCard } from './ArticleCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Star } from 'lucide-react';
import { useState } from 'react';

interface ArticleGridProps {
  articles: Article[];
  onToggleFavorite: (id: string) => void;
  onToggleRead: (id: string) => void;
  loading: boolean;
}

export const ArticleGrid = ({ articles, onToggleFavorite, onToggleRead, loading }: ArticleGridProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | 'all'>('all');
  const [showFavorites, setShowFavorites] = useState(false);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.summary?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesFavorite = !showFavorites || article.is_favorite;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ArticleCategory | 'all')}>
            <SelectTrigger className="w-40 bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFavorites ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {articles.length === 0 
              ? 'Aucun article. Ajoutez des sources et actualisez pour commencer !'
              : 'Aucun article ne correspond à vos filtres.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleFavorite={onToggleFavorite}
              onToggleRead={onToggleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};