import { supabase } from '@/integrations/supabase/client';

async function getSettings() {
  const { data } = await supabase.from('admin_settings' as any).select('key, value');
  return Object.fromEntries(((data || []) as any[]).map((r: any) => [r.key, r.value]));
}

export async function generateListings(categoryOverride?: string): Promise<{ success: number; errors: number; listings: any[] }> {
  const settings = await getSettings();

  if (settings.ai_listings_enabled === 'false') {
    return { success: 0, errors: 0, listings: [] };
  }

  const listingsCount = Math.min(Math.max(parseInt(settings.ai_listings_per_batch || '20', 10), 1), 60);

  const { data, error } = await supabase.functions.invoke('auto-publish-content', {
    body: {
      source: 'manual',
      mode: 'listings',
      categoryOverride: categoryOverride || null,
      listingsCount,
    },
  });

  if (error) throw new Error(error.message || 'Failed to generate listings');
  if (data?.error) throw new Error(data.error);

  return {
    success: Number(data?.listings?.success || 0),
    errors: Number(data?.listings?.errors || 0),
    listings: Array.isArray(data?.listings?.items) ? data.listings.items : [],
  };
}
