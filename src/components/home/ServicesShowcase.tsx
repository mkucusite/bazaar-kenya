import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVICE_TOPICS } from "@/lib/services";

const FEATURED = [
  "room-massage",
  "hotel-rooms-and-short-stay",
  "car-hire",
  "safari-packages",
  "plumbers-and-electricians",
  "salons-and-braiding",
  "photographers-and-events",
  "spa-day-packages",
];

/** Homepage rail of the most-requested services, each with its own landing page. */
const ServicesShowcase = () => {
  const items = FEATURED.map((slug) => SERVICE_TOPICS.find((s) => s.slug === slug)).filter(Boolean) as typeof SERVICE_TOPICS;

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Booked every day</p>
            <h2 className="font-heading text-2xl text-foreground md:text-3xl">Services Kenyans are looking for</h2>
            <p className="mt-1 text-sm text-muted-foreground">Massage and spa, stays, car hire, safaris, fundis, salons and events — with real prices.</p>
          </div>
          <Link to="/services" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            All services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((s) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
                <p className="text-sm font-bold leading-tight text-white">{s.name.split("(")[0].trim()}</p>
                <p className="mt-0.5 text-[11px] text-white/80">{s.group}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesShowcase;
