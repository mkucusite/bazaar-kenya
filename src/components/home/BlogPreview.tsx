import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_POSTS } from "@/data/mockData";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  category: string | null;
};

const FALLBACK_IMG = "/og-image.png";

const BlogPreview = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("blog_posts" as any)
        .select("id,slug,title,excerpt,image,category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (!mounted) return;
      const rows = (data as any as Post[]) || [];
      if (rows.length > 0) setPosts(rows);
      else setPosts(BLOG_POSTS.slice(0, 3) as any);
    })();
    return () => { mounted = false; };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground">Latest Articles</h2>
          </div>
          <Link to="/blog" className="text-base text-primary font-medium hover:underline flex items-center gap-1.5">
            View All Articles <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <article className="bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-all group h-full">
                <div className="overflow-hidden bg-muted">
                  <img
                    src={post.image || FALLBACK_IMG}
                    alt={post.title}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 xl:p-6">
                  {post.category && (
                    <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded mb-2">
                      {post.category}
                    </span>
                  )}
                  <h3 className="font-heading font-semibold text-lg text-foreground line-clamp-2 mb-3 leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
