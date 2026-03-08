import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, ChevronRight, Share2, Clock, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getBlogShareUrl } from "@/lib/ad-links";
import { supabase } from "@/integrations/supabase/client";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image: string | null;
  category: string | null;
  author: string | null;
  read_time: string | null;
  created_at: string | null;
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,content,image,category,author,read_time,created_at")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();

      setPost(data);

      if (data) {
        const { data: rel } = await supabase
          .from("blog_posts")
          .select("id,slug,title,excerpt,content,image,category,author,read_time,created_at")
          .eq("is_published", true)
          .neq("id", data.id)
          .order("created_at", { ascending: false })
          .limit(3);
        setRelated(rel || []);
      }
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Article Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">This article may have been removed or doesn't exist.</p>
          <Link to="/blog"><Button><ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = getBlogShareUrl(post.slug);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt || "", url: shareUrl });
        return;
      } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.title}
        description={post.excerpt || ""}
        canonical={`https://www.kenyaadverts.co.ke/blog/${post.slug}`}
        ogImage={post.image || "https://www.kenyaadverts.co.ke/og/og-blog.png"}
        keywords={`${post.category || "blog"}, KenyaAdvert, ${post.title}, Kenya marketplace tips, buying selling guide, classifieds advice, online trading Kenya`}
      />
      <Navbar />
      <article className="px-4 md:px-8 lg:px-16 xl:px-24 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{post.category || "Article"}</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All articles
          </Link>

          {/* Category + Title */}
          {post.category && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">{post.category}</span>
          )}
          <h1 className="font-heading font-bold text-2xl md:text-4xl text-foreground mb-5 leading-tight">{post.title}</h1>

          {/* Author bar */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/60 flex-wrap">
            {post.author && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(post.created_at)}</span>
            {post.read_time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.read_time}</span>}
          </div>

          {/* Hero image */}
          {post.image && (
            <div className="rounded-2xl overflow-hidden mb-8 border border-border/40">
              <img src={post.image} alt={post.title} className="w-full aspect-[2/1] object-cover" />
            </div>
          )}

          {/* Content - render HTML from database */}
          {post.content && (
            <div
              className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-td:text-muted-foreground prose-th:text-foreground prose-th:font-semibold"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Share bar */}
          <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border/60 flex-wrap">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Share:</span>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}`)}>
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`)}>
              Twitter
            </Button>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-xl text-foreground mb-6">You might also like</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="overflow-hidden">
                    <img src={p.image || "/placeholder.svg"} alt={p.title} className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    {p.category && <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full mb-2">{p.category}</span>}
                    <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
