-- Add keyword column to articles to track which keyword triggered the article fetch
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS keyword TEXT;
