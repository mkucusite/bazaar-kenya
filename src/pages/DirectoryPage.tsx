import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { DirectoryCard, gridClassFor } from "@/components/directory/DirectoryCard";
import {
import { directoryVisibilityOr } from "@/lib/aiVisibility";
  DIRECTORY_KINDS,
  KENYA_COUNTIES,
  type DirectoryKind,
  type DirectoryProfile,
} from "@/lib/directory";

const PAGE_SIZE = 24;

interface Props {
  kind: DirectoryKind;
}

const DirectoryPage = ({ kind }: Props) => {
  const config = DIRECTORY_KINDS[kind];
  const [params, setParams] = useSearchParams();
  const county = params.get("county") || "";
  const tag = params.get("tag") || "";
  const q = params.get("q") || "";
  const [searchInput, setSearchInput] = useState(q);
  const [items, setItems] = useState<DirectoryProfile[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => setSearchInput(q), [q]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const baseQuery = useCallback(
    (from: number) => {
      let query = (supabase.from("directory_profiles" as any) as any)
        .select("*")
        .eq("kind", kind)
        .eq("is_published", true)
        .or(directoryVisibilityOr())
        .order("is_featured", { ascending: false })
        .order("is_manual", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (county) query = query.eq("county", county);
      if (tag) query = query.contains("tags", [tag]);
      if (q) query = query.or(`name.ilike.%${q}%,headline.ilike.%${q}%,organisation.ilike.%${q}%`);
      return query;
    },
    [kind, county, tag, q],
  );

  // reset on filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDone(false);
    setPage(0);
    (async () => {
      const { data } = await baseQuery(0);
      if (cancelled) return;
      const rows = (data || []) as DirectoryProfile[];
      setItems(rows);
      setDone(rows.length < PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [baseQuery]);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    const nextPage = page + 1;
    const { data } = await baseQuery(nextPage * PAGE_SIZE);
    const rows = (data || []) as DirectoryProfile[];
    setItems((prev) => [...prev, ...rows]);
    setPage(nextPage);
    if (rows.length < PAGE_SIZE) setDone(true);
    setLoading(false);
  }, [baseQuery, done, loading, page]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  const { data: total } = useQuery({
    queryKey: ["directory-count", kind],
    queryFn: async () => {
      const { count } = await (supabase.from("directory_profiles" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("kind", kind)
        .eq("is_published", true);
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: config.label,
      description: config.seoDescription,
      numberOfItems: items.length,
      itemListElement: items.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.kenyaadverts.com${config.path}/${p.slug}`,
        name: p.name,
      })),
    }),
    [items, config],
  );

  const activeFilters = [county, tag].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={config.seoTitle}
        description={config.seoDescription}
        keywords={config.keywords}
        canonical={`https://www.kenyaadverts.com${config.path}`}
        structuredData={jsonLd}
      />
      <Navbar />
      <main className="pb-24 md:pb-10">
        {/* Hub header */}
        <section className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-background">
          <div className="container-app py-8 md:py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-heading text-2xl font-bold text-foreground md:text-4xl">{config.label}</h1>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">{config.tagline}</p>
                {total ? (
                  <p className="mt-2 text-xs font-medium text-primary">{total.toLocaleString()} live listings</p>
                ) : null}
              </div>
              <Link
                to={`${config.path}/new`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> {config.ctaPost}
              </Link>
            </div>

            {/* Search + county */}
            <form
              className="mt-6 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setParam("q", searchInput.trim());
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search ${config.label.toLowerCase()}…`}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <select
                value={county}
                onChange={(e) => setParam("county", e.target.value)}
                className="h-12 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary sm:w-52"
              >
                <option value="">All counties</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-12 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">
                Search
              </button>
            </form>
          </div>
        </section>

        <div className="container-app grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4" /> {config.tagsLabel}
              </p>
              <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => setParam("tag", "")}
                  className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${!tag ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  All
                </button>
                {config.tagOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setParam("tag", t)}
                    className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${tag === t ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {/* Mobile tag chips */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin lg:hidden">
              <button
                onClick={() => setParam("tag", "")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${!tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                All
              </button>
              {config.tagOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setParam("tag", t)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${tag === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {activeFilters > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {[["county", county], ["tag", tag]].map(([key, value]) =>
                  value ? (
                    <button
                      key={key as string}
                      onClick={() => setParam(key as string, "")}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {value} <X className="h-3 w-3" />
                    </button>
                  ) : null,
                )}
              </div>
            )}

            {items.length === 0 && !loading ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <h2 className="font-heading text-lg font-semibold text-foreground">Nothing here yet</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Be the first to appear in the {config.label.toLowerCase()}. It is free and takes under two minutes.
                </p>
                <Link
                  to={`${config.path}/new`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> {config.ctaPost}
                </Link>
              </div>
            ) : (
              <div className={gridClassFor(kind)}>
                {items.map((p) => (
                  <DirectoryCard key={p.id} profile={p} />
                ))}
              </div>
            )}

            <div ref={sentinel} className="h-10" />
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
            {done && items.length > 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">You have reached the end · {items.length} listings</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DirectoryPage;
