import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  price: number | null;
  images: string[] | null;
  category: string | null;
};

const DigitalProductsRail = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("digital_products")
        .select("id,slug,title,short_description,price,images,category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (!active) return;
      setItems((data as unknown as Product[]) || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  return (
    <section className="container-app py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">Digital Store</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            eBooks, templates, courses and software — instant delivery, free to publish.
          </p>
        </div>
        <Link
          to="/digital-store"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 sm:text-sm"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <Link
          to="/digital-store"
          className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border bg-card/60 p-5 transition-colors hover:border-primary/50"
        >
          <span className="text-sm font-semibold text-foreground">Sell your first digital product</span>
          <span className="text-xs text-muted-foreground">Free for everyone — publish instantly and get paid by M-Pesa.</span>
        </Link>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/digital-store/${p.slug || p.id}`}
              className="w-[70%] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:w-auto"
            >
              <div className="aspect-[16/10] w-full bg-muted">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Download className="h-6 w-6" />
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.short_description || p.category}</p>
                <p className="mt-2 text-sm font-bold text-primary">
                  {p.price ? `KSh ${Number(p.price).toLocaleString()}` : "Free"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default DigitalProductsRail;
