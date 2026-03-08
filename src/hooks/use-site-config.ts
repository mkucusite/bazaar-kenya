import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteConfig = Record<string, string>;

export const useSiteConfig = () => {
  return useQuery({
    queryKey: ["site-config"],
    queryFn: async (): Promise<SiteConfig> => {
      const { data } = await supabase
        .from("site_config" as any)
        .select("key, value");
      const config: SiteConfig = {};
      if (data) {
        for (const row of data as any[]) {
          config[row.key] = row.value;
        }
      }
      return config;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const getPrice = (config: SiteConfig | undefined, key: string, fallback: number): number => {
  if (!config?.[key]) return fallback;
  const val = Number(config[key]);
  return isNaN(val) ? fallback : val;
};
