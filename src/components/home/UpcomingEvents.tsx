import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Globe, Ticket, ArrowRight } from "lucide-react";
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

const UpcomingEvents = () => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(4);
      if (mounted) {
        setEvents(((data as any) || []) as UpcomingEvent[]);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <section className="container-app py-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-3xl">
            <Calendar className="h-6 w-6 text-primary" />
            Upcoming Events Near You
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The next 4 events happening across Kenya
          </p>
        </div>
        <Link
          to="/events"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((e) => {
            const d = new Date(e.start_at);
            return (
              <Link
                key={e.id}
                to={`/events/${e.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  {e.cover_image ? (
                    <img
                      src={e.cover_image}
                      alt={e.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Calendar className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                    {timeUntil(e.start_at)}
                  </span>
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow ${
                      e.is_paid && e.ticket_price > 0
                        ? "bg-white/95 text-foreground"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {e.is_paid && e.ticket_price > 0
                      ? `KSh ${Number(e.ticket_price).toLocaleString()}`
                      : "Free"}
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
                      {e.is_virtual ? (
                        <Globe className="h-3 w-3 shrink-0 text-primary" />
                      ) : (
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      )}
                      <span className="truncate">
                        {e.is_virtual ? "Virtual" : e.location}
                      </span>
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
