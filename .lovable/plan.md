

## Problem

Both sitemaps return 404 on the live site (`kenyaadverts.co.ke`):
- `/sitemap.xml` — exists in `public/` but the **PWA service worker** intercepts it and serves `index.html` instead (React Router then shows 404)
- `/sitemap-dynamic.xml` — relies on a `vercel.json` rewrite, but your site is hosted on **Lovable hosting, not Vercel**, so that rewrite never applies

## Fix Plan

### 1. Fix the service worker intercepting XML files
In `vite.config.ts`, update the PWA workbox `navigateFallbackDenylist` to exclude `.xml` files so the static `sitemap.xml` is served directly:

```
navigateFallbackDenylist: [/^\/~oauth/, /\.xml$/]
```

This ensures the service worker does not serve `index.html` for requests to `.xml` files.

### 2. Fix the dynamic sitemap URL
Since `vercel.json` rewrites don't work on Lovable hosting, update `robots.txt` to point the dynamic sitemap directly to the backend function URL:

```
Sitemap: https://www.kenyaadverts.co.ke/sitemap.xml
Sitemap: https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/dynamic-sitemap
```

Google Search Console accepts any valid URL for sitemaps — it doesn't need to be on the same domain.

### 3. Also exclude robots.txt and llms.txt from service worker
Add those to the denylist too for safety:

```
navigateFallbackDenylist: [/^\/~oauth/, /\.(xml|txt)$/]
```

### Summary of file changes
- **`vite.config.ts`** — Add `.xml` and `.txt` to `navigateFallbackDenylist`
- **`public/robots.txt`** — Update dynamic sitemap URL to point directly to the backend function

