-- Table for user-banned source domains
CREATE TABLE public.banned_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, domain)
);

ALTER TABLE public.banned_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their banned domains" ON public.banned_domains
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
