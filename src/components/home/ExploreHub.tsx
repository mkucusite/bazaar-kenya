import { Link } from "react-router-dom";
import {
  ShoppingBag, Landmark, Download, Briefcase, Stethoscope, Sparkles, Hotel, Car,
  Palmtree, UtensilsCrossed, Scissors, GraduationCap, Dumbbell, Wrench, CalendarDays, Newspaper,
} from "lucide-react";
import { useLocationPref } from "@/contexts/LocationContext";

const withCounty = (path: string, county: string | null) =>
  county ? `${path}${path.includes("?") ? "&" : "?"}county=${encodeURIComponent(county)}` : path;

const HUBS = [
  { to: "/search", label: "Buy & Sell", detail: "Ads & deals", icon: ShoppingBag, tint: "bg-primary/10 text-primary" },
  { to: "/politicians", label: "Politics 2027", detail: "Aspirants", icon: Landmark, tint: "bg-amber-500/10 text-amber-600" },
  { to: "/digital-store", label: "Digital Store", detail: "Free files", icon: Download, tint: "bg-violet-500/10 text-violet-600" },
  { to: "/jobs", label: "Jobs", detail: "Vacancies", icon: Briefcase, tint: "bg-indigo-500/10 text-indigo-600" },
  { to: "/wellness", label: "Massage & Spa", detail: "Book today", icon: Sparkles, tint: "bg-pink-500/10 text-pink-600" },
  { to: "/hotels", label: "Hotels & Stays", detail: "Rooms", icon: Hotel, tint: "bg-sky-500/10 text-sky-600" },
  { to: "/vehicles", label: "Car Hire", detail: "Self drive", icon: Car, tint: "bg-blue-500/10 text-blue-600" },
  { to: "/tours", label: "Safaris & Tours", detail: "Trips & parks", icon: Palmtree, tint: "bg-teal-500/10 text-teal-600" },
  { to: "/doctors", label: "Doctors", detail: "Clinics", icon: Stethoscope, tint: "bg-emerald-500/10 text-emerald-600" },
  { to: "/salons", label: "Salons & Barbers", detail: "Beauty", icon: Scissors, tint: "bg-fuchsia-500/10 text-fuchsia-600" },
  { to: "/restaurants", label: "Food Places", detail: "Eat & order", icon: UtensilsCrossed, tint: "bg-orange-500/10 text-orange-600" },
  { to: "/artisans", label: "Fundis", detail: "Repairs", icon: Wrench, tint: "bg-stone-500/10 text-stone-600" },
  { to: "/gyms", label: "Gyms", detail: "Fitness", icon: Dumbbell, tint: "bg-lime-500/10 text-lime-700" },
  { to: "/schools", label: "Schools", detail: "Admissions", icon: GraduationCap, tint: "bg-cyan-500/10 text-cyan-600" },
  { to: "/events", label: "Events", detail: "What's on", icon: CalendarDays, tint: "bg-rose-500/10 text-rose-600" },
  { to: "/blog", label: "Guides", detail: "Read up", icon: Newspaper, tint: "bg-muted text-foreground" },
];

/**
 * The single map of the whole site, right below the hero, so a phone visitor
 * reaches politics, digital products, hotels or tours without scrolling ads.
 */
const ExploreHub = () => {
  const { county } = useLocationPref();

  return (
    <section className="container-app py-6">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Everything on KenyaAdvert</p>
        <h2 className="font-heading text-xl text-foreground sm:text-2xl">
          Where do you want to go{county ? ` in ${county}` : ""}?
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {HUBS.map(({ to, label, detail, icon: Icon, tint }) => (
          <Link
            key={to}
            to={withCounty(to, county)}
            className="group flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card p-2 text-center transition-all active:scale-95 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="w-full text-[11px] font-bold leading-tight text-foreground line-clamp-2">{label}</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">{detail}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ExploreHub;
