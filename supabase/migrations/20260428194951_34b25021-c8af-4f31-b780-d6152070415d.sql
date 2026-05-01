-- EXCHANGES
CREATE TABLE public.exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  skill_title TEXT NOT NULL DEFAULT '',
  from_user_name TEXT NOT NULL DEFAULT '',
  to_user_name TEXT NOT NULL DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view exchanges"
  ON public.exchanges FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Authenticated can create exchanges"
  ON public.exchanges FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipient can update exchange status"
  ON public.exchanges FOR UPDATE
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Participants can delete exchanges"
  ON public.exchanges FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- PORTFOLIO
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio items"
  ON public.portfolio_items FOR SELECT USING (true);

CREATE POLICY "Owner can insert portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (auth.uid() = user_id);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 5,
  text TEXT NOT NULL DEFAULT '',
  exchange_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = author_id AND auth.uid() <> target_user_id);

CREATE POLICY "Author can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Author can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = author_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchanges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;