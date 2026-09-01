import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PoliticsProfiles = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ["politics-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banner_campaigns")
        .select("id,slug,business_name,county,updated_at")
        .eq("category", "politician")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(12);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!profiles || profiles.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <h2 className="text-xl font-heading mb-3">Featured Political Profiles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {profiles.map((p: any) => (
            <Link key={p.id} to={`/politics/${p.slug || p.id}`} className="block p-2 rounded hover:bg-primary/5 transition-colors text-sm">
              <div className="font-semibold truncate">{p.business_name}</div>
              <div className="text-xs text-muted-foreground">{p.county || "Unknown county"}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PoliticsProfiles;
