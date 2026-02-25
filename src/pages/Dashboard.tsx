import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArticleGrid } from '@/components/articles/ArticleGrid';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useArticles } from '@/hooks/useArticles';

export const Dashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { articles, loading, refreshing, refreshArticles, toggleFavorite, toggleRead, deleteArticle } = useArticles();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        onRefresh={refreshArticles}
        isRefreshing={refreshing}
      />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Vos articles du jour</h2>
          <p className="text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''} disponible{articles.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ArticleGrid
          articles={articles}
          onToggleFavorite={toggleFavorite}
          onToggleRead={toggleRead}
          onDelete={deleteArticle}
          loading={loading}
        />
      </main>

      <Footer />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};