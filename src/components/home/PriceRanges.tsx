import { Link } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";

const ranges = [
  { label: "Under KSh 1K", max: 1000, color: "from-emerald-500/15 to-emerald-500/0", accent: "text-emerald-600 dark:text-emerald-400" },
  { label: "KSh 1K – 5K", min: 1000, max: 5000, color: "from-sky-500/15 to-sky-500/0", accent: "text-sky-600 dark:text-sky-400" },
  { label: "KSh 5K – 20K", min: 5000, max: 20000, color: "from-violet-500/15 to-violet-500/0", accent: "text-violet-600 dark:text-violet-400" },
  { label: "KSh 20K – 50K", min: 20000, max: 50000, color: "from-amber-500/15 to-amber-500/0", accent: "text-amber-600 dark:text-amber-400" },
  { label: "KSh 50K – 200K", min: 50000, max: 200000, color: "from-rose-500/15 to-rose-500/0", accent: "text-rose-600 dark:text-rose-400" },
  { label: "Above KSh 200K", min: 200000, color: "from-primary/15 to-primary/0", accent: "text-primary" },
];

const buildHref = (r: { min?: number; max?: number }) => {
  const p = new URLSearchParams();
  if (r.min) p.set("minPrice", String(r.min));
  if (r.max) p.set("maxPrice", String(r.max));
  return `/search?${p.toString()}`;
};

const PriceRanges = () => {
  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shop by budget</p>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground">Find Your Price</h2>
            </div>
          </div>
          <Link to="/search" className="hidden text-base font-medium text-primary hover:underline sm:flex sm:items-center sm:gap-1.5">
            All listings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ranges.map((r) => (
            <Link
              key={r.label}
              to={buildHref(r)}
              className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${r.color} p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg`}
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bracket</p>
              <p className={`font-heading text-base font-bold ${r.accent}`}>{r.label}</p>
              <ArrowRight className="absolute bottom-3 right-3 h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceRanges;
