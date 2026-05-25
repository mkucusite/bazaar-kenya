-- Ensure timestamp helper exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  category TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  delivery_type TEXT NOT NULL DEFAULT 'link', -- 'link' | 'file' | 'manual'
  delivery_content TEXT, -- url or instructions
  access_mode TEXT NOT NULL DEFAULT 'public', -- 'public' | 'restricted'
  allowed_emails TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_products_published ON public.digital_products(is_published, sort_order DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON public.digital_products(slug);

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published digital products" ON public.digital_products;
CREATE POLICY "Public can view published digital products"
ON public.digital_products FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage digital products" ON public.digital_products;
CREATE POLICY "Admins can manage digital products"
ON public.digital_products FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER trg_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();