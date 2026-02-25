import { Newspaper, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">RTcleZ</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Fait avec</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>pour votre veille quotidienne</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
