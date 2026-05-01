import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Users, Ticket, Sparkles, Globe, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  is_virtual: boolean;
  host_name: string | null;
  ticket_price: number;
  is_paid: boolean;
  attendee_count: number;
  category: string | null;
};

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

const EventsPage = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("events" as any)
        .select("id,slug,title,description,cover_image,start_at,end_at,location,is_virtual,host_name,ticket_price,is_paid,attendee_count,category")
        .eq("is_published", true)
        .order("start_at", { ascending: true })
        .limit(80);
      const now = new Date();
      const nowISO = now.toISOString();
      if (filter === "upcoming") q = q.gte("start_at", nowISO);
      if (filter === "today") {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        q = q.gte("start_at", start.toISOString()).lte("start_at", end.toISOString());
      }
      if (filter === "week") {
        const end = new Date(); end.setDate(end.getDate() + 7);
        q = q.gte("start_at", nowISO).lte("start_at", end.toISOString());
      }
      if (filter === "free") q = q.eq("is_paid", false).gte("start_at", nowISO);
      if (filter === "paid") q = q.eq("is_paid", true).gte("start_at", nowISO);
      const { data } = await q;
      if (mounted) {
        setEvents((data as any) || []);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filter]);

  // Group events by date for Luma-style timeline
  const grouped = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const d = new Date(e.start_at);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [events]);

  // Featured = first event with a cover image
  const featured = events.find(e => e.cover_image) || events[0];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Events in Kenya — Discover, Host & Buy Tickets | KenyaAdvert"
        description="Browse and host events across Kenya. Concerts, conferences, meetups, weddings, parties, hikes — book free or paid tickets via M-Pesa."
        canonical="https://www.kenyaadverts.com/events"
        keywords="events Kenya, Nairobi events, concerts Kenya, meetups Nairobi, conferences Kenya, RSVP, buy event tickets Kenya, M-Pesa tickets"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app relative py-12 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Discover Kenya
              </span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
                Events worth<br/><span className="text-primary">showing up</span> for.
              </h1>
              <p className="mt-4 text-base text-muted-foreground md:text-lg">
                Concerts, hikes, weddings, conferences, launches — all happening near you. Or host your own and sell tickets via M-Pesa in 60 seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="shadow-md">
                  <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create event</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#discover">Browse events</a>
                </Button>
              </div>
            </div>
            {featured && (
              <Link to={`/events/${featured.slug}`} className="group relative block overflow-hidden rounded-3xl border border-border shadow-2xl">
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                  {featured.cover_image ? (
                    <img src={featured.cover_image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10">
                      <Calendar className="h-20 w-20 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="mb-2 inline-block rounded-full bg-primary/95 px-2.5 py-0.5 text-[10px] font-bold uppercase">Featured</span>
                  <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight">{featured.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/90">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(featured.start_at), "EEE, MMM d • h:mm a")}</span>
                    {(featured.location || featured.is_virtual) && (
                      <span className="inline-flex items-center gap-1">
                        {featured.is_virtual ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {featured.is_virtual ? "Virtual" : featured.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <main id="discover" className="container-app py-8 md:py-12">
        {/* Filter pills */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-base font-medium">No events {filter !== "upcoming" ? "match this filter" : "yet"}.</p>
            <p className="mb-5 text-sm text-muted-foreground">Be the first to host one — it's free.</p>
            <Button asChild>
              <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create event</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([dateKey, items]) => {
              const d = new Date(items[0].start_at);
              const dateLabel = isToday(d)
                ? "Today"
                : isTomorrow(d)
                ? "Tomorrow"
                : isThisWeek(d, { weekStartsOn: 1 })
                ? format(d, "EEEE")
                : format(d, "EEEE, MMMM d");
              return (
                <section key={dateKey}>
                  <div className="mb-5 flex items-end justify-between border-b border-border pb-3">
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-2xl font-extrabold tracking-tight">{dateLabel}</h2>
                      <span className="text-sm text-muted-foreground">{format(d, "MMM d, yyyy")}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{items.length} event{items.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(e => <EventPosterCard key={e.id} event={e} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const EventPosterCard = ({ event }: { event: EventRow }) => {
  const startDate = new Date(event.start_at);
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/30 to-primary/5">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Calendar className="h-16 w-16 text-primary/40" />
          </div>
        )}
        {/* Date tile overlay */}
        <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white/95 text-center shadow-md backdrop-blur-sm">
          <span className="text-[9px] font-bold uppercase text-primary">{format(startDate, "MMM")}</span>
          <span className="text-xl font-extrabold leading-none text-foreground">{format(startDate, "d")}</span>
        </div>
        {event.is_paid && event.ticket_price > 0 ? (
          <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
            KSh {Number(event.ticket_price).toLocaleString()}
          </div>
        ) : (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-500/95 px-3 py-1 text-xs font-bold text-white shadow">
            Free
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug">{event.title}</h3>
        {event.host_name && (
          <p className="line-clamp-1 text-xs text-muted-foreground">By {event.host_name}</p>
        )}
        <div className="mt-auto space-y-1 pt-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0 text-primary" />{format(startDate, "EEE, h:mm a")}</p>
          {(event.location || event.is_virtual) && (
            <p className="flex items-center gap-1.5">
              {event.is_virtual ? <Globe className="h-3 w-3 shrink-0 text-primary" /> : <MapPin className="h-3 w-3 shrink-0 text-primary" />}
              <span className="truncate">{event.is_virtual ? "Virtual event" : event.location}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5"><Users className="h-3 w-3 shrink-0 text-primary" />{event.attendee_count} going</p>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs font-semibold text-primary">
            {event.is_paid ? "Buy ticket" : "RSVP free"}
          </span>
          <Ticket className="h-4 w-4 text-primary" />
        </div>
      </div>
    </Link>
  );
};

export default EventsPage;
