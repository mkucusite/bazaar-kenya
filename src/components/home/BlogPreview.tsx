import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/mockData";

const BlogPreview = () => {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="px-4 md:px-8 lg:px-16 xl:px-24 py-10 bg-muted/40">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">Latest Articles</h2>
        <Link to="/blog" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`}>
            <article className="bg-card rounded-xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
              <div className="overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-4">
                <span className="inline-block px-2 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded mb-2">
                  {post.category}
                </span>
                <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 mb-2 leading-snug">{post.title}</h3>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{post.date}</span>
                  <span className="mx-1">·</span>
                  <span>{post.readTime} read</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogPreview;
