import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Users, Ticket, Globe, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Featured = up to 5 events with cover images for the swipe hero
  const featuredEvents = events.filter(e => e.cover_image).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Events in Kenya — Discover, Host & Buy Tickets | KenyaAdvert"
        description="Browse and host events across Kenya. Concerts, conferences, meetups, weddings, parties, hikes — book free or paid tickets via M-Pesa."
        canonical="https://www.kenyaadverts.com/events"
        keywords="events Kenya, Nairobi events, concerts Kenya, meetups Nairobi, conferences Kenya, RSVP, buy event tickets Kenya, M-Pesa tickets"
      />
      <Navbar />

      {/* Swipe hero carousel */}
      <HeroCarousel events={featuredEvents} loading={loading} />

      <main id="discover" className="container-app py-8 md:py-12">
        {/* Filter pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
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

        <h2 className="mb-5 text-2xl font-extrabold tracking-tight">
          {filter === "upcoming" ? "All upcoming events" :
           filter === "today" ? "Happening today" :
           filter === "week" ? "This week" :
           filter === "free" ? "Free events" : "Paid events"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(e => <EventPosterCard key={e.id} event={e} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

// ============= AUTO-ROTATING SWIPE HERO =============
const HeroCarousel = ({ events, loading }: { events: EventRow[]; loading: boolean }) => {
  const autoplay = useRef(Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (loading) {
    return (
      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-10">
          <div className="h-72 animate-pulse rounded-3xl bg-muted md:h-96" />
        </div>
      </section>
    );
  }

  // Empty state hero
  if (events.length === 0) {
    return (
      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-12 text-center md:py-20">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Events worth <span className="text-primary">showing up</span> for.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Concerts, hikes, weddings, conferences, launches — host yours and share in 60 seconds.
          </p>
          <Button asChild size="lg" className="mt-6 shadow-md">
            <Link to="/events/new"><Plus className="mr-2 h-4 w-4" />Create event</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
      <div className="container-app py-6 md:py-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
              Events worth <span className="text-primary">showing up</span> for
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Swipe through what's happening in Kenya</p>
          </div>
          <Button asChild size="sm" className="shrink-0 shadow-sm md:size-default">
            <Link to="/events/new"><Plus className="mr-1.5 h-4 w-4" />Host</Link>
          </Button>
        </div>

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-3xl">
            <div className="flex">
              {events.map((e) => <HeroSlide key={e.id} event={e} />)}
            </div>
          </div>

          {/* Arrows */}
          {events.length > 1 && (
            <>
              <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white sm:flex" aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => emblaApi?.scrollNext()} className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white sm:flex" aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {events.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {events.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${selectedIdx === i ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const HeroSlide = ({ event }: { event: EventRow }) => {
  const startDate = new Date(event.start_at);
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group relative block min-w-0 flex-[0_0_100%] overflow-hidden bg-black"
    >
      <div className="relative h-[55vh] max-h-[520px] min-h-[280px] w-full">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="eager"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10">
            <Calendar className="h-20 w-20 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Date tile */}
        <div className="absolute left-4 top-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white/95 text-center shadow-xl backdrop-blur sm:left-6 sm:top-6 sm:h-20 sm:w-20">
          <span className="text-[10px] font-bold uppercase text-primary">{format(startDate, "MMM")}</span>
          <span className="text-2xl font-black leading-none text-foreground sm:text-3xl">{format(startDate, "d")}</span>
        </div>

        {/* Price/Free badge */}
        <span className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold shadow-md sm:right-6 sm:top-6 ${
          event.is_paid && event.ticket_price > 0
            ? "bg-primary text-primary-foreground"
            : "bg-emerald-500 text-white"
        }`}>
          {event.is_paid && event.ticket_price > 0 ? `KSh ${Number(event.ticket_price).toLocaleString()}` : "Free"}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <span className="mb-2 inline-block rounded-full bg-primary/95 px-2.5 py-0.5 text-[10px] font-bold uppercase">Featured</span>
          <h3 className="line-clamp-2 text-2xl font-black leading-tight drop-shadow-lg sm:text-4xl">{event.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/95 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(startDate, "EEE • h:mm a")}</span>
            {(event.location || event.is_virtual) && (
              <span className="inline-flex items-center gap-1.5">
                {event.is_virtual ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                {event.is_virtual ? "Virtual" : event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{event.attendee_count} going</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ============= POSTER CARD (full image, no crop) =============
const EventPosterCard = ({ event }: { event: EventRow }) => {
  const startDate = new Date(event.start_at);
  return (
    <Link
      to={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      {/* Full poster — object-contain so the whole flyer is visible */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-muted/50 to-muted/20" style={{ minHeight: "260px" }}>
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="max-h-[420px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center">
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
