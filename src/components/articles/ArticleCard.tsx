import { Article, CATEGORY_LABELS, CATEGORY_COLORS, getDomain } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, Check, Clock, Trash2, Ban, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
  onToggleFavorite: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onBanSource: (sourceUrl: string) => void;
  sourceScore: number;
}

export const ArticleCard = ({ article, onToggleFavorite, onToggleRead, onDelete, onBanSource, sourceScore }: ArticleCardProps) => {
  const flameCount = sourceScore >= 6 ? 3 : sourceScore >= 3 ? 2 : sourceScore >= 1 ? 1 : 0;
  const timeAgo = formatDistanceToNow(new Date(article.scraped_at), {
    addSuffix: true,
    locale: fr,
  });

  const openArticle = () => window.open(article.source_url, '_blank', 'noopener,noreferrer');
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card
      className={`card-hover overflow-hidden cursor-pointer ${article.is_read ? 'opacity-60' : ''}`}
      onClick={openArticle}
    >
      {article.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2" onClick={stop}>
            <Badge variant="secondary" className={`${article.keyword ? 'bg-violet-600' : CATEGORY_COLORS[article.category]} text-white text-xs`}>
              {article.keyword || CATEGORY_LABELS[article.category]}
            </Badge>
            {article.source && (
              <Badge variant="outline" className="text-xs">
                {article.source.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={stop}>
            {flameCount > 0 && (
              <span className="flex items-center gap-0.5 mr-1" title={`Score source : ${sourceScore}`}>
                {Array.from({ length: flameCount }).map((_, i) => (
                  <Flame key={i} className="w-3 h-3 text-orange-400 fill-orange-400" />
                ))}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${article.is_favorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
              onClick={(e) => { stop(e); onToggleFavorite(article.id); }}
            >
              <Star className={`w-4 h-4 ${article.is_favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${article.is_read ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={(e) => { stop(e); onToggleRead(article.id); }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => { stop(e); onDelete(article.id); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-orange-600"
              title={`Bannir ${getDomain(article.source_url)}`}
              onClick={(e) => { stop(e); onBanSource(article.source_url); }}
            >
              <Ban className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-semibold text-lg leading-tight line-clamp-2">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        )}
        <div className="flex items-center justify-between pt-2" onClick={stop}>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={article.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
              Lire
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};