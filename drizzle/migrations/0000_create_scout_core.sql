CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE public.tri_state AS ENUM ('include','exclude','neutral');
CREATE TYPE public.screening_status AS ENUM ('pending','rejected_text','rejected_vision','maybe','passed');
CREATE TYPE public.price_type AS ENUM ('fixed','offer','current_bid');
CREATE TYPE public.swipe_action AS ENUM ('like','pass','super_like');
CREATE TYPE public.run_status AS ENUM ('queued','running','completed','failed','paused');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'dealer' CHECK (role IN ('dealer','admin')),
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.screening_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  periods jsonb NOT NULL DEFAULT '{}'::jsonb,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  countries jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  min_price_gbp numeric(12,2) NOT NULL DEFAULT 0,
  max_price_gbp numeric(12,2) NOT NULL DEFAULT 5000,
  min_margin_gbp numeric(12,2) NOT NULL DEFAULT 250,
  hide_reproductions boolean NOT NULL DEFAULT true,
  taste_bargain_blend numeric(4,3) NOT NULL DEFAULT 0.55 CHECK (taste_bargain_blend BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screening_profiles TO authenticated;
GRANT ALL ON public.screening_profiles TO service_role;
ALTER TABLE public.screening_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screening_profile_own" ON public.screening_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.period_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL,
  language_code text NOT NULL,
  terms text[] NOT NULL,
  UNIQUE(period_name, language_code)
);
GRANT SELECT ON public.period_terms TO authenticated;
GRANT ALL ON public.period_terms TO service_role;
ALTER TABLE public.period_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "period_terms_authenticated_read" ON public.period_terms FOR SELECT TO authenticated USING (true);

CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text NOT NULL,
  actor_id text,
  marketplace_code text,
  input_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  browser_fallback_enabled boolean NOT NULL DEFAULT false,
  browser_fallback_status text NOT NULL DEFAULT 'unavailable',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_authenticated_read" ON public.sources FOR SELECT TO authenticated USING (true);

CREATE TABLE public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.sources(id),
  search_query text NOT NULL,
  status public.run_status NOT NULL DEFAULT 'queued',
  apify_run_id text,
  items_found integer NOT NULL DEFAULT 0,
  items_imported integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.ingestion_runs TO service_role;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingestion_runs_authenticated_read" ON public.ingestion_runs FOR SELECT TO authenticated USING (true);

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.sources(id),
  country text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2),
  currency text,
  price_gbp numeric(12,2),
  price_kind public.price_type NOT NULL DEFAULT 'fixed',
  auction_end_time timestamptz,
  image_urls text[] NOT NULL DEFAULT '{}',
  stored_image_paths text[] NOT NULL DEFAULT '{}',
  listing_url text NOT NULL UNIQUE,
  location text,
  seller_type text,
  posted_date timestamptz,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingestion_run_id uuid REFERENCES public.ingestion_runs(id),
  screening_status public.screening_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_authenticated_read" ON public.listings FOR SELECT TO authenticated USING (true);
CREATE INDEX listings_feed_idx ON public.listings(screening_status, created_at DESC);

CREATE TABLE public.listing_tags (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text,
  period text NOT NULL,
  secondary_period text,
  decade_range text,
  style text,
  origin_country text,
  attribution text,
  materials text[] NOT NULL DEFAULT '{}',
  condition_notes text,
  is_reproduction text NOT NULL DEFAULT 'unsure' CHECK (is_reproduction IN ('true','false','unsure')),
  red_flags text[] NOT NULL DEFAULT '{}',
  resale_low_gbp numeric(12,2),
  resale_high_gbp numeric(12,2),
  period_confidence numeric(4,3),
  valuation_confidence numeric(4,3),
  dealer_note text,
  is_furniture boolean NOT NULL DEFAULT true,
  model_id text NOT NULL DEFAULT 'openai/gpt-6-astra',
  embedding vector(3072),
  embedding_model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listing_tags TO authenticated;
GRANT ALL ON public.listing_tags TO service_role;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listing_tags_authenticated_read" ON public.listing_tags FOR SELECT TO authenticated USING (true);

CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  action public.swipe_action NOT NULL,
  ordered_by text NOT NULL,
  ranker_a_score numeric,
  ranker_b_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swipes TO authenticated;
GRANT ALL ON public.swipes TO service_role;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swipes_own" ON public.swipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.shortlist (
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.shortlist TO authenticated;
GRANT ALL ON public.shortlist TO service_role;
ALTER TABLE public.shortlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shortlist_own" ON public.shortlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.screening_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  decision public.screening_status NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screening_overrides TO authenticated;
GRANT ALL ON public.screening_overrides TO service_role;
ALTER TABLE public.screening_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overrides_own" ON public.screening_overrides FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.job_state (
  job_name text PRIMARY KEY,
  status public.run_status NOT NULL DEFAULT 'queued',
  lease_until timestamptz,
  cursor text,
  pause_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.job_state TO service_role;
ALTER TABLE public.job_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') $$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
CREATE POLICY "admins_manage_sources" ON public.sources FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admins_manage_runs" ON public.ingestion_runs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.sources (name,country,actor_id,marketplace_code,input_template,browser_fallback_enabled) VALUES
('Leboncoin','France','clearpath~leboncoin-api','FR','{"adLimit":10,"includeSeller":false}',true),
('Wallapop','Spain','blackfalcondata~wallapop-scraper','ES','{"country":"ES","includeDetails":false}',true),
('Kleinanzeigen','Germany','beatanalytics~kleinanzeigen-scraper','DE','{"pictureRequired":true}',true),
('Catawiki','Europe','solidcode~catawiki-scraper','EU','{}',false),
('eBay UK','United Kingdom','automation-lab~ebay-scraper','UK','{"maxSearchPages":1}',false),
('eBay Germany','Germany','automation-lab~ebay-scraper','DE','{"maxSearchPages":1}',false),
('Gumtree','United Kingdom','memo23~gumtree-cheerio','UK','{"gumtreeSearchRegion":"UK"}',true),
('Marktplaats','Netherlands','haketa~marktplaats-scraper','NL','{}',true),
('Subito','Italy','nogards95~subito-scraper','IT','{"maxPages":1,"category":"furniture"}',true);

INSERT INTO public.period_terms (period_name,language_code,terms) VALUES
('Art Deco','en',ARRAY['art deco']),('Art Deco','fr',ARRAY['art déco','fauteuil art deco']),('Art Deco','de',ARRAY['art déco','art deco sessel']),('Art Deco','it',ARRAY['art déco','stile déco']),('Art Deco','es',ARRAY['art déco']),('Art Deco','nl',ARRAY['art deco']),
('Mid Century Modern','en',ARRAY['mid century modern','midcentury']),('Mid Century Modern','fr',ARRAY['moderniste années 50','vintage scandinave']),('Mid Century Modern','de',ARRAY['mid century','60er jahre design']),('Mid Century Modern','it',ARRAY['modernariato']),('Mid Century Modern','es',ARRAY['moderno de mediados de siglo']),('Mid Century Modern','nl',ARRAY['mid century','deens design']),
('Art Nouveau','en',ARRAY['art nouveau']),('Art Nouveau','fr',ARRAY['art nouveau']),('Art Nouveau','de',ARRAY['jugendstil']),('Art Nouveau','it',ARRAY['stile liberty']),('Art Nouveau','es',ARRAY['modernismo']),('Art Nouveau','nl',ARRAY['jugendstil']);