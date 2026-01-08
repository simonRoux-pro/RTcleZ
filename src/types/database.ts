export type ArticleCategory = 'tech' | 'business' | 'science' | 'politics' | 'health' | 'sports' | 'entertainment' | 'other';

export interface Source {
  id: string;
  user_id: string;
  name: string;
  url: string;
  category: ArticleCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: string;
  user_id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  user_id: string;
  source_id: string | null;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_url: string;
  category: ArticleCategory;
  scraped_at: string;
  is_read: boolean;
  is_favorite: boolean;
  source?: Source;
}

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  tech: 'Tech',
  business: 'Business',
  science: 'Science',
  politics: 'Politique',
  health: 'Santé',
  sports: 'Sports',
  entertainment: 'Divertissement',
  other: 'Autre',
};

export const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  tech: 'bg-blue-500',
  business: 'bg-green-500',
  science: 'bg-purple-500',
  politics: 'bg-red-500',
  health: 'bg-pink-500',
  sports: 'bg-orange-500',
  entertainment: 'bg-yellow-500',
  other: 'bg-gray-500',
};