import { supabase } from '@/integrations/supabase/client';

const KENYA_LOCATIONS = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Westlands', 'Kilimani', 'Roysambu', 'Thika', 'Kitengela'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 80);
}

async function getSettings() {
  const { data } = await supabase.from('admin_settings' as any).select('key, value');
  return Object.fromEntries(((data || []) as any[]).map((r: any) => [r.key, r.value]));
}

function buildImageUrl(query: string): string {
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
}

async function generateWithGemini(apiKey: string, category: string, count: number): Promise<any[]> {
  const prompt = `Generate ${count} realistic Kenyan classifieds listings for category "${category}".
Return ONLY a valid JSON array. No markdown, no backticks, no explanation.
Each object must have: title (string, max 80 chars), description (string, 2-3 sentences, max 300 chars), price (number, Kenyan shillings), location (one of: ${KENYA_LOCATIONS.join(', ')}), condition (one of: New, Used - Like New, Used - Good, Used - Fair), image_search_query (3-4 word query for photo).
Make listings realistic for Kenyan market. Vary prices, locations, conditions. Return only the JSON array.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

const FALLBACK_TEMPLATES: Record<string, any[]> = {
  Electronics: [
    { title: 'Samsung Galaxy A54 128GB', price: 42000, condition: 'Used - Like New', image_search_query: 'samsung smartphone' },
    { title: 'HP Laptop Core i5 8GB RAM 256GB SSD', price: 38000, condition: 'Used - Good', image_search_query: 'hp laptop computer' },
    { title: 'LG 43 inch Smart TV Full HD', price: 35000, condition: 'New', image_search_query: 'lg smart television' },
    { title: 'Apple iPhone 12 64GB Black', price: 55000, condition: 'Used - Good', image_search_query: 'iphone smartphone' },
    { title: 'Sony PlayStation 4 Slim 500GB', price: 28000, condition: 'Used - Like New', image_search_query: 'playstation gaming console' },
  ],
  Vehicles: [
    { title: 'Toyota Fielder 2014 Silver Manual', price: 850000, condition: 'Used - Good', image_search_query: 'toyota station wagon' },
    { title: 'Honda CB150R Motorcycle Blue', price: 180000, condition: 'Used - Like New', image_search_query: 'honda motorcycle' },
    { title: 'Suzuki Alto 2016 White Automatic', price: 560000, condition: 'Used - Good', image_search_query: 'suzuki small car' },
    { title: 'Nissan Note 2015 Red', price: 720000, condition: 'Used - Good', image_search_query: 'nissan hatchback' },
    { title: 'Toyota Passo 2013 Pearl White', price: 630000, condition: 'Used - Good', image_search_query: 'toyota small car' },
  ],
  'Property Rentals & Sales': [
    { title: 'Bedsitter For Rent Roysambu', price: 8000, condition: 'New', image_search_query: 'studio apartment nairobi' },
    { title: '2 Bedroom Apartment Kilimani', price: 45000, condition: 'New', image_search_query: 'apartment kenya' },
    { title: '1/8 Acre Land Kitengela', price: 850000, condition: 'New', image_search_query: 'land kenya' },
    { title: 'Office Space To Let Westlands', price: 85000, condition: 'New', image_search_query: 'office space nairobi' },
    { title: '3 Bedroom Maisonette Ruaka', price: 12500000, condition: 'New', image_search_query: 'house nairobi kenya' },
  ],
  'Fashion, Health & Beauty': [
    { title: 'Ladies Designer Handbag Leather', price: 2500, condition: 'New', image_search_query: 'leather handbag fashion' },
    { title: "Men's Casual Sneakers Size 40-45", price: 1800, condition: 'New', image_search_query: 'mens sneakers shoes' },
    { title: 'Human Hair Wig 18 Inch Straight', price: 4500, condition: 'New', image_search_query: 'hair wig beauty' },
    { title: 'Waist Trainer Slimming Belt', price: 800, condition: 'New', image_search_query: 'fitness waist trainer' },
    { title: 'MAC Foundation Set Full Coverage', price: 1200, condition: 'New', image_search_query: 'makeup foundation beauty' },
  ],
  'Home, Garden & Kids': [
    { title: 'Sofa Set 7 Seater Modern Design', price: 45000, condition: 'New', image_search_query: 'modern sofa living room' },
    { title: 'Baby Crib With Mattress 0-3 Years', price: 8500, condition: 'New', image_search_query: 'baby crib nursery' },
    { title: 'Gas Cooker 4 Burner Stainless', price: 12000, condition: 'New', image_search_query: 'gas cooker kitchen' },
    { title: 'Dining Table 6 Seater Mahogany', price: 32000, condition: 'Used - Good', image_search_query: 'dining table furniture' },
    { title: 'Kids Bicycle 16 Inch With Training Wheels', price: 5500, condition: 'New', image_search_query: 'kids bicycle' },
  ],
  Services: [
    { title: 'Plumbing Services Nairobi All Areas', price: 1500, condition: 'New', image_search_query: 'plumber plumbing service' },
    { title: 'Professional House Cleaning Service', price: 2500, condition: 'New', image_search_query: 'house cleaning service' },
    { title: 'Graphic Design Logo & Branding', price: 3000, condition: 'New', image_search_query: 'graphic design logo' },
    { title: 'Mobile Car Wash At Your Location', price: 500, condition: 'New', image_search_query: 'car wash service' },
    { title: 'Electrician Services Nairobi', price: 1000, condition: 'New', image_search_query: 'electrician electrical service' },
  ],
};

function getFallbackTemplates(category: string, count: number): any[] {
  const templates = FALLBACK_TEMPLATES[category] || FALLBACK_TEMPLATES['Electronics'];
  return Array.from({ length: count }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      ...t,
      description: `Quality ${t.title} available for sale in Kenya. In ${t.condition} condition. Contact seller for viewing and more details.`,
      location: KENYA_LOCATIONS[i % KENYA_LOCATIONS.length],
    };
  });
}

export async function generateListings(categoryOverride?: string): Promise<{ success: number; errors: number; listings: any[] }> {
  const settings = await getSettings();
  if (settings.ai_listings_enabled === 'false') return { success: 0, errors: 0, listings: [] };

  const category = categoryOverride || settings.ai_default_category || 'Electronics';
  const count = Math.min(parseInt(settings.ai_listings_per_batch || '5'), 20);

  let generated: any[];
  try {
    if (settings.gemini_api_key) {
      generated = await generateWithGemini(settings.gemini_api_key, category, count);
    } else {
      generated = getFallbackTemplates(category, count);
    }
  } catch (e) {
    console.warn('Gemini failed, using fallback:', e);
    generated = getFallbackTemplates(category, count);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get category_id
  const { data: catRow } = await supabase.from('categories').select('id').eq('name', category).maybeSingle();

  const results: any[] = [];
  let success = 0, errors = 0;

  for (const listing of generated) {
    try {
      const imageUrl = buildImageUrl(listing.image_search_query || listing.title);
      const location = listing.location || KENYA_LOCATIONS[Math.floor(Math.random() * KENYA_LOCATIONS.length)];

      const { data: inserted, error } = await supabase.from('ads').insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description,
        price: Number(listing.price) || 0,
        county: location,
        town: location,
        phone: '0700000000',
        condition: listing.condition || 'Used',
        images: [imageUrl],
        badge: 'standard',
        status: 'active',
        ai_generated: true,
        category_id: catRow?.id || null,
      } as any).select().single();

      if (error) throw error;
      results.push(inserted);
      success++;
    } catch (e) {
      console.error('Failed to insert listing:', e);
      errors++;
    }
  }

  return { success, errors, listings: results };
}
