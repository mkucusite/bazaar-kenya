import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/mockData";
import { Calendar, ChevronRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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

  const fullContent = `Looking for great deals and tips? This article covers everything you need to know about ${post.title.toLowerCase()}.\n\nKenya's marketplace continues to grow, offering more opportunities for buyers and sellers alike. Whether you're in Nairobi, Mombasa, Kisumu, or any of the 47 counties, KenyaAdvert connects you with the right people.\n\n## Key Takeaways\n\n- Always research before making a purchase\n- Compare prices across multiple sellers\n- Use secure payment methods like M-Pesa\n- Meet in public places for transactions\n- Check product condition thoroughly\n\n## Conclusion\n\nStay informed and make smart decisions. KenyaAdvert is here to help you buy, sell, and advertise across Kenya safely and efficiently.`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="px-4 md:px-8 lg:px-16 xl:px-24 py-6">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{post.category}</span>
        </nav>

        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-2.5 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded mb-4">{post.category}</span>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4 leading-snug">{post.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
            <span>By {post.author}</span>
            <span>{post.readTime} read</span>
          </div>

          <img src={post.image} alt={post.title} className="w-full rounded-xl mb-8 aspect-[2/1] object-cover" />

          <div className="prose prose-sm max-w-none">
            {fullContent.split("\n\n").map((para, i) => {
              if (para.startsWith("## ")) {
                return <h2 key={i} className="font-heading font-bold text-lg text-foreground mt-8 mb-3">{para.replace("## ", "")}</h2>;
              }
              if (para.startsWith("- ")) {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-1.5 text-muted-foreground text-sm my-4">
                    {para.split("\n").map((li, j) => <li key={j}>{li.replace("- ", "")}</li>)}
                  </ul>
                );
              }
              return <p key={i} className="text-muted-foreground text-sm leading-relaxed mb-4">{para}</p>;
            })}
          </div>

          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/60">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Share:</span>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }}>
              <Share2 className="w-3.5 h-3.5 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(post.title + " " + window.location.href)}`)}>
              WhatsApp
            </Button>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-12 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-lg text-foreground mb-5">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {relatedPosts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-md transition-all group">
                  <div className="overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-heading font-semibold text-xs text-foreground line-clamp-2">{p.title}</h3>
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
