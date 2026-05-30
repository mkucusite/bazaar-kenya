import { Link } from "react-router-dom";
import { COUNTIES, slugify } from "@/data/elections2027";

const ElectionsCountyGrid = () => {
  return (
    <section className="section-padding">
      <div className="container-app">
        <h2 className="text-xl font-heading mb-4">Elections 2027 — County Hubs</h2>
        <p className="text-sm text-muted-foreground mb-4">Browse county election hubs and seat pages across all 47 counties.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {COUNTIES.map((c) => (
            <Link key={c} to={`/counties/${slugify(c)}`} className="block px-2 py-2 rounded hover:bg-primary/5 transition-colors text-sm">
              {c}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ElectionsCountyGrid;
