import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ShoppingBag, Sparkles, Hotel, Car, Palmtree, UtensilsCrossed, Scissors, GraduationCap,
  Dumbbell, Wrench, Stethoscope, Code2, Briefcase, CalendarDays, Megaphone, Download, Store,
  Landmark, PartyPopper, ArrowRight, ShieldCheck, Zap, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { DIRECTORY_KINDS, type DirectoryKind } from "@/lib/directory";
import AuthGate from "@/components/AuthGate";

type Tile = {
  to: string;
  title: string;
  blurb: string;
  icon: typeof ShoppingBag;
  badge?: string;
  keywords: string;
};

type Group = { id: string; title: string; caption: string; tiles: Tile[] };

const kindTile = (kind: DirectoryKind, icon: Tile["icon"], blurb: string, badge?: string): Tile => {
  const cfg = DIRECTORY_KINDS[kind];
  return {
    to: `${cfg.path}/new`,
    title: cfg.ctaPost,
    blurb,
    icon,
    badge,
    keywords: `${cfg.label} ${cfg.singular} ${cfg.ctaPost} ${blurb}`,
  };
};

const GROUPS: Group[] = [
  {
    id: "sell",
    title: "Sell something",
    caption: "One item or a whole shop — live in minutes.",
    tiles: [
      {
        to: "/post-ad",
        title: "Post a classified ad",
        blurb: "Phones, cars, furniture, land, electronics, animals — anything with a price.",
        icon: ShoppingBag,
        badge: "Free",
        keywords: "sell item ad classified phone car land furniture product",
      },
      {
        to: "/digital-store/new",
        title: "Sell a digital product",
        blurb: "eBooks, templates, CV designs, courses and files — buyers download instantly.",
        icon: Download,
        keywords: "digital product ebook template file download course",
      },
      {
        to: "/business-profile",
        title: "Create a business page",
        blurb: "A branded shopfront for your company with all your listings in one place.",
        icon: Store,
        badge: "Paid",
        keywords: "business profile shop company brand page store",
      },
    ],
  },
  {
    id: "services",
    title: "Get booked for a service",
    caption: "Your own page, your own price list, calls and WhatsApp straight to you.",
    tiles: [
      kindTile("wellness", Sparkles, "Massage, spa days, therapy rooms and wellness packages.", "Popular"),
      kindTile("salon", Scissors, "Salon, barbershop, braiding, nails, locs and makeup."),
      kindTile("hotel", Hotel, "Hotels, lodges, Airbnbs and short stays with nightly rates."),
      kindTile("vehicle", Car, "Car hire, self-drive, chauffeur, vans, buses and lorries."),
      kindTile("tour", Palmtree, "Safaris, parks, day trips, beach and team-building packages."),
      kindTile("restaurant", UtensilsCrossed, "Restaurant, café, nyama choma spot, bakery or catering."),
      kindTile("artisan", Wrench, "Plumber, electrician, mason, carpenter, welder — any fundi."),
      kindTile("event-service", PartyPopper, "Photography, DJ, tents, decor, MC, cake and planning."),
      kindTile("fitness", Dumbbell, "Gym, personal training, yoga and fitness classes."),
    ],
  },
  {
    id: "professional",
    title: "Publish a profile",
    caption: "Be found by name, specialty and county.",
    tiles: [
      kindTile("doctor", Stethoscope, "Doctors, dentists, specialists and clinics — with consultation fees."),
      kindTile("developer", Code2, "Developers, designers and creatives with live portfolio previews."),
      kindTile("school", GraduationCap, "Schools, colleges, academies and tuition centres."),
    ],
  },
  {
    id: "reach",
    title: "Hire, host & campaign",
    caption: "Reach the whole country, not just your street.",
    tiles: [
      {
        to: "/jobs/new",
        title: "Post a job vacancy",
        blurb: "Free job posts seen by thousands of jobseekers every week.",
        icon: Briefcase,
        badge: "Free",
        keywords: "job vacancy hire recruit employee career",
      },
      {
        to: "/events/new",
        title: "Host an event",
        blurb: "Concerts, weddings, church events, conferences — with RSVPs and tickets.",
        icon: CalendarDays,
        keywords: "event host concert wedding conference rsvp ticket",
      },
      {
        to: "/create-banner",
        title: "Run a banner campaign",
        blurb: "Homepage and search banners for your brand, product or launch.",
        icon: Megaphone,
        badge: "Paid",
        keywords: "banner advertise campaign promotion marketing brand",
      },
      {
        to: "/politicians",
        title: "Claim your politician page",
        blurb: "Aspirants: own your 2027 profile, add photos, manifesto and campaign banners.",
        icon: Landmark,
        badge: "2027",
        keywords: "politician politics campaign claim aspirant governor mca mp senator election",
      },
    ],
  },
];

