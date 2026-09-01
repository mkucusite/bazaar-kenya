UPDATE public.site_config SET value = '500', updated_at = now() WHERE key = 'campaign_basic_banner_price';
UPDATE public.site_config SET value = '1000', updated_at = now() WHERE key = 'campaign_featured_business_price';
UPDATE public.site_config SET value = '2000', updated_at = now() WHERE key = 'campaign_category_sponsor_price';
INSERT INTO public.site_config (key, value) SELECT 'campaign_basic_banner_price', '500' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_basic_banner_price');
INSERT INTO public.site_config (key, value) SELECT 'campaign_featured_business_price', '1000' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_featured_business_price');
INSERT INTO public.site_config (key, value) SELECT 'campaign_category_sponsor_price', '2000' WHERE NOT EXISTS (SELECT 1 FROM public.site_config WHERE key='campaign_category_sponsor_price');