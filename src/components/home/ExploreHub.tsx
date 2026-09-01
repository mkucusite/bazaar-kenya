import { Link } from "react-router-dom";
import {
  ShoppingBag, Landmark, Download, Briefcase, Stethoscope, Sparkles, Hotel, Car,
  Palmtree, UtensilsCrossed, Scissors, GraduationCap, Dumbbell, Wrench, CalendarDays, Newspaper,
  ArrowUpRight,
} from "lucide-react";
import { useLocationPref } from "@/contexts/LocationContext";

const withCounty = (path: string, county: string | null) =>
  county ? `${path}${path.includes("?") ? "&" : "?"}county=${encodeURIComponent(county)}` : path;

/** Four pillars of the site, given real estate. */
const PILLARS = [
  {
    to: "/search",
    label: "Classifieds",
    line: "Cars, phones, property, land, furniture — buy and sell anything.",
    icon: ShoppingBag,
  },
  {
    to: "/wellness",
    label: "Book a service",
    line: "Massage & spa, salons, hotels, car hire, safaris, fundis.",
    icon: Sparkles,
  },
  {
    to: "/politicians",
    label: "Politics 2027",
    line: "Every governor, senator, MP, MCA and women rep aspirant.",
    icon: Landmark,
  },
  {
    to: "/digital-store",
    label: "Digital store",
    line: "eBooks, templates, CVs and courses — instant download.",
    icon: Download,
  },
] as const;

/** Everything else, compact. */
const SECONDARY = [
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/hotels", label: "Stays", icon: Hotel },
  { to: "/vehicles", label: "Car hire", icon: Car },
  { to: "/tours", label: "Safaris", icon: Palmtree },
  { to: "/restaurants", label: "Food", icon: UtensilsCrossed },
  { to: "/salons", label: "Salons", icon: Scissors },
  { to: "/artisans", label: "Fundis", icon: Wrench },
  { to: "/gyms", label: "Gyms", icon: Dumbbell },
  { to: "/schools", label: "Schools", icon: GraduationCap },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/blog", label: "Guides", icon: Newspaper },
];

/**
 * Bento map of the whole site, directly under the hero, so a phone visitor
 * reaches politics, bookings or digital products without scrolling ads.
 */
const ExploreHub = () => {
  const { county } = useLocationPref();

  return (
    <section className="container-app py-7 md:py-9">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">The whole site</p>
          <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            Start anywhere{county ? ` in ${county}` : ""}
          </h2>
        </div>
        <Link to="/post" className="shrink-0 text-xs font-bold text-primary hover:underline sm:text-sm">
          Publish yours →
        </Link>
      </div>

      {/* Pillars */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map(({ to, label, line, icon: Icon }) => (
          <Link
            key={to}
            to={withCounty(to, county)}
            className="group relative border-t-2 border-primary bg-card p-4 text-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-lg active:scale-[0.99] sm:p-5"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="relative mt-3 block font-heading text-base font-black leading-tight sm:text-lg">{label}</span>
            <span className="relative mt-1 block text-[11.5px] leading-snug text-muted-foreground sm:text-xs">{line}</span>
            <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>

      {/* Secondary rail */}
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {SECONDARY.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={withCounty(to, county)}
             className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-md border border-border/60 bg-card px-1 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm active:scale-95"
          >
            <Icon className="h-[18px] w-[18px] text-primary" />
            <span className="text-[10.5px] font-bold leading-tight text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ExploreHub;
