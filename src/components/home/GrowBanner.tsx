import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const GrowBanner = () => {
  return (
    <section className="section-padding">
      <div className="page-container rounded-3xl border border-border bg-card p-5 md:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              For business sellers
            </p>
            <h2 className="font-heading text-xl font-bold text-foreground md:text-3xl">Grow your business reach with premium placement</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Boost your visibility, reach more qualified buyers, and convert more leads with sponsored slots.
            </p>
          </div>
          <Link
            to="/credits"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explore packages <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GrowBanner;
