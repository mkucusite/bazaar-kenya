import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MessageCircle, Ticket, Briefcase, CalendarDays, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { initiatePayment, verifyPayment } from "@/lib/payments";

export type CategoryKind = "events" | "jobs" | "property" | "services" | "default";

export const detectCategoryKind = (categoryName?: string | null, subcategoryName?: string | null): CategoryKind => {
  const c = (categoryName || "").toLowerCase();
  const s = (subcategoryName || "").toLowerCase();
  if (s.includes("event") || c.includes("event")) return "events";
  if (c === "jobs" || c.includes("job")) return "jobs";
  if (c.includes("property") || c.includes("real estate") || c.includes("rent")) return "property";
  if (c === "services" || c.includes("service")) return "services";
  return "default";
};

interface CategoryActionsProps {
  kind: CategoryKind;
  ad: {
    id: string;
    title: string;
    price: number;
    phone: string;
    whatsapp: string;
    user_id?: string;
  };
  onCall: () => void;
  onWhatsApp: () => void;
}

const CategoryActions = ({ kind, ad, onCall, onWhatsApp }: CategoryActionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Shared form state
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  // ----- DEFAULT (Call / WhatsApp / Chat) -----
  if (kind === "default") return null;

  const reset = () => {
    setName(""); setContactPhone(""); setEmail(""); setMessage(""); setDate(""); setQuantity(1);
    setShowForm(false); setDone(false);
  };

  const sendInquiryMessage = async (body: string) => {
    if (!ad.user_id) {
      // Fallback: WhatsApp the seller
      const raw = ad.whatsapp.replace(/[^0-9]/g, "");
      const waPhone = raw.startsWith("0") ? "254" + raw.slice(1) : raw.startsWith("254") ? raw : "254" + raw;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(body)}`);
      return true;
    }

    if (!user) {
      // Guest → open WhatsApp
      const raw = ad.whatsapp.replace(/[^0-9]/g, "");
      const waPhone = raw.startsWith("0") ? "254" + raw.slice(1) : raw.startsWith("254") ? raw : "254" + raw;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(body)}`);
      return true;
    }

    // Logged-in: create/find conversation and send opening message
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("ad_id", ad.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    let convoId: string | null = existing?.id || null;
    if (!convoId) {
      const { data: convo, error } = await supabase
        .from("conversations")
        .insert({ ad_id: ad.id, buyer_id: user.id, seller_id: ad.user_id })
        .select("id")
        .single();
      if (error || !convo) {
        toast({ title: "Could not contact seller", description: error?.message, variant: "destructive" });
        return false;
      }
      convoId = convo.id;
    }

    await supabase.from("messages").insert({ conversation_id: convoId, sender_id: user.id, content: body });
    return true;
  };

  // ----- EVENTS -----
  const handleEventSubmit = async () => {
    if (!name.trim() || !contactPhone.trim()) {
      toast({ title: "Please enter your name and phone", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const isPaid = ad.price > 0;
    if (isPaid) {
      // M-Pesa payment for ticket
      try {
        const totalAmount = ad.price * Math.max(1, quantity);
        const result = await initiatePayment({
          phone: contactPhone,
          amount: totalAmount,
          package_type: "event_ticket",
          ad_id: ad.id,
          user_id: user?.id,
        });
        toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to pay for your ticket(s)" });

        // Poll for completion
        const interval = setInterval(async () => {
          try {
            const status = await verifyPayment(result.transaction_id);
            if (status.status === "completed") {
              clearInterval(interval);
              // Notify the seller via message
              await sendInquiryMessage(
                `🎫 New ticket purchase for "${ad.title}"\nName: ${name}\nPhone: ${contactPhone}\nQuantity: ${quantity}\nAmount paid: KSh ${totalAmount.toLocaleString()}`,
              );
              setDone(true);
              setSubmitting(false);
              toast({ title: "Payment successful! Your ticket is confirmed." });
            } else if (status.status === "failed") {
              clearInterval(interval);
              setSubmitting(false);
              toast({ title: "Payment failed", description: "Please try again", variant: "destructive" });
            }
          } catch { /* keep polling */ }
        }, 3000);
        setTimeout(() => { clearInterval(interval); setSubmitting(false); }, 120000);
      } catch (err: any) {
        setSubmitting(false);
        toast({ title: "Payment error", description: err?.message || "Could not start payment", variant: "destructive" });
      }
    } else {
      // Free RSVP
      const ok = await sendInquiryMessage(
        `🙋 RSVP for "${ad.title}"\nName: ${name}\nPhone: ${contactPhone}${email ? `\nEmail: ${email}` : ""}\nGuests: ${quantity}`,
      );
      setSubmitting(false);
      if (ok) {
        setDone(true);
        toast({ title: "You're attending! The organizer has been notified." });
      }
    }
  };

  // ----- JOBS -----
  const handleApply = async () => {
    if (!name.trim() || !contactPhone.trim()) {
      toast({ title: "Please enter your name and phone", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await sendInquiryMessage(
      `💼 Job Application for "${ad.title}"\nName: ${name}\nPhone: ${contactPhone}${email ? `\nEmail: ${email}` : ""}\n\n${message || "I would like to apply for this position."}`,
    );
    setSubmitting(false);
    if (ok) { setDone(true); toast({ title: "Application sent!" }); }
  };

  // ----- PROPERTY -----
  const handleBookViewing = async () => {
    if (!name.trim() || !contactPhone.trim() || !date) {
      toast({ title: "Please fill in your name, phone and preferred date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await sendInquiryMessage(
      `🏠 Viewing Request for "${ad.title}"\nName: ${name}\nPhone: ${contactPhone}\nPreferred date: ${date}${message ? `\nNote: ${message}` : ""}`,
    );
    setSubmitting(false);
    if (ok) { setDone(true); toast({ title: "Viewing requested! Owner will confirm." }); }
  };

  // ----- SERVICES -----
  const handleQuote = async () => {
    if (!name.trim() || !contactPhone.trim() || !message.trim()) {
      toast({ title: "Please fill in your details and what you need", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const ok = await sendInquiryMessage(
      `📋 Quote Request for "${ad.title}"\nName: ${name}\nPhone: ${contactPhone}${email ? `\nEmail: ${email}` : ""}\n\nNeeds: ${message}`,
    );
    setSubmitting(false);
    if (ok) { setDone(true); toast({ title: "Quote request sent!" }); }
  };

  // ----- RENDER -----
  const ctaConfig = {
    events: {
      icon: Ticket,
      label: ad.price > 0 ? `Buy Ticket — KSh ${ad.price.toLocaleString()}` : "I'm Attending (Free)",
      submitLabel: ad.price > 0 ? "Pay with M-Pesa" : "Confirm RSVP",
      successLabel: ad.price > 0 ? "Ticket confirmed!" : "You're going!",
      onSubmit: handleEventSubmit,
    },
    jobs: {
      icon: Briefcase,
      label: "Apply Now",
      submitLabel: "Send Application",
      successLabel: "Application sent!",
      onSubmit: handleApply,
    },
    property: {
      icon: CalendarDays,
      label: "Book Viewing",
      submitLabel: "Request Viewing",
      successLabel: "Viewing requested!",
      onSubmit: handleBookViewing,
    },
    services: {
      icon: FileText,
      label: "Request Quote",
      submitLabel: "Send Request",
      successLabel: "Request sent!",
      onSubmit: handleQuote,
    },
  }[kind];

  const Icon = ctaConfig.icon;

  if (done) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" /> {ctaConfig.successLabel}
        </div>
        <Button onClick={reset} variant="outline" className="w-full h-10">Submit another</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!showForm && (
        <>
          <Button onClick={() => setShowForm(true)} className="w-full justify-center gap-2 h-11 text-base font-semibold">
            <Icon className="w-5 h-5" /> {ctaConfig.label}
          </Button>
          <Button onClick={onCall} variant="outline" className="w-full justify-center gap-2 h-10">
            <Phone className="w-4 h-4" /> Call Seller
          </Button>
          <Button onClick={onWhatsApp} className="w-full justify-center gap-2 h-10 bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </Button>
        </>
      )}

      {showForm && (
        <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" /> {ctaConfig.label}
          </h4>

          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 h-10" />
          </div>
          <div>
            <Label className="text-xs">Phone (M-Pesa) *</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" className="mt-1 h-10" />
          </div>

          {(kind === "jobs" || kind === "services" || kind === "events") && (
            <div>
              <Label className="text-xs">Email (optional)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-1 h-10" />
            </div>
          )}

          {kind === "events" && (
            <div>
              <Label className="text-xs">{ad.price > 0 ? "Number of Tickets" : "Number of Guests"}</Label>
              <Input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="mt-1 h-10" />
              {ad.price > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Total: <span className="font-semibold text-foreground">KSh {(ad.price * quantity).toLocaleString()}</span>
                </p>
              )}
            </div>
          )}

          {kind === "property" && (
            <div>
              <Label className="text-xs">Preferred Viewing Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-10" />
            </div>
          )}

          {(kind === "jobs" || kind === "services" || kind === "property") && (
            <div>
              <Label className="text-xs">{kind === "services" ? "What do you need? *" : "Message"}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  kind === "jobs" ? "Brief intro, experience, why you're a fit"
                    : kind === "services" ? "Describe the work you need done"
                    : "Anything the owner should know"
                }
                className="mt-1 min-h-[80px]"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={reset} className="flex-1 h-10">Cancel</Button>
            <Button onClick={ctaConfig.onSubmit} disabled={submitting} className="flex-1 h-10">
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {ctaConfig.submitLabel}
            </Button>
          </div>

          {!user && (
            <p className="text-[11px] text-muted-foreground text-center">
              <button onClick={() => navigate("/login")} className="underline">Sign in</button> to track your requests in your dashboard.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryActions;
