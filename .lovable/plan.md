

## Problem

KenyaAdvert is a Single Page Application. When anyone shares a link (e.g. `kenyaadverts.co.ke/advertise`) on WhatsApp or social media, the crawler fetches `index.html` which has **hardcoded homepage OG meta tags**. The SEOHead component updates meta client-side via JavaScript, but crawlers like WhatsApp/Facebook/Twitter **do not execute JavaScript** -- so every shared link shows the homepage title, description, and image regardless of the actual page.

The current `og-share` edge function only handles `/share/ad/:slug` and `/share/blog/:slug`. Regular page URLs are not covered.

## Solution

Expand the `og-share` edge function to handle **all page types** -- ads, blogs, AND static pages (advertise, about, search, etc.). Then update the Vercel rewrite rules so that **all shareable page URLs** route through the edge function when accessed by crawlers.

### Implementation Steps

**1. Expand og-share edge function to handle page routes**

Add a `page` type handler that:
- Looks up `seo_settings` table for the page slug
- Falls back to hardcoded meta for known pages (`/advertise`, `/about`, `/search`, `/blog`, `/faqs`, `/safety-tips`, `/privacy`, `/terms`, `/credits`, `/subscriptions`)
- Returns proper OG HTML with the correct title, description, and OG image
- Redirects real users to the actual page

**2. Add Vercel rewrites for page share URLs**

Add rewrite rules in `vercel.json`:
```
/share/page/:slug -> og-share/page/:slug
```

**3. Create share URL helpers for pages**

Add `getPageShareUrl` to `src/lib/ad-links.ts`:
```typescript
export const getPageShareUrl = (slug: string) =>
  `${SITE_URL}/share/page/${encodeURIComponent(slug)}`;
```

**4. Define page-specific OG metadata in the edge function**

Hardcoded map for known pages with proper titles, descriptions, and OG images:
- `/advertise` -- "Advertise With Us | KenyaAdvert" with `/og/og-post-ad.png`
- `/about` -- "About KenyaAdvert" with `/og/og-about.png`
- `/search` -- "Search Classifieds | KenyaAdvert" with `/og/og-search.png`
- `/blog` -- "Blog | KenyaAdvert" with `/og/og-blog.png`
- `/faqs` -- "FAQs | KenyaAdvert" with `/og/og-faqs.png`
- `/safety-tips`, `/privacy`, `/terms`, `/credits`, `/subscriptions`, `/login`, `/register`
- Falls back to `seo_settings` DB lookup for any page not in the hardcoded map

**5. No changes to how ads and blogs work**

The existing `/share/ad/:slug` and `/share/blog/:slug` routes remain unchanged.

### Files to change

- `supabase/functions/og-share/index.ts` -- Add page route handler with hardcoded + DB-backed meta
- `vercel.json` -- Add `/share/page/:slug` rewrite
- `src/lib/ad-links.ts` -- Add `getPageShareUrl` helper

This ensures every link shared on WhatsApp/social shows its own unique title, description, and image instead of the homepage defaults.

