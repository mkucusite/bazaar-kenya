import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Globe, Ticket, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { timeUntil } from "@/lib/eventTypes";

type UpcomingEvent = {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  start_at: string;
  location: string | null;
  is_virtual: boolean;
  is_paid: boolean;
  ticket_price: number;
};

const PAGE_SIZES = { base: 1, sm: 2, lg: 4 };

const UpcomingEvents = () => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(1);
  const pausedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("events" as any)
        .select("id,slug,title,cover_image,start_at,location,is_virtual,is_paid,ticket_price")
        .eq("is_published", true)
        .eq("is_listed", true)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(12);
      if (mounted) {
        setEvents(((data as any) || []) as UpcomingEvent[]);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Responsive page size
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setPageSize(w >= 1024 ? PAGE_SIZES.lg : w >= 640 ? PAGE_SIZES.sm : PAGE_SIZES.base);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));

  // Auto-jump every 5s
  useEffect(() => {
    if (events.length <= pageSize) return;
    const t = window.setInterval(() => {
      if (pausedRef.current) return;
      setPage((p) => (p + 1) % totalPages);
    }, 5000);
    return () => window.clearInterval(t);
  }, [events.length, pageSize, totalPages]);

  // Clamp page when size changes
  useEffect(() => { setPage((p) => Math.min(p, totalPages - 1)); }, [totalPages]);

  if (!loading && events.length === 0) return null;

  const start = page * pageSize;
  const visible = events.slice(start, start + pageSize);

  return (
    <section className="container-app py-10"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-3xl">
            <Calendar className="h-6 w-6 text-primary" />
            Upcoming Events Near You
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The next events happening across Kenya
          </p>
        </div>
        <div className="flex items-center gap-2">
          {events.length > pageSize && (
            <div className="hidden gap-1 sm:flex">
              <button
                onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
                aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
              ><ChevronLeft className="h-4 w-4" /></button>
              <button
                onClick={() => setPage((p) => (p + 1) % totalPages)}
                aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
              ><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
          <Link to="/events" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div
            key={page}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-right-4 duration-500"
          >
            {visible.map((e) => {
              const d = new Date(e.start_at);
              return (
                <Link
                  key={e.id}
                  to={`/events/${e.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {e.cover_image ? (
                      <img src={e.cover_image} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Calendar className="h-12 w-12 text-primary/40" /></div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                      {timeUntil(e.start_at)}
                    </span>
                    <span className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow ${e.is_paid && e.ticket_price > 0 ? "bg-white/95 text-foreground" : "bg-emerald-500 text-white"}`}>
                      {e.is_paid && e.ticket_price > 0 ? `KSh ${Number(e.ticket_price).toLocaleString()}` : "Free"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug">{e.title}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-primary" />
                      {format(d, "EEE d MMM • h:mm a")}
                    </p>
                    {(e.location || e.is_virtual) && (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        {e.is_virtual ? <Globe className="h-3 w-3 shrink-0 text-primary" /> : <MapPin className="h-3 w-3 shrink-0 text-primary" />}
                        <span className="truncate">{e.is_virtual ? "Virtual" : e.location}</span>
                      </p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-primary">
                      <Ticket className="h-3 w-3" />
                      {e.is_paid ? "Buy ticket" : "RSVP free"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {events.length > pageSize && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-5 text-center sm:hidden">
        <Link to="/events" className="text-sm font-semibold text-primary hover:underline">
          View all events →
        </Link>
      </div>
    </section>
  );
};

export default UpcomingEvents;
