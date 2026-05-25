import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, ChevronRight, Clock, User, ArrowLeft, Loader2, Link2, MessageCircle, Twitter, Facebook, Mail } from "lucide-react";
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
  meta_title?: string | null;
  meta_description?: string | null;
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts" as any)
        .select("id,slug,title,excerpt,content,image,category,author,read_time,created_at,meta_title,meta_description")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();

      const postData = data as any as BlogPost | null;
      setPost(postData);

      if (postData) {
        // Increment views via server-side function (works for public visitors too)
        void (async () => {
          const { error } = await supabase.rpc("increment_blog_post_views", { target_post_id: postData.id });
          if (error) console.error("increment_blog_post_views failed", error);
        })();

        const { data: rel } = await supabase
          .from("blog_posts" as any)
          .select("id,slug,title,excerpt,content,image,category,author,read_time,created_at")
          .eq("is_published", true)
          .neq("id", postData.id)
          .order("created_at", { ascending: false })
          .limit(3);
        setRelated((rel || []) as any);
      }
      setLoading(false);
    };
    if (slug) fetchData();
  }, [slug]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
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
          <Link to="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = getBlogShareUrl(post.slug);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(shareUrl);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied to clipboard!" });
  };

  const shareButtons = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366] hover:bg-[#1da851]",
      url: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}`,
    },
    {
      label: "Twitter",
      icon: Twitter,
      color: "bg-[#1DA1F2] hover:bg-[#0d8ddb]",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2] hover:bg-[#0d65d9]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "Email",
      icon: Mail,
      color: "bg-muted-foreground/80 hover:bg-muted-foreground",
      url: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(post.title + "\n\n" + shareUrl)}`,
    },
  ];

  // Strip -2/-3/-N suffixes for canonical to deduplicate near-identical posts
  const canonicalSlug = (post.slug || "").replace(/-\d+$/, "");
  const politicalKeywords = /\b(campaign|governor|senator|MP|MCA|aspirant|political|2027)\b/i;
  const isPolitical = politicalKeywords.test(`${post.title} ${post.excerpt || ""} ${post.content || ""}`);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || ""}
        canonical={`https://www.kenyaadverts.com/blog/${canonicalSlug}`}
        ogImage={post.image || "https://www.kenyaadverts.com/og/og-blog.png"}
        keywords={`${post.category || "blog"}, KenyaAdvert, ${post.title}, Kenya marketplace tips, buying selling guide, classifieds advice, online trading Kenya`}
      />

      <Navbar />

      {/* Hero image - full bleed */}
      {post.image && (
        <div className="relative w-full h-[280px] md:h-[400px] lg:h-[480px] overflow-hidden">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <article className="px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="max-w-3xl mx-auto -mt-20 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{post.category || "Article"}</span>
          </nav>

          {/* Card container for content */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
            {/* Header section */}
            <div className="p-6 md:p-10 pb-0 md:pb-0">
              {/* Category badge */}
              {post.category && (
                <span className="inline-block px-3.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-5 uppercase tracking-wide">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="font-heading font-extrabold text-2xl md:text-4xl lg:text-[2.75rem] text-foreground mb-6 leading-[1.15] tracking-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 font-body">
                  {post.excerpt}
                </p>
              )}

              {/* Author / meta bar */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pb-6 border-b border-border/50 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-sm leading-tight">{post.author || "KenyaAdvert Team"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                <span className="hidden md:block w-px h-6 bg-border/60" />
                {post.read_time && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5" /> {post.read_time}
                  </span>
                )}
              </div>
            </div>

            {/* Article body */}
            <div className="p-6 md:p-10 pt-8 md:pt-8">
              {post.content && (
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-heading prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                    prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30
                    prose-h3:text-lg prose-h3:md:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-5 prose-p:text-[15px] prose-p:md:text-base
                    prose-li:text-muted-foreground prose-li:leading-[1.8] prose-li:text-[15px] prose-li:md:text-base prose-li:marker:text-primary
                    prose-ul:my-4 prose-ul:pl-1 prose-ol:my-4 prose-ol:pl-1
                    prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
                    prose-table:text-sm prose-td:text-muted-foreground prose-th:text-foreground prose-th:font-semibold prose-th:bg-muted/40
                    prose-table:border prose-table:border-border/40 prose-td:border prose-td:border-border/30 prose-th:border prose-th:border-border/30
                    prose-td:px-4 prose-td:py-2 prose-th:px-4 prose-th:py-2.5
                    prose-img:rounded-xl prose-img:border prose-img:border-border/40"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}
            </div>

            {isPolitical && (
              <div className="px-6 md:px-10 pb-6">
                <a
                  href="/banners/new"
                  className="block w-full text-center bg-primary text-primary-foreground font-heading font-bold text-base md:text-lg py-4 px-6 rounded-2xl shadow-lg hover:opacity-95 transition-opacity"
                >
                  Post Your Political Campaign on KenyaAdvert
                </a>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Launch your political campaign banner in minutes — reach voters across all 47 counties.
                </p>
              </div>
            )}



            {/* Share section */}
            <div className="p-6 md:p-10 pt-0 md:pt-0">
              <div className="rounded-2xl bg-muted/40 border border-border/40 p-6 md:p-8">
                <p className="text-sm font-heading font-bold text-foreground mb-1">Enjoyed this article?</p>
                <p className="text-xs text-muted-foreground mb-5">Share it with your friends and help others discover great tips.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {shareButtons.map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => btn.url.startsWith("mailto") ? window.location.href = btn.url : window.open(btn.url, "_blank")}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${btn.color}`}
                    >
                      <btn.icon className="w-4 h-4" />
                      {btn.label}
                    </button>
                  ))}
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-foreground text-xs font-semibold transition-all hover:bg-muted active:scale-95"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-12 mb-8">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">You might also like</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map((p) => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                    <article className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="overflow-hidden">
                        <img
                          src={p.image || "/placeholder.svg"}
                          alt={p.title}
                          className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        {p.category && (
                          <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full mb-2.5 w-fit uppercase tracking-wide">
                            {p.category}
                          </span>
                        )}
                        <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {p.title}
                        </h3>
                        <span className="text-[11px] text-muted-foreground mt-auto pt-3 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(p.created_at)}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to blog */}
          <div className="text-center py-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Browse All Articles
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
