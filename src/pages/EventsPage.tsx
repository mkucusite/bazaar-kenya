import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Users, Ticket } from "lucide-react";
import { format } from "date-fns";

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

const filters = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
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
        .limit(60);
      const now = new Date().toISOString();
      if (filter === "upcoming") q = q.gte("start_at", now);
      if (filter === "today") {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        q = q.gte("start_at", start.toISOString()).lte("start_at", end.toISOString());
      }
      if (filter === "free") q = q.eq("is_paid", false);
      if (filter === "paid") q = q.eq("is_paid", true);
      const { data } = await q;
      if (mounted) {
        setEvents((data as any) || []);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filter]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Events in Kenya — Discover, Host & RSVP | KenyaAdvert"
        description="Browse and host events across Kenya. Concerts, conferences, meetups, weddings, parties, hikes — book free or paid tickets via M-Pesa."
        canonical="https://www.kenyaadverts.co.ke/events"
        keywords="events Kenya, Nairobi events, concerts Kenya, meetups Nairobi, conferences Kenya, RSVP, buy event tickets Kenya, M-Pesa tickets"
      />
      <Navbar />
      <main className="container-app py-6 md:py-10">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Events</h1>
            <p className="mt-1 text-sm md:text-base text-muted-foreground">
              Discover, share and host events across Kenya. Free or paid via M-Pesa.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
            <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create Event</Link>
          </Button>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No events yet. Be the first to host one.</p>
            <Button asChild className="mt-4">
              <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create Event</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const EventCard = ({ event }: { event: EventRow }) => {
  const startDate = new Date(event.start_at);
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Calendar className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-lg bg-background/95 px-2.5 py-1.5 text-center shadow-sm backdrop-blur-sm">
          <div className="text-[10px] font-bold uppercase text-primary">
            {format(startDate, "MMM")}
          </div>
          <div className="text-lg font-bold leading-none">
            {format(startDate, "d")}
          </div>
        </div>
        {event.is_paid && event.ticket_price > 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
            KSh {Number(event.ticket_price).toLocaleString()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-semibold">{event.title}</h3>
        <p className="text-xs text-muted-foreground">
          {format(startDate, "EEE, MMM d • h:mm a")}
        </p>
        {(event.location || event.is_virtual) && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.is_virtual ? "Virtual event" : event.location}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {event.attendee_count} going
          </span>
          <span className="flex items-center gap-1 font-medium text-primary">
            <Ticket className="h-3 w-3" />
            {event.is_paid ? "Buy ticket" : "Free RSVP"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventsPage;
