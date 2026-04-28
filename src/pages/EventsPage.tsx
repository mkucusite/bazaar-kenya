import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Users, Ticket, Sparkles, Globe } from "lucide-react";
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

  // Group events by date for timeline layout
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Events in Kenya — Discover, Host & Buy Tickets | KenyaAdvert"
        description="Browse and host events across Kenya. Concerts, conferences, meetups, weddings, parties, hikes — book free or paid tickets via M-Pesa."
        canonical="https://www.kenyaadverts.co.ke/events"
        keywords="events Kenya, Nairobi events, concerts Kenya, meetups Nairobi, conferences Kenya, RSVP, buy event tickets Kenya, M-Pesa tickets"
      />
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="container-app py-10 md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Discover Kenya
              </span>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Events worth <span className="text-primary">showing up</span> for
              </h1>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Find concerts, meetups, weddings & launches near you. Or host your own — collect free RSVPs or sell tickets via M-Pesa in 60 seconds.
              </p>
            </div>
            <Button asChild size="lg" className="shadow-md">
              <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create Event</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="container-app py-6 md:py-10">
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
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-base font-medium">No events {filter !== "upcoming" ? "match this filter" : "yet"}.</p>
            <p className="mb-5 text-sm text-muted-foreground">Be the first to host one — it's free.</p>
            <Button asChild>
              <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create Event</Link>
            </Button>
          </div>
        ) : (
          // Luma-style timeline grouped by date
          <div className="space-y-10">
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
                  <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-2">
                    <h2 className="text-xl font-bold">{dateLabel}</h2>
                    <span className="text-sm text-muted-foreground">{format(d, "MMM d, yyyy")}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map(e => <EventRowCard key={e.id} event={e} />)}
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

const EventRowCard = ({ event }: { event: EventRow }) => {
  const startDate = new Date(event.start_at);
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-32 sm:w-32">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
            <Calendar className="h-10 w-10 text-primary/50" />
          </div>
        )}
        {event.is_paid && event.ticket_price > 0 && (
          <div className="absolute right-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
            KSh {Number(event.ticket_price).toLocaleString()}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <p className="text-xs font-semibold text-primary">{format(startDate, "h:mm a")}</p>
        <h3 className="line-clamp-2 text-base font-bold leading-tight">{event.title}</h3>
        {event.host_name && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">By {event.host_name}</p>
        )}
        {(event.location || event.is_virtual) && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {event.is_virtual ? <Globe className="h-3 w-3 shrink-0" /> : <MapPin className="h-3 w-3 shrink-0" />}
            <span className="truncate">{event.is_virtual ? "Virtual" : event.location}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />{event.attendee_count} going
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Ticket className="h-3 w-3" />{event.is_paid ? "Buy" : "Free RSVP"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventsPage;
