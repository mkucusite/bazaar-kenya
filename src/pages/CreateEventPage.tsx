import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, ImagePlus, Loader2, MapPin, Ticket } from "lucide-react";

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "11:00",
    end_time: "13:00",
    location: "",
    virtual_link: "",
    is_virtual: false,
    host_name: "",
    is_paid: false,
    ticket_price: "0",
    capacity: "",
    category: "general",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to create an event");
      navigate("/login?redirect=/events/new");
    }
  }, [user, authLoading, navigate]);

  const handleCover = (file: File | null) => {
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
    else setCoverPreview(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.start_date) {
      toast.error("Title and start date are required");
      return;
    }
    setSubmitting(true);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("events").upload(path, coverFile, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("events").getPublicUrl(path);
        coverUrl = pub.publicUrl;
      }

      const startISO = new Date(`${form.start_date}T${form.start_time || "11:00"}`).toISOString();
      const endISO = form.end_time
        ? new Date(`${form.start_date}T${form.end_time}`).toISOString()
        : null;

      const { data, error } = await supabase
        .from("events" as any)
        .insert({
          user_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          cover_image: coverUrl,
          start_at: startISO,
          end_at: endISO,
          location: form.is_virtual ? null : form.location.trim() || null,
          virtual_link: form.is_virtual ? form.virtual_link.trim() || null : null,
          is_virtual: form.is_virtual,
          host_name: form.host_name.trim() || null,
          is_paid: form.is_paid,
          ticket_price: form.is_paid ? Number(form.ticket_price) || 0 : 0,
          capacity: form.capacity ? Number(form.capacity) : null,
          category: form.category,
          is_published: true,
        } as any)
        .select("slug")
        .single();

      if (error) throw error;
      toast.success("Event created!");
      navigate(`/events/${(data as any).slug}`);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Failed to create event";
      toast.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Create an Event | KenyaAdvert"
        description="Host your event on KenyaAdvert. Free or paid tickets via M-Pesa, instant share page."
        canonical="https://www.kenyaadverts.co.ke/events/new"
      />
      <Navbar />
      <main className="container-app max-w-2xl py-6 md:py-10">
        <h1 className="mb-1 text-3xl font-bold">Create Event</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Beautifully simple event pages. Share, RSVP, and collect M-Pesa tickets.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <Card className="overflow-hidden p-0">
            <label className="relative block aspect-[16/9] w-full cursor-pointer overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/60">
                  <ImagePlus className="h-12 w-12" />
                  <span className="text-sm font-medium">Add cover image</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCover(e.target.files?.[0] || null)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </Card>

          <div>
            <Label htmlFor="title" className="sr-only">Event name</Label>
            <Input
              id="title"
              placeholder="Event Name"
              className="h-14 border-0 bg-transparent px-0 text-3xl font-bold shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <Card className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label className="flex items-center gap-1.5 text-xs"><Calendar className="h-3 w-3" />Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </div>
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs"><MapPin className="h-3 w-3" />Location</Label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={form.is_virtual} onCheckedChange={(v) => setForm({ ...form, is_virtual: v })} />
                  Virtual
                </label>
              </div>
              {form.is_virtual ? (
                <Input
                  placeholder="https://meet.google.com/..."
                  value={form.virtual_link}
                  onChange={(e) => setForm({ ...form, virtual_link: e.target.value })}
                />
              ) : (
                <Input
                  placeholder="e.g. KICC, Nairobi"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              )}
            </div>

            <div>
              <Label className="text-xs">Host name</Label>
              <Input placeholder="Your name or organization" value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} />
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={4} placeholder="What's the event about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5"><Ticket className="h-4 w-4" />Paid tickets</Label>
              <Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} />
            </div>
            {form.is_paid && (
              <div>
                <Label className="text-xs">Ticket price (KSh)</Label>
                <Input type="number" min="1" value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">Attendees pay via M-Pesa STK push.</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Capacity (optional)</Label>
              <Input type="number" min="1" placeholder="Unlimited" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Event"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEventPage;
