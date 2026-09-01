import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { rows, secret } = await req.json()
    if (secret !== Deno.env.get('SEED_SECRET')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: 'rows must be array' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error, count } = await supa.from('blog_posts').upsert(rows, { onConflict: 'slug', ignoreDuplicates: true, count: 'exact' })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ inserted: count ?? rows.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
