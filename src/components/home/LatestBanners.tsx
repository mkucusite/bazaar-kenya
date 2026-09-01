import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const LatestBanners = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ["latest-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banner_campaigns")
        .select("id,slug,business_name,banner_image,updated_at,category")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!banners || banners.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <h2 className="text-xl font-heading mb-3">Featured Campaigns & Banners</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {banners.map((b: any) => {
            const path = (b.category === "politician") ? `/politics/${b.slug || b.id}` : `/banners/${b.slug || b.id}`;
            return (
              <Link key={b.id} to={path} className="block p-2 rounded-lg hover:bg-primary/5 transition-colors text-sm">
                <div className="font-semibold truncate">{b.business_name}</div>
                <div className="text-xs text-muted-foreground">{new Date(b.updated_at || Date.now()).toLocaleDateString()}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestBanners;
