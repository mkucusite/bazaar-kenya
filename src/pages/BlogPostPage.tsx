import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/mockData";
import { Calendar, ChevronRight, Share2, Clock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getBlogShareUrl } from "@/lib/ad-links";

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Article Not Found</h1>
          <Link to="/blog"><Button>Back to Blog</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);
  const shareUrl = getBlogShareUrl(post.slug);

  const fullContent = `Looking for great deals and tips? This article covers everything you need to know about ${post.title.toLowerCase()}.\n\nKenya's marketplace continues to grow, offering more opportunities for buyers and sellers alike. Whether you're in Nairobi, Mombasa, Kisumu, or any of the 47 counties, KenyaAdvert connects you with the right people.\n\n## Key Takeaways\n\n- Always research before making a purchase\n- Compare prices across multiple sellers\n- Use secure payment methods like M-Pesa\n- Meet in public places for transactions\n- Check product condition thoroughly\n\n## Conclusion\n\nStay informed and make smart decisions. KenyaAdvert is here to help you buy, sell, and advertise across Kenya safely and efficiently.`;

  const handleShare = async () => {
    const friendlyUrl = `https://www.kenyaadverts.co.ke/blog/${post.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url: shareUrl });
        return;
      } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(friendlyUrl);
    toast({ title: "Link copied!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="px-4 md:px-8 lg:px-16 xl:px-24 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{post.category}</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All articles
          </Link>

          {/* Category + Title */}
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">{post.category}</span>
          <h1 className="font-heading font-bold text-2xl md:text-4xl text-foreground mb-5 leading-tight">{post.title}</h1>
          
          {/* Author bar */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/60">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime} read</span>
          </div>

          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden mb-8 border border-border/40">
            <img src={post.image} alt={post.title} className="w-full aspect-[2/1] object-cover" />
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {fullContent.split("\n\n").map((para, i) => {
              if (para.startsWith("## ")) {
                return <h2 key={i} className="font-heading font-bold text-xl text-foreground mt-10 mb-4">{para.replace("## ", "")}</h2>;
              }
              if (para.startsWith("- ")) {
                return (
                  <ul key={i} className="space-y-2 my-4">
                    {para.split("\n").map((li, j) => (
                      <li key={j} className="flex items-start gap-2 text-muted-foreground text-sm leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {li.replace("- ", "")}
                      </li>
                    ))}
                  </ul>
                );
              }
              return <p key={i} className="text-muted-foreground text-sm leading-relaxed mb-4">{para}</p>;
            })}
          </div>

          {/* Share bar */}
          <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border/60">
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
        {relatedPosts.length > 0 && (
          <div className="mt-14 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-xl text-foreground mb-6">You might also like</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full mb-2">{p.category}</span>
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
