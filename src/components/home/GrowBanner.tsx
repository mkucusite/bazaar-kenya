import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const GrowBanner = () => {
  return (
    <section className="section-padding">
      <div className="bg-foreground rounded-2xl px-5 py-8 md:px-10 md:py-12 text-center">
        <h2 className="font-heading font-bold text-xl md:text-3xl text-background mb-2">
          Grow Your Business
        </h2>
        <p className="text-muted-foreground text-xs md:text-sm mb-5 max-w-md mx-auto">
          Tailored ad bundles to boost, promote and highlight your business or ad
        </p>
        <Link
          to="/credits"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-card text-foreground rounded-lg font-semibold text-sm hover:bg-muted transition-colors"
        >
          Find Out More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default GrowBanner;
