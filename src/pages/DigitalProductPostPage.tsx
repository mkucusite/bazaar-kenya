import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import AuthGate from "@/components/AuthGate";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/services/uploadService";

const CATEGORIES = ["Software", "Operating Systems", "E-books", "Courses", "Templates", "Music", "Other"];
const fieldClass = "mt-1.5 h-12 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 72);

const DigitalProductPostForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[2]);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [sellerName, setSellerName] = useState("");
  const [sellerContact, setSellerContact] = useState("");
  const [deliveryContent, setDeliveryContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).slice(0, 4).map((file) => uploadFile(file, "ad-images")));
      setImages((current) => [...current, ...uploaded].slice(0, 4));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !shortDescription.trim() || !description.trim()) return toast.error("Add a title and clear product descriptions");
    if (description.trim().split(/\s+/).length < 30) return toast.error("Please add at least 30 words so buyers understand what they receive");
    if (!sellerName.trim() || !sellerContact.trim() || !deliveryContent.trim()) return toast.error("Add your seller details and delivery link or instructions");
    if (images.length === 0) return toast.error("Add at least one relevant product image");
    setSaving(true);
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.from("digital_products").insert({
      title: title.trim(),
      slug,
      short_description: shortDescription.trim(),
      description: description.trim(),
      price: Math.max(0, Number(price) || 0),
      category,
      images,
      delivery_type: "link",
      delivery_content: deliveryContent.trim(),
      access_mode: "public",
      created_by: user?.id || null,
      seller_name: sellerName.trim(),
      seller_contact: sellerContact.trim(),
      approval_status: "pending",
      is_published: false,
      is_verified_seller: false,
      seo_title: title.trim(),
      seo_description: shortDescription.trim().slice(0, 155),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review. You will be notified after approval.");
    navigate("/digital-store");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Sell a Digital Product — KenyaAdvert" description="Publish an e-book, template, course, software download or other digital product for review." robots="noindex, follow" />
      <Navbar />
      <main className="container-app max-w-3xl py-8 pb-24">
        <div className="border-b border-border pb-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><FileUp className="h-5 w-5" /></span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground md:text-3xl">Sell a digital product</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add the real file details and a matching cover. New products are reviewed before appearing in the store.</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div><label className="text-sm font-medium">Product title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="Budget planner for Kenyan small businesses" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Category *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label className="text-sm font-medium">Price in KSh</label><input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={fieldClass} /></div>
          </div>
          <div><label className="text-sm font-medium">Short summary *</label><input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={180} className={fieldClass} placeholder="What the buyer receives, in one clear sentence" /></div>
          <div><label className="text-sm font-medium">Full description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${fieldClass} min-h-48 py-3`} placeholder="Explain the contents, format, audience, compatibility and how to use it. Minimum 30 words; no maximum." /><p className="mt-1 text-xs text-muted-foreground">{description.trim() ? description.trim().split(/\s+/).length : 0} words · minimum 30 · no maximum</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Seller or brand name *</label><input value={sellerName} onChange={(e) => setSellerName(e.target.value)} className={fieldClass} /></div>
            <div><label className="text-sm font-medium">Phone or email *</label><input value={sellerContact} onChange={(e) => setSellerContact(e.target.value)} className={fieldClass} /></div>
          </div>
          <div><label className="text-sm font-medium">Secure delivery link or instructions *</label><input value={deliveryContent} onChange={(e) => setDeliveryContent(e.target.value)} className={fieldClass} placeholder="Private file URL or delivery instructions" /></div>
          <div>
            <label className="text-sm font-medium">Matching cover images *</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? "Uploading…" : "Add up to 4 images"}<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(e.target.files)} /></label>
            {images.length > 0 && <div className="mt-3 grid grid-cols-4 gap-2">{images.map((image, index) => <div key={image} className="relative aspect-square overflow-hidden rounded-md border border-border"><img src={image} alt={`Product preview ${index + 1}`} className="h-full w-full object-cover" /><Button type="button" variant="secondary" size="icon" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 h-7 w-7"><X className="h-3 w-3" /></Button></div>)}</div>}
          </div>
          <Button type="submit" disabled={saving || uploading} className="h-12 w-full font-semibold">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Submit for review</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

const DigitalProductPostPage = () => <AuthGate title="Sign in to sell a digital product" message="Every product is tied to its seller account and reviewed before it appears in the store."><DigitalProductPostForm /></AuthGate>;

export default DigitalProductPostPage;