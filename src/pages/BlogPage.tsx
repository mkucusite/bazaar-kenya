import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/data/mockData";
import { Calendar, ArrowRight } from "lucide-react";

const BlogPage = () => {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-8">KenyaAdvert Blog</h1>

        {/* Featured */}
        <Link to={`/blog/${featured.slug}`} className="block mb-10 group">
          <div className="grid md:grid-cols-2 gap-0 bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="overflow-hidden">
              <img src={featured.image} alt={featured.title} className="w-full h-full object-cover aspect-[3/2] transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <span className="inline-block px-2.5 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded mb-3 w-fit">{featured.category}</span>
              <h2 className="font-heading font-bold text-xl text-foreground mb-2 leading-snug">{featured.title}</h2>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{featured.excerpt}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" /> {featured.date} · {featured.readTime} read
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group">
              <article className="bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                <div className="overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded mb-2">{post.category}</span>
                  <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 mb-2 leading-snug">{post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {post.date} · {post.readTime} read
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPage;
