import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GrowBanner = () => {
  return (
    <section className="bg-foreground section-padding py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-heading font-bold text-2xl md:text-4xl text-background mb-4">
          Grow Your Business.<br />Start Selling Today with KenyaAdvert!
        </h2>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">
          We have created tailored ad bundles to boost, promote and highlight your business or ad
        </p>
        <Link
          to="/credits"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-card text-foreground rounded-xl font-semibold text-sm hover:bg-muted transition-colors shadow-lg"
        >
          Find Out More <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
};

export default GrowBanner;
