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
import { Calendar, MapPin, Eye, Ticket, Share2, Loader2, ExternalLink, CheckCircle2, Clock, Bell, BellOff, UserCheck, Facebook, Twitter, MessageCircle as WhatsappIcon, Pencil, ImagePlus, X, Flag, Rocket } from "lucide-react";
import ReportDialog from "@/components/ReportDialog";
import BoostEventDialog from "@/components/events/BoostEventDialog";
import FormattedDescription from "@/components/FormattedDescription";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";
import { optimizeImageUrl } from "@/lib/image-utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { uploadFile } from "@/services/uploadService";


type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  gallery_images?: string[] | null;
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
  const [moreEvents, setMoreEvents] = useState<Array<{ slug: string; title: string; cover_image: string | null; start_at: string; is_virtual: boolean; location: string | null }>>([]);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [now, setNow] = useState(Date.now());
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    host_name: "",
    start_at: "",
    end_at: "",
    is_paid: false,
    ticket_price: 0,
    is_virtual: false,
    virtual_link: "",
    capacity: "" as string | number,
  });
  const [editCoverFiles, setEditCoverFiles] = useState<File[]>([]);
  const [editCoverPreviews, setEditCoverPreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);

  const isHost = !!user && !!event && user.id === event.user_id;

  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEditDialog = () => {
    if (!event) return;
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      host_name: event.host_name || "",
      start_at: toLocalInput(event.start_at),
      end_at: toLocalInput(event.end_at),
      is_paid: !!event.is_paid,
      ticket_price: Number(event.ticket_price) || 0,
      is_virtual: !!event.is_virtual,
      virtual_link: event.virtual_link || "",
      capacity: event.capacity ?? "",
    });
    setEditCoverFiles([]);
    setEditCoverPreviews((event.gallery_images && event.gallery_images.length > 0) ? event.gallery_images.slice(0, 3) : (event.cover_image ? [event.cover_image] : []));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!event || !user) return;
    setSavingEdit(true);
    try {
      let galleryImages = editCoverPreviews.slice(0, 3);
      if (editCoverFiles.length > 0) {
        galleryImages = [];
        for (const file of editCoverFiles) {
          galleryImages.push(await uploadFile(file, "events"));
        }
      }
      const coverUrl = galleryImages[0] || event.cover_image;
      const startISO = editForm.start_at ? new Date(editForm.start_at).toISOString() : event.start_at;
      const endISO = editForm.end_at ? new Date(editForm.end_at).toISOString() : null;
      const cap = editForm.capacity === "" || editForm.capacity == null ? null : Number(editForm.capacity);
      const payload: any = {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        location: editForm.is_virtual ? null : (editForm.location.trim() || null),
        host_name: editForm.host_name.trim() || null,
        start_at: startISO,
        end_at: endISO,
        is_paid: editForm.is_paid,
        ticket_price: editForm.is_paid ? Number(editForm.ticket_price) || 0 : 0,
        is_virtual: editForm.is_virtual,
        virtual_link: editForm.virtual_link.trim() || null,
        capacity: cap,
        cover_image: coverUrl,
        gallery_images: galleryImages,
      };
      const { error } = await supabase.from("events" as any).update(payload).eq("id", event.id);
      if (error) throw error;
      setEvent({ ...event, ...payload, start_at: startISO, end_at: endISO } as any);
      setEditOpen(false);
      toast.success("Event updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  };

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
    if (!event?.id) return;
    supabase
      .from("events" as any)
      .select("slug,title,cover_image,start_at,is_virtual,location")
      .eq("is_published", true)
      .neq("id", event.id)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(6)
      .then(({ data }) => {
        setMoreEvents(((data as any[]) || []).filter((e) => e.slug).slice(0, 3));
      });
  }, [event?.id]);


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
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [event?.id]);

  const eventImages = event
    ? ((event.gallery_images && event.gallery_images.length > 0) ? event.gallery_images : (event.cover_image ? [event.cover_image] : []))
    : [];

  useEffect(() => {
    if (eventImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentImageIndex((current) => (current + 1) % eventImages.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [eventImages.length]);

  useEffect(() => {
    if (!event?.id) return;
    const key = `event-viewed-${event.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment_event_views" as any, { target_event_id: event.id } as any);
    supabase.rpc("bump_event_engagement" as any, { target_event_id: event.id } as any);
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
    const shareTitle = event?.title || "Event";
    // Put the link first so previews & messaging apps highlight it immediately
    const shareText = `${shareUrl}\n\n${shareTitle}${event?.location ? ` — ${event.location}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
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
  const countdownSeconds = Math.floor((timeLeft % 60000) / 1000);
  const eventState = endDate && now >= endDate.getTime() ? "ended" : now >= startDate.getTime() ? "live" : "upcoming";
  const eventLink = event.virtual_link?.trim() || "";
  const isFormLink = /forms\.gle|docs\.google\.com\/forms|typeform|jotform|airtable|form/i.test(eventLink);
  const canonicalUrl = `https://www.kenyaadverts.com/events/${event.slug}`;
  const organizerName = event.host_name || event.title;

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
    image: eventImages.length ? eventImages : undefined,
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

  // Build a rich SEO description: "Title. Hosted by X. About: ... Date: ... Location: ... Free entry."
  const cleanedAbout = (event.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const dateLine = `${format(startDate, "EEEE, MMMM d, yyyy")} at ${format(startDate, "h:mm a")}`;
  const venueLine = event.is_virtual ? "Virtual event" : (event.location ? `${event.location}, Kenya` : "Kenya");
  const priceLine = event.is_paid && event.ticket_price > 0 ? `Tickets KSh ${Number(event.ticket_price).toLocaleString()}` : "Free entry";
  const descParts = [
    `${event.title}.`,
    event.host_name ? `Hosted by ${event.host_name}.` : null,
    cleanedAbout ? `About this event: ${cleanedAbout}.` : null,
    `Date: ${dateLine}.`,
    `Venue: ${venueLine}.`,
    `${priceLine}.`,
    "RSVP free on KenyaAdvert.",
  ].filter(Boolean).join(" ");
  const metaDescription = descParts.length > 320 ? descParts.slice(0, 317).trim() + "..." : descParts;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${event.title}${event.host_name ? ` — Hosted by ${event.host_name}` : ""} | ${format(startDate, "MMM d, yyyy")}`}
        description={metaDescription}
        canonical={canonicalUrl}
        ogImage={eventImages[0] || undefined}
        structuredData={jsonLd}
        keywords={`${event.title}, ${event.host_name || ""}, ${event.location || ""}, events Kenya, ${format(startDate, "MMMM yyyy")}, RSVP, KenyaAdvert events`}
      />
      <Navbar />

      <main className="container-app max-w-6xl py-6 md:py-10">
        {/* Big cover - clickable to open lightbox. Uses dark backdrop + object-contain
            so the FULL poster is visible (no top/bottom cropping). */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-muted/40 to-muted/10 shadow-lg">
          {eventImages.length > 0 ? (
            <div className="relative bg-black/5 dark:bg-black/40">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group flex w-full items-center justify-center"
                aria-label="View full poster"
                style={{ minHeight: "300px" }}
              >
                <img
                  src={optimizeImageUrl(eventImages[currentImageIndex] || eventImages[0], 1400)}
                  alt={event.title}
                  className="max-h-[70vh] w-full object-contain transition-opacity duration-500 group-hover:scale-[1.01]"
                  loading="eager"
                />
              </button>
              {eventImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {eventImages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${currentImageIndex === index ? "w-6 bg-primary" : "w-1.5 bg-background/80"}`}
                      aria-label={`Show image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
              <Calendar className="h-24 w-24 text-primary/40" />
            </div>
          )}
        </div>

        {/* Lightbox */}
        {eventImages.length > 0 && (
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
              <img src={eventImages[currentImageIndex] || eventImages[0]} alt={event.title} className="h-auto max-h-[85vh] w-full rounded-xl object-contain" />
            </DialogContent>
          </Dialog>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: title + description */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">
                  {format(startDate, "EEEE, MMMM d • h:mm a")}
                </p>
                <div className="flex gap-2">
                  {isHost && (
                    <Button size="sm" variant="outline" onClick={openEditDialog}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />Edit
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setBoostOpen(true)}>
                    <Rocket className="mr-1.5 h-3.5 w-3.5" />Boost
                  </Button>
                </div>
              </div>
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
                <FormattedDescription text={event.description} className="text-sm leading-relaxed text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right: sticky RSVP card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="space-y-4 p-5 shadow-md">
              {eventState !== "upcoming" ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center font-bold text-primary">
                  {eventState === "live" ? "Live now" : "Event ended"}
                </div>
              ) : <div className="grid grid-cols-4 gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
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
                <div>
                  <div className="text-2xl font-extrabold text-primary tabular-nums">{countdownSeconds}</div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Secs</div>
                </div>
              </div>}

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
                {(() => {
                  const isFree = !(event.is_paid && event.ticket_price > 0);
                  return (
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {isFree ? "Entry" : "Ticket"}
                          </p>
                          {isFree ? (
                            <p className="mt-0.5 text-2xl font-black leading-tight text-foreground">
                              Free <span className="text-sm font-semibold text-muted-foreground">· RSVP required</span>
                            </p>
                          ) : (
                            <p className="mt-0.5 text-2xl font-black leading-tight text-foreground">
                              KSh {Number(event.ticket_price).toLocaleString()}
                              <span className="ml-1 text-xs font-semibold text-muted-foreground">/ ticket</span>
                            </p>
                          )}
                          {event.capacity && (
                            <p className="mt-1 text-[11px] text-muted-foreground">Capacity: {event.capacity}</p>
                          )}
                        </div>
                        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${isFree ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                          <Ticket className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-border pt-4">
                {(() => {
                  const linkOk = !!eventLink;
                  const handleClick = (e: React.MouseEvent) => {
                    if (!linkOk) {
                      e.preventDefault();
                      window.location.reload();
                    }
                  };
                  return (
                    <a
                      href={linkOk ? eventLink : "#"}
                      onClick={handleClick}
                      target={linkOk ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      aria-disabled={!linkOk}
                      className={`mb-2 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition ${
                        linkOk
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : "cursor-not-allowed bg-muted text-muted-foreground/60 opacity-70"
                      }`}
                      title={linkOk ? "Open event link" : "Link not available yet — reveal after RSVP"}
                    >
                      {linkOk ? (isFormLink ? "Fill this form" : "Open event link") : "Link not available"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  );
                })()}
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
                <button onClick={() => setReportOpen(true)} className="mt-3 inline-flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Flag className="h-3.5 w-3.5" /> Report this event
                </button>
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
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={openEditDialog}>
                  <Pencil className="mr-2 h-4 w-4" />Edit event
                </Button>
                {notifPerm !== "granted" ? (
                  <Button size="sm" variant="outline" onClick={enableNotifications}>
                    <Bell className="mr-2 h-4 w-4" />Notifications
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <BellOff className="h-3 w-3" />Notifications on
                  </span>
                )}
              </div>
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

        {/* Host edit dialog */}
        {isHost && (
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="relative block aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-muted">
                  {editCoverPreviews[0] ? (
                    <img src={editCoverPreviews[0]} alt="Event cover preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><ImagePlus className="h-8 w-8" /><span className="text-xs">Add up to 3 images</span></div>
                  )}
                  <input type="file" accept="image/*" multiple className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setEditCoverFiles(files);
                    setEditCoverPreviews(files.map((file) => URL.createObjectURL(file)));
                  }} />
                </label>
                {editCoverPreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {editCoverPreviews.map((src, index) => (
                      <div key={`${src}-${index}`} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        <img src={src} alt={`Event image ${index + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => { setEditCoverPreviews((prev) => prev.filter((_, i) => i !== index)); setEditCoverFiles((prev) => prev.filter((_, i) => i !== index)); }} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <Label>Title</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <RichDescriptionEditor value={editForm.description} onChange={(description) => setEditForm({ ...editForm, description })} placeholder="Tell people about this event. Add paragraphs, schedule, speakers, bullets and contact details." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start date & time</Label>
                    <Input type="datetime-local" value={editForm.start_at} onChange={(e) => setEditForm({ ...editForm, start_at: e.target.value })} />
                  </div>
                  <div>
                    <Label>End date & time (optional)</Label>
                    <Input type="datetime-local" value={editForm.end_at} onChange={(e) => setEditForm({ ...editForm, end_at: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input id="ev-virtual" type="checkbox" checked={editForm.is_virtual} onChange={(e) => setEditForm({ ...editForm, is_virtual: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="ev-virtual" className="cursor-pointer">Virtual event</Label>
                </div>
                {editForm.is_virtual ? (
                  <div>
                    <Label>Join link</Label>
                    <Input value={editForm.virtual_link} onChange={(e) => setEditForm({ ...editForm, virtual_link: e.target.value })} placeholder="https://meet... or form link" />
                  </div>
                ) : (
                  <div>
                    <Label>Location</Label>
                    <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Host name</Label>
                    <Input value={editForm.host_name} onChange={(e) => setEditForm({ ...editForm, host_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Capacity (optional)</Label>
                    <Input type="number" min={0} value={editForm.capacity as any} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input id="ev-paid" type="checkbox" checked={editForm.is_paid} onChange={(e) => setEditForm({ ...editForm, is_paid: e.target.checked })} className="h-4 w-4" />
                  <Label htmlFor="ev-paid" className="cursor-pointer">Paid event (M-Pesa tickets)</Label>
                </div>
                {editForm.is_paid && (
                  <div>
                    <Label>Ticket price (KSh)</Label>
                    <Input type="number" min={0} value={editForm.ticket_price} onChange={(e) => setEditForm({ ...editForm, ticket_price: Number(e.target.value) || 0 })} />
                  </div>
                )}
                <Button onClick={saveEdit} disabled={savingEdit} className="w-full">
                  {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {moreEvents.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">More events you may like</h2>
            <Link to="/events" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {moreEvents.map((e) => {
                const isPast = new Date(e.start_at).getTime() < Date.now();
                return (
                <Link
                  key={e.slug}
                  to={`/events/${e.slug}`}
                  aria-disabled={isPast}
                  className={`group flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-2 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:flex-col sm:p-0 ${isPast ? "opacity-50 grayscale pointer-events-none" : ""}`}
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 sm:aspect-[4/3] sm:w-full sm:rounded-none">
                    {e.cover_image ? (
                      <img src={e.cover_image} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center text-primary/40">
                        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8"><path stroke="currentColor" strokeWidth="2" d="M3 8h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
                      </div>
                    )}
                    {isPast && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Past</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:p-3">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">{e.title}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(e.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {e.is_virtual ? " · Virtual" : e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                </Link>
              );})}
            </div>
          </section>
        )}
      </main>
      {event && <ReportDialog open={reportOpen} onOpenChange={setReportOpen} kind="event" targetId={event.id} targetName={event.title} />}
      <BoostEventDialog open={boostOpen} onOpenChange={setBoostOpen} event={event ? { id: event.id, title: event.title } : null} />
      <Footer />
    </div>
  );
};

export default EventDetailsPage;
