import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/mockData";

const BlogPreview = () => {
  const [featured, ...rest] = BLOG_POSTS.slice(0, 3);

  return (
    <section className="section-padding">
      <div className="page-container">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground md:text-xl">Latest articles</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Tips on buying, selling, and staying safe</p>
          </div>
          <Link to="/blog" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {featured && (
            <Link to={`/blog/${featured.slug}`} className="md:col-span-2">
              <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="p-4">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                    {featured.category}
                  </span>
                  <h3 className="mt-2 font-heading text-base font-semibold text-foreground md:text-lg">{featured.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{featured.excerpt}</p>
                </div>
              </article>
            </Link>
          )}

          <div className="grid gap-3">
            {rest.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all hover:shadow-md">
                  <span className="inline-flex rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {post.category}
                  </span>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{post.title}</h3>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readTime}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