const PublishHubContent = () => {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      tiles: g.tiles.filter((t) => `${t.title} ${t.blurb} ${t.keywords}`.toLowerCase().includes(q)),
    })).filter((g) => g.tiles.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Post on KenyaAdvert — Sell, Get Booked, Hire or Campaign"
        description="Choose what to publish on KenyaAdvert: classified ads, spa and salon pages, hotels, car hire, doctors, schools, jobs, events, digital products and 2027 campaign pages."
        canonical="https://www.kenyaadverts.com/post"
        keywords="post free ad Kenya, list my spa Kenya, list my hotel Kenya, post a job Kenya, sell online Kenya, advertise Kenya"
      />
      <Navbar />

      <main className="pb-24 md:pb-12">
        {/* Header band */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary via-emerald-700 to-teal-800">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="container-app relative py-10 md:py-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Publish on KenyaAdvert</p>
            <h1 className="mt-2 max-w-2xl font-heading text-3xl font-black leading-[1.05] text-white md:text-5xl">
              What are you putting out there today?
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/80 md:text-base">
              This is not just a place to sell a phone. Publish a listing, a service page, a profile, a vacancy,
              an event or a campaign — pick the one that fits and we shape the form around it.
            </p>

            <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-card p-2 shadow-2xl">
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type what you offer — spa, plumber, hotel, job, car…"
                aria-label="Search publishing options"
                className="h-10 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/80 sm:text-xs">
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> Live in minutes</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Contacts masked from scrapers</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-accent" /> Free unless marked paid</span>
            </div>

          </div>
        </section>

        <div className="container-app py-8 md:py-10">
          {groups.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nothing matches “{query}”. Try “spa”, “job”, “hotel”, “fundi” or{" "}
              <Link to="/post-ad" className="font-semibold text-primary underline">post a normal ad</Link>.
            </p>
          )}

          {groups.map((group, gi) => (
            <section key={group.id} className={gi === 0 ? "" : "mt-10"}>
              <div className="mb-4 flex items-baseline gap-3 border-b border-border/60 pb-3">
                <span className="font-heading text-xs font-black text-primary">{String(gi + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">{group.title}</h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">{group.caption}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.tiles.map(({ to, title, blurb, icon: Icon, badge }) => (
                  <Link
                    key={to + title}
                    to={to}
                    className="group relative flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg active:scale-[0.99]"
                  >
                    <span className="absolute inset-y-0 left-0 w-[3px] bg-primary/0 transition-colors group-hover:bg-primary" />
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-heading text-sm font-bold leading-snug text-foreground">{title}</span>
                        {badge && (
                          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground/90">
                            {badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{blurb}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        Start <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-5 text-center">
            <h3 className="font-heading text-base font-bold text-foreground">Not sure where yours fits?</h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground sm:text-sm">
              Post it as a normal ad — our team can move it into the right directory for you, free of charge.
            </p>
            <Link
              to="/post-ad"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
            >
              Post a general ad <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const PublishHubPage = () => (
  <AuthGate title="Sign in to publish" message="Choose exactly what you want to publish after signing in. You will return directly to this page.">
    <PublishHubContent />
  </AuthGate>
);

export default PublishHubPage;
