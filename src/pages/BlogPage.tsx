import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/mockData";
import { Calendar, ArrowRight, Clock, User, BookOpen, Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  category: string | null;
  author: string | null;
  read_time: string | null;
  created_at: string | null;
};

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,image,category,author,read_time,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        setPosts(data);
      } else {
        // Fallback to mock data if no DB posts
        setPosts(
          BLOG_POSTS.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            image: p.image,
            category: p.category,
            author: p.author,
            read_time: p.readTime,
            created_at: p.date,
          }))
        );
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];
  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Blog — Tips & Guides for Buyers & Sellers" description="Read expert tips on buying and selling in Kenya. Guides on electronics, vehicles, property and more on KenyaAdvert." canonical="https://www.kenyaadverts.co.ke/blog" ogImage="https://www.kenyaadverts.co.ke/og/og-blog.png" keywords="Kenya buying tips, selling guide, classifieds blog, KenyaAdvert blog" />
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground">KenyaAdvert Blog</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-lg">Tips, guides, and insights to help you buy, sell, and thrive across Kenya's marketplace.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="block mb-10 group">
                <div className="relative rounded-2xl overflow-hidden border border-border/60 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[21/9] md:aspect-[3/1]">
                    <img src={featured.image || "/placeholder.svg"} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                    {featured.category && <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-3">{featured.category}</span>}
                    <h2 className="font-heading font-bold text-xl md:text-3xl text-white mb-2 leading-snug max-w-2xl">{featured.title}</h2>
                    {featured.excerpt && <p className="text-sm text-white/70 mb-3 line-clamp-2 max-w-xl">{featured.excerpt}</p>}
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      {featured.author && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {featured.author}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(featured.created_at)}</span>
                      {featured.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.read_time} read</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border-border/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <article className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="overflow-hidden">
                      <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      {post.category && <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full mb-3 w-fit">{post.category}</span>}
                      <h3 className="font-heading font-semibold text-base text-foreground line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(post.created_at)}</span>
                        <span className="flex items-center gap-1 text-primary font-medium">Read more <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No blog posts found.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
