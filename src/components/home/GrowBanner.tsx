import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const GrowBanner = () => {
  return (
    <section className="bg-foreground section-padding py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-background mb-3">
          Grow Your Business. Start Selling Today with KenyaAdvert!
        </h2>
        <p className="text-muted-foreground mb-6 text-sm md:text-base">
          We have created tailored ad bundles to boost, promote and highlight your business or ad
        </p>
        <Link
          to="/credits"
          className="inline-flex items-center gap-2 px-6 py-3 bg-card text-foreground rounded-lg font-semibold text-sm hover:bg-muted transition-colors"
        >
          Find Out More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default GrowBanner;
