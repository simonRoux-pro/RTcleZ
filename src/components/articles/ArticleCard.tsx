import { Article, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, Check, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArticleCardProps {
  article: Article;
  onToggleFavorite: (id: string) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ArticleCard = ({ article, onToggleFavorite, onToggleRead, onDelete }: ArticleCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(article.scraped_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Card className={`card-hover overflow-hidden ${article.is_read ? 'opacity-60' : ''}`}>
      {article.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className={`${CATEGORY_COLORS[article.category]} text-white text-xs`}>
              {CATEGORY_LABELS[article.category]}
            </Badge>
            {article.source && (
              <Badge variant="outline" className="text-xs">
                {article.source.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${article.is_favorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
              onClick={() => onToggleFavorite(article.id)}
            >
              <Star className={`w-4 h-4 ${article.is_favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${article.is_read ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => onToggleRead(article.id)}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(article.id)}
            >
              <Trash2 className="w-4 h-4" />
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
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
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