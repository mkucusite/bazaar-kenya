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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, ImagePlus, Loader2, MapPin, Ticket, X } from "lucide-react";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";
import { uploadFile } from "@/services/uploadService";

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]);

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
    is_listed: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to create an event");
      navigate("/login?redirect=/events/new");
    }
  }, [user, authLoading, navigate]);

  const handleCovers = (files: FileList | null) => {
    const selected = Array.from(files || []).slice(0, 3);
    setCoverFiles(selected);
    setCoverPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const removeCover = (index: number) => {
    setCoverFiles((prev) => prev.filter((_, i) => i !== index));
    setCoverPreviews((prev) => prev.filter((_, i) => i !== index));
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
      const uploadedImages: string[] = [];
      for (const file of coverFiles) {
        uploadedImages.push(await uploadFile(file, "events"));
      }
      const coverUrl: string | null = uploadedImages[0] || null;

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
          gallery_images: uploadedImages,
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
          is_listed: form.is_listed,
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
        canonical="https://www.kenyaadverts.com/events/new"
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
              {coverPreviews[0] ? (
                <img src={coverPreviews[0]} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/60">
                  <ImagePlus className="h-12 w-12" />
                  <span className="text-sm font-medium">Add up to 3 event images</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleCovers(e.target.files)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            {coverPreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-card p-3">
                {coverPreviews.map((src, index) => (
                  <div key={src} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <img src={src} alt={`Event image ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeCover(index)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              <RichDescriptionEditor value={form.description} onChange={(description) => setForm({ ...form, description })} placeholder="What's the event about? Add paragraphs, bullets, schedules, speakers and contact details." />
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
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">List on the public Events page</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">If off, your event still works via direct link & SEO, but won't appear in the public events grid.</p>
              </div>
              <Switch checked={form.is_listed} onCheckedChange={(v) => setForm({ ...form, is_listed: v })} />
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
