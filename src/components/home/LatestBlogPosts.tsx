import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const LatestBlogPosts = () => {
  const { data: posts = [] } = useQuery({
    queryKey: ["latest-blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("slug,title,excerpt,updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!posts || posts.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <h2 className="text-xl font-heading mb-3">Latest Blog Posts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {posts.map((p: any) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="block p-3 rounded-lg hover:bg-primary/5 transition-colors">
              <h3 className="font-semibold text-sm">{p.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestBlogPosts;
