import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/mockData";

const BlogPreview = () => {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Latest Articles</h2>
          </div>
          <Link to="/blog" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View All Articles <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <article className="bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-all group h-full">
                <div className="overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy" 
                  />
                </div>
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded mb-2">
                    {post.category}
                  </span>
                  <h3 className="font-heading font-semibold text-sm text-foreground line-clamp-2 mb-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
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
