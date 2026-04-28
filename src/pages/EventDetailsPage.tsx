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
import { Calendar, MapPin, Users, Ticket, Share2, Loader2, ExternalLink, CheckCircle2, Clock } from "lucide-react";
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
  user_id: string;
};

const EventDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvped, setRsvped] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);

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

  const share = async () => {
    const shareUrl = `${window.location.origin}/events/${event?.slug}`;
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
      ? { "@type": "VirtualLocation", url: event.virtual_link || `https://www.kenyaadverts.co.ke/events/${event.slug}` }
      : { "@type": "Place", name: event.location || "Kenya", address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: event.location || "Kenya" } },
    image: event.cover_image ? [event.cover_image] : undefined,
    description: event.description || `Join ${event.title} on ${format(startDate, "PPP")}`,
    organizer: { "@type": "Person", name: event.host_name || "KenyaAdvert Host" },
    offers: {
      "@type": "Offer",
      price: event.is_paid ? event.ticket_price : 0,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      url: `https://www.kenyaadverts.co.ke/events/${event.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${event.title} | KenyaAdvert Events`}
        description={(event.description || `Join ${event.title} on ${format(startDate, "PPP")}${event.location ? ` at ${event.location}` : ""}`).slice(0, 160)}
        canonical={`https://www.kenyaadverts.co.ke/events/${event.slug}`}
        ogImage={event.cover_image || undefined}
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="container-app max-w-6xl py-6 md:py-10">
        {/* Big cover */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-border shadow-lg">
          {event.cover_image ? (
            <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
              <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
              <Calendar className="h-24 w-24 text-primary/40" />
            </div>
          )}
        </div>

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
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{event.attendee_count}</span> going
                    {event.capacity && <span className="text-muted-foreground"> / {event.capacity}</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
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
              </div>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetailsPage;
