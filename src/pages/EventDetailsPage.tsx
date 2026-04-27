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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${event.title} | KenyaAdvert Events`}
        description={(event.description || `Join ${event.title} on ${format(startDate, "PPP")}`).slice(0, 160)}
        canonical={`https://www.kenyaadverts.co.ke/events/${event.slug}`}
        ogImage={event.cover_image || undefined}
      />
      <Navbar />

      <main className="container-app max-w-3xl py-6 md:py-10">
        <Card className="overflow-hidden">
          {event.cover_image ? (
            <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
              <img src={event.cover_image} alt={event.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Calendar className="h-20 w-20 text-primary/40" />
            </div>
          )}

          <div className="space-y-5 p-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>
              {event.host_name && (
                <p className="mt-1 text-sm text-muted-foreground">Hosted by <span className="font-medium text-foreground">{event.host_name}</span></p>
              )}
            </div>

            <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">{format(startDate, "EEEE, MMMM d, yyyy")}</div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(startDate, "h:mm a")}{endDate ? ` — ${format(endDate, "h:mm a")}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  {event.is_virtual ? (
                    <>
                      <div className="font-medium">Virtual event</div>
                      {event.virtual_link && rsvped && (
                        <a href={event.virtual_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          Join link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {event.virtual_link && !rsvped && (
                        <div className="text-muted-foreground">Link revealed after RSVP</div>
                      )}
                    </>
                  ) : (
                    <div className="font-medium">{event.location || "Location TBA"}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <span className="font-medium">{event.attendee_count}</span> going
                  {event.capacity && <span className="text-muted-foreground"> / {event.capacity} capacity</span>}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="prose prose-sm max-w-none text-foreground/90">
                <h2 className="text-lg font-semibold">About</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {rsvped ? (
                <Button size="lg" className="flex-1" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4" />You're going
                </Button>
              ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="flex-1">
                      <Ticket className="mr-2 h-4 w-4" />
                      {event.is_paid && event.ticket_price > 0
                        ? `Buy ticket — KSh ${Number(event.ticket_price).toLocaleString()}`
                        : "Free RSVP"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{event.is_paid ? "Buy ticket" : "RSVP"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRsvp} className="space-y-3">
                      <div>
                        <Label>Full name</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div>
                        <Label>{event.is_paid ? "M-Pesa phone (07... / 011...)" : "Phone"}</Label>
                        <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Email (optional)</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      {event.is_paid && (
                        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                          You will receive an M-Pesa STK push for <span className="font-semibold text-foreground">KSh {Number(event.ticket_price).toLocaleString()}</span>. Enter your PIN to confirm.
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
              <Button size="lg" variant="outline" onClick={share}>
                <Share2 className="mr-2 h-4 w-4" />Share
              </Button>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetailsPage;
