import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Eye, Ticket, Share2, Loader2, ExternalLink, CheckCircle2, Clock, Bell, BellOff, UserCheck, Facebook, Twitter, MessageCircle as WhatsappIcon } from "lucide-react";
import { toast } from "sonner";
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
  virtual_link: string | null;
  is_virtual: boolean;
  host_name: string | null;
  ticket_price: number;
  is_paid: boolean;
  capacity: number | null;
  attendee_count: number;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
  user_id: string;
};

type Attendee = { id: string; name: string; phone: string; email: string | null; ticket_type: string; status: string; created_at: string };

const EventDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvped, setRsvped] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [now, setNow] = useState(Date.now());

  const isHost = !!user && !!event && user.id === event.user_id;

  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("events" as any).select("*").eq("slug", slug).maybeSingle();
      if (mounted) {
        setEvent(data as any);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  useEffect(() => {
    if (user && event) {
      supabase
        .from("event_rsvps" as any)
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .maybeSingle()
        .then(({ data }) => {
          if (data) setRsvped(true);
        });
    }
  }, [user, event]);

  useEffect(() => {
    if (!event) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [event?.id]);

  useEffect(() => {
    if (!event?.id) return;
    const key = `event-viewed-${event.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_event_views" as any, { target_event_id: event.id } as any);
    setEvent((current) => current ? { ...current, views_count: (current.views_count || 0) + 1 } : current);
  }, [event?.id]);

  // Load attendees + realtime updates for the host
  useEffect(() => {
    if (!isHost || !event) return;
    const fetchList = async () => {
      const { data } = await supabase
        .from("event_rsvps" as any)
        .select("id,name,phone,email,ticket_type,status,created_at")
        .eq("event_id", event.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });
      setAttendees((data as any) || []);
    };
    fetchList();
    const channel = supabase
      .channel(`rsvp-${event.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_rsvps", filter: `event_id=eq.${event.id}` }, (payload: any) => {
        fetchList();
        if (payload.eventType === "INSERT" && payload.new?.status === "confirmed") {
          // Browser notification if permission granted
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`New RSVP — ${event.title}`, { body: `${payload.new.name} is going.`, icon: "/pwa-icon-192.png" }); } catch {}
          }
          toast.success(`${payload.new.name} just RSVP'd!`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isHost, event]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") { toast.error("Notifications not supported"); return; }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") toast.success("Notifications enabled");
    else toast.info("Notifications blocked. Enable from browser settings.");
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/share/event/${event?.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, text: event?.description || "", url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    }
  };


  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSubmitting(true);
    try {
      if (event.is_paid && event.ticket_price > 0) {
        // Initiate M-Pesa payment
        const { data: payRes, error: payErr } = await supabase.functions.invoke("initiate-payment", {
          body: {
            phone: form.phone,
            amount: event.ticket_price,
            package_type: `event_ticket:${event.id}`,
            user_id: user?.id || null,
          },
        });
        if (payErr || !payRes?.success) throw new Error(payRes?.error || payErr?.message || "Payment failed");

        toast.success("STK push sent — check your phone");
        const paymentId = payRes.payment_id;

        // Create pending RSVP
        const { data: rsvp, error: rsvpErr } = await supabase
          .from("event_rsvps" as any)
          .insert({
            event_id: event.id,
            user_id: user?.id || null,
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            ticket_type: "paid",
            payment_id: paymentId,
            status: "pending_payment",
          } as any)
          .select("id")
          .single();
        if (rsvpErr) throw rsvpErr;

        // Poll for payment completion
        setPaymentPolling(true);
        const pollStart = Date.now();
        const poll = async (): Promise<boolean> => {
          while (Date.now() - pollStart < 90000) {
            await new Promise(r => setTimeout(r, 4000));
            const { data: p } = await supabase
              .from("payments")
              .select("payment_status")
              .eq("id", paymentId)
              .maybeSingle();
            if (p?.payment_status === "completed") return true;
            if (p?.payment_status === "failed") return false;
          }
          return false;
        };
        const ok = await poll();
        setPaymentPolling(false);
        if (ok) {
          await supabase.from("event_rsvps" as any).update({ status: "confirmed" } as any).eq("id", (rsvp as any).id);
          await supabase.rpc("increment_event_attendees", { target_event_id: event.id } as any);
          setRsvped(true);
          setEvent({ ...event, attendee_count: event.attendee_count + 1 });
          setOpen(false);
          toast.success("Ticket confirmed! 🎉");
        } else {
          toast.error("Payment not confirmed. You can retry from the event page.");
        }
      } else {
        // Free RSVP
        const { error } = await supabase.from("event_rsvps" as any).insert({
          event_id: event.id,
          user_id: user?.id || null,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          ticket_type: "free",
          status: "confirmed",
        } as any);
        if (error) throw error;
        await supabase.rpc("increment_event_attendees", { target_event_id: event.id } as any);
        setRsvped(true);
        setEvent({ ...event, attendee_count: event.attendee_count + 1 });
        setOpen(false);
        toast.success("You're going! 🎉");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "RSVP failed";
      toast.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-app py-20 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Button asChild className="mt-4"><Link to="/events">Browse events</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const startDate = new Date(event.start_at);
  const endDate = event.end_at ? new Date(event.end_at) : null;
  const timeLeft = Math.max(0, startDate.getTime() - now);
  const countdownDays = Math.floor(timeLeft / 86400000);
  const countdownHours = Math.floor((timeLeft % 86400000) / 3600000);
  const countdownMinutes = Math.floor((timeLeft % 3600000) / 60000);
  const eventLink = event.virtual_link?.trim() || "";
  const isFormLink = /forms\.gle|docs\.google\.com\/forms|typeform|jotform|airtable|form/i.test(eventLink);
  const canonicalUrl = `https://www.kenyaadverts.com/events/${event.slug}`;
  const organizerName = event.host_name || "KenyaAdvert Events";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_at,
    endDate: event.end_at || undefined,
    eventAttendanceMode: event.is_virtual
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.is_virtual
      ? { "@type": "VirtualLocation", url: event.virtual_link || `https://www.kenyaadverts.com/events/${event.slug}` }
      : { "@type": "Place", name: event.location || "Kenya", address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: event.location || "Kenya" } },
    image: event.cover_image ? [event.cover_image] : undefined,
    description: event.description || `Join ${event.title} on ${format(startDate, "PPP")}`,
    organizer: { "@type": "Organization", name: organizerName, url: canonicalUrl },
    performer: { "@type": "Organization", name: organizerName, url: canonicalUrl },
    offers: {
      "@type": "Offer",
      price: event.is_paid ? event.ticket_price : 0,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      validFrom: event.created_at || event.updated_at || event.start_at,
      url: canonicalUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${event.title} | KenyaAdvert Events`}
        description={(event.description || `Join ${event.title} on ${format(startDate, "PPP")}${event.location ? ` at ${event.location}` : ""}`).slice(0, 160)}
        canonical={canonicalUrl}
        ogImage={event.cover_image || undefined}
        structuredData={jsonLd}
      />
      <Navbar />

      <main className="container-app max-w-6xl py-6 md:py-10">
        {/* Big cover - clickable to open lightbox. Uses dark backdrop + object-contain
            so the FULL poster is visible (no top/bottom cropping). */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-muted/40 to-muted/10 shadow-lg">
          {event.cover_image ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="group flex w-full items-center justify-center bg-black/5 dark:bg-black/40"
              aria-label="View full poster"
              style={{ minHeight: "300px" }}
            >
              <img
                src={event.cover_image}
                alt={event.title}
                className="max-h-[70vh] w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                loading="eager"
              />
            </button>
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
              <Calendar className="h-24 w-24 text-primary/40" />
            </div>
          )}
        </div>

        {/* Lightbox */}
        {event.cover_image && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
              <img src={event.cover_image} alt={event.title} className="h-auto max-h-[85vh] w-full rounded-xl object-contain" />
            </DialogContent>
          </Dialog>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: title + description */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-primary">
                {format(startDate, "EEEE, MMMM d • h:mm a")}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-5xl">{event.title}</h1>
              {event.host_name && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Hosted by <span className="font-semibold text-foreground">{event.host_name}</span>
                </p>
              )}
            </div>

            {event.description && (
              <div>
                <h2 className="mb-2 text-lg font-bold">About this event</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              </div>
            )}
          </div>

          {/* Right: sticky RSVP card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="space-y-4 p-5 shadow-md">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-primary">{countdownDays}</div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Days</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-primary">{countdownHours}</div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Hours</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-primary">{countdownMinutes}</div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Mins</div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-muted/40">
                    <span className="text-[9px] font-bold uppercase text-primary">{format(startDate, "MMM")}</span>
                    <span className="text-lg font-bold leading-none">{format(startDate, "d")}</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{format(startDate, "EEEE, MMM d")}</div>
                    <div className="text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(startDate, "h:mm a")}{endDate ? ` — ${format(endDate, "h:mm a")}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    {event.is_virtual ? (
                      <>
                        <div className="font-semibold">Virtual event</div>
                        {event.virtual_link && rsvped ? (
                          <a href={event.virtual_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            Join link <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : event.virtual_link ? (
                          <div className="text-muted-foreground">Link revealed after RSVP</div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <div className="font-semibold">{event.location || "Location TBA"}</div>
                        <div className="text-xs text-muted-foreground">In-person event</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{(event.views_count || 0).toLocaleString()}</span> page visits
                    {event.capacity && <span className="block text-xs text-muted-foreground">Capacity: {event.capacity}</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                {eventLink && (
                  <Button asChild size="lg" variant={isFormLink ? "default" : "secondary"} className="mb-2 w-full font-bold">
                    <a href={eventLink} target="_blank" rel="noopener noreferrer">
                      {isFormLink ? "Fill this form" : event.is_virtual ? "Open event link" : "Open event link"}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                {rsvped ? (
                  <Button size="lg" className="w-full" disabled>
                    <CheckCircle2 className="mr-2 h-4 w-4" />You're going
                  </Button>
                ) : (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full font-bold">
                        <Ticket className="mr-2 h-4 w-4" />
                        {event.is_paid && event.ticket_price > 0
                          ? `Buy — KSh ${Number(event.ticket_price).toLocaleString()}`
                          : "Free RSVP"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{event.is_paid ? "Buy your ticket" : "RSVP for free"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRsvp} className="space-y-3">
                        <div>
                          <Label>Full name</Label>
                          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label>{event.is_paid ? "M-Pesa phone (07.../011...)" : "Phone"}</Label>
                          <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Email (optional)</Label>
                          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        {event.is_paid && (
                          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                            You'll get an M-Pesa STK push for <span className="font-semibold text-foreground">KSh {Number(event.ticket_price).toLocaleString()}</span>. Enter your PIN to confirm.
                          </div>
                        )}
                        <Button type="submit" className="w-full" disabled={submitting || paymentPolling}>
                          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> :
                            paymentPolling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Waiting for M-Pesa...</> :
                            event.is_paid ? "Pay with M-Pesa" : "Confirm RSVP"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={share}>
                  <Share2 className="mr-2 h-4 w-4" />Share event
                </Button>

                {/* Quick share row */}
                <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground">Share:</span>
                  <a href={`https://wa.me/?text=${encodeURIComponent((event.title + " ") + window.location.origin + "/share/event/" + event.slug)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" aria-label="Share on WhatsApp">
                    <WhatsappIcon className="h-4 w-4" />
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.origin + "/share/event/" + event.slug)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950" aria-label="Share on X">
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/share/event/" + event.slug)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" aria-label="Share on Facebook">
                    <Facebook className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Host-only attendees section */}
        {isHost && (
          <section id="attendees" className="mt-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Attendees</h2>
                <p className="text-sm text-muted-foreground">{attendees.length} confirmed RSVP{attendees.length === 1 ? "" : "s"} — only you (the host) can see this list.</p>
              </div>
              {notifPerm !== "granted" ? (
                <Button size="sm" variant="outline" onClick={enableNotifications}>
                  <Bell className="mr-2 h-4 w-4" />Get notified of new RSVPs
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <BellOff className="h-3 w-3" />Notifications on
                </span>
              )}
            </div>

            {attendees.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
                <UserCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No RSVPs yet. Share your event to invite people.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Phone</th>
                      <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell">Ticket</th>
                      <th className="hidden px-4 py-3 text-left font-semibold md:table-cell">RSVP'd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a) => (
                      <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{a.name}</td>
                        <td className="px-4 py-3">
                          <a href={`tel:${a.phone}`} className="text-primary hover:underline">{a.phone}</a>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.ticket_type === "paid" ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}`}>
                            {a.ticket_type}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">{format(new Date(a.created_at), "MMM d, h:mm a")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventDetailsPage;
