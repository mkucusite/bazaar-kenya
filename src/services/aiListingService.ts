import { supabase } from '@/integrations/supabase/client';

const KENYA_LOCATIONS = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Westlands', 'Kilimani', 'Roysambu', 'Thika', 'Kitengela'];
const DEFAULT_PHONE = '0115475543';
const DEFAULT_WHATSAPP = '0115475543';

async function getSettings() {
  const { data } = await supabase.from('admin_settings' as any).select('key, value');
  return Object.fromEntries(((data || []) as any[]).map((r: any) => [r.key, r.value]));
}

async function generateImageWithGemini(prompt: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-listing-image', {
      body: { prompt },
    });
    if (error || !data?.imageUrl) return null;
    return data.imageUrl;
  } catch {
    return null;
  }
}

function buildFallbackImageUrl(query: string): string {
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
}

async function generateWithGemini(apiKey: string, category: string, count: number): Promise<any[]> {
  const prompt = `Generate ${count} realistic Kenyan classifieds listings for category "${category}".
Return ONLY a valid JSON array. No markdown, no backticks, no explanation.
Each object must have: title (string, max 80 chars), description (string, 2-3 sentences, max 300 chars), price (number, Kenyan shillings), location (one of: ${KENYA_LOCATIONS.join(', ')}), condition (one of: New, Used - Like New, Used - Good, Used - Fair), image_prompt (descriptive prompt for generating a product photo, 10-15 words).
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
    { title: 'Samsung Galaxy A54 128GB', price: 42000, condition: 'Used - Like New', image_prompt: 'Samsung smartphone on desk clean background' },
    { title: 'HP Laptop Core i5 8GB RAM 256GB SSD', price: 38000, condition: 'Used - Good', image_prompt: 'HP laptop computer silver open on desk' },
    { title: 'LG 43 inch Smart TV Full HD', price: 35000, condition: 'New', image_prompt: 'LG smart TV flatscreen modern living room' },
    { title: 'Apple iPhone 12 64GB Black', price: 55000, condition: 'Used - Good', image_prompt: 'iPhone 12 black smartphone clean background' },
    { title: 'Sony PlayStation 4 Slim 500GB', price: 28000, condition: 'Used - Like New', image_prompt: 'PlayStation 4 gaming console with controller' },
  ],
  Vehicles: [
    { title: 'Toyota Fielder 2014 Silver Manual', price: 850000, condition: 'Used - Good', image_prompt: 'Toyota Fielder silver station wagon parked' },
    { title: 'Honda CB150R Motorcycle Blue', price: 180000, condition: 'Used - Like New', image_prompt: 'Honda motorcycle blue sport bike' },
    { title: 'Suzuki Alto 2016 White Automatic', price: 560000, condition: 'Used - Good', image_prompt: 'Suzuki Alto white small car street' },
  ],
  'Property Rentals & Sales': [
    { title: 'Bedsitter For Rent Roysambu', price: 8000, condition: 'New', image_prompt: 'Studio apartment interior modern clean' },
    { title: '2 Bedroom Apartment Kilimani', price: 45000, condition: 'New', image_prompt: 'Modern apartment living room Nairobi' },
    { title: '1/8 Acre Land Kitengela', price: 850000, condition: 'New', image_prompt: 'Empty land plot Kenya fenced' },
  ],
  'Fashion, Health & Beauty': [
    { title: 'Ladies Designer Handbag Leather', price: 2500, condition: 'New', image_prompt: 'Leather handbag brown designer fashion' },
    { title: "Men's Casual Sneakers Size 40-45", price: 1800, condition: 'New', image_prompt: 'Mens sneakers white casual shoes' },
  ],
  'Home, Garden & Kids': [
    { title: 'Sofa Set 7 Seater Modern Design', price: 45000, condition: 'New', image_prompt: 'Modern sofa set grey living room' },
    { title: 'Baby Crib With Mattress 0-3 Years', price: 8500, condition: 'New', image_prompt: 'Baby crib wooden nursery room' },
  ],
  Services: [
    { title: 'Plumbing Services Nairobi All Areas', price: 1500, condition: 'New', image_prompt: 'Professional plumber fixing pipes tools' },
    { title: 'Professional House Cleaning Service', price: 2500, condition: 'New', image_prompt: 'House cleaning service professional maid' },
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

  const { data: catRow } = await supabase.from('categories').select('id').eq('name', category).maybeSingle();

  const results: any[] = [];
  let success = 0, errors = 0;

  for (const listing of generated) {
    try {
      // Try to generate an image
      let imageUrl: string | null = null;
      const imgPrompt = listing.image_prompt || listing.title;
      imageUrl = await generateImageWithGemini(imgPrompt);
      
      if (!imageUrl) {
        imageUrl = buildFallbackImageUrl(imgPrompt);
      }

      const location = listing.location || KENYA_LOCATIONS[Math.floor(Math.random() * KENYA_LOCATIONS.length)];

      const { data: inserted, error } = await supabase.from('ads').insert({
        user_id: user.id,
        title: listing.title,
        description: listing.description,
        price: Number(listing.price) || 0,
        county: location,
        town: location,
        phone: DEFAULT_PHONE,
        whatsapp: DEFAULT_WHATSAPP,
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
