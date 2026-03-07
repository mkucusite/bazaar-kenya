import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/mockData";

const BlogPreview = () => {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="bg-surface-grey section-padding">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">Latest Articles</h2>
        <Link to="/blog" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
            <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover" loading="lazy" />
            <div className="p-4">
              <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-2">
                {post.category}
              </span>
              <h3 className="font-heading font-bold text-sm text-foreground line-clamp-2 mb-2">{post.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                <span>{post.date}</span>
                <span className="mx-1">•</span>
                <span>{post.readTime} read</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="text-xs font-semibold text-primary hover:underline">
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default BlogPreview;
