import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";

const QuickLinksStrip = () => {
  const quickItems = CATEGORIES.slice(0, 8);

  return (
    <section className="border-b border-border/60 bg-muted/20">
      <div className="section-padding !py-3">
        <div className="page-container overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex min-w-max items-center gap-2">
            {quickItems.map((item) => (
              <Link
                key={item.name}
                to={`/search?category=${encodeURIComponent(item.name)}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickLinksStrip;
