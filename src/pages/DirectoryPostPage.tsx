import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Plus, Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { uploadFile } from "@/services/uploadService";
import {
  DIRECTORY_KINDS, EDUCATION_LEVELS, EXPERIENCE_LEVELS, JOB_TYPES, KENYA_COUNTIES,
  autoMetaDescription, normaliseUrl, slugifyDirectory, stripHtml, type DirectoryKind,
} from "@/lib/directory";

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary";
const labelClass = "block text-sm font-medium text-foreground";

interface PortfolioDraft {
  url: string;
  title: string;
  description: string;
}

const DirectoryPostPage = ({ kind }: { kind: DirectoryKind }) => {
  const config = DIRECTORY_KINDS[kind];
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [website, setWebsite] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioDraft[]>([{ url: "", title: "", description: "" }]);
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [education, setEducation] = useState(EDUCATION_LEVELS[3]);
  const [experience, setExperience] = useState(EXPERIENCE_LEVELS[1]);
  const [deadline, setDeadline] = useState("");
  const [applyLink, setApplyLink] = useState("");

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        urls.push(await uploadFile(file, "ad-images"));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e: any) {
      toast.error(e?.message || "Upload failed, try a smaller photo");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error(`${config.nameLabel} is required`);
    if (!phone.trim() && !whatsapp.trim() && !email.trim() && !applyLink.trim()) {
      return toast.error("Add at least one way for people to reach you");
    }
    setSaving(true);
    try {
      const html = description
        .split(/\n{2,}/)
        .map((block) => `<p>${block.replace(/\n/g, "<br />").trim()}</p>`)
        .filter((b) => b !== "<p></p>")
        .join("");

      const cleanPortfolio = portfolio
        .filter((p) => p.url.trim())
        .map((p) => ({ url: normaliseUrl(p.url), title: p.title.trim() || undefined, description: p.description.trim() || undefined }));

      const baseSlug = slugifyDirectory(
        kind === "job" ? `${name} ${organisation || county}` : `${name} ${headline || county}`,
      );
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

      const payload: Record<string, any> = {
        kind,
        slug,
        user_id: user?.id || null,
        name: name.trim(),
        headline: headline.trim() || null,
        organisation: organisation.trim() || null,
        county: county || null,
        town: town.trim() || null,
        location_name: locationName.trim() || null,
        description: html || null,
        meta_description: autoMetaDescription(html, `${name} — ${headline || config.label} in ${county || "Kenya"}.`),
        seo_title: kind === "job" ? `${name}${organisation ? ` at ${organisation}` : ""}` : `${name}${headline ? ` — ${headline}` : ""}`,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        website: website.trim() ? normaliseUrl(website) : null,
        price: price ? Number(price) : null,
        images,
        avatar_url: images[0] || null,
        tags,
        details:
          kind === "job"
            ? { job_type: jobType, education, experience, deadline: deadline || null, apply_link: applyLink ? normaliseUrl(applyLink) : null }
            : kind === "developer"
              ? { portfolio: cleanPortfolio }
              : {},
        is_published: true,
        is_manual: true,
      };

      const { error } = await (supabase.from("directory_profiles" as any) as any).insert(payload);
      if (error) throw error;

      toast.success("Published! Google will pick it up shortly.");
      navigate(`${config.path}/${slug}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not publish, please try again");
    } finally {
      setSaving(false);
    }
  };

  const wordCount = stripHtml(description) ? stripHtml(description).split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${config.ctaPost} — free on KenyaAdvert`}
        description={`${config.ctaPost} on KenyaAdvert for free. ${config.seoDescription}`}
        keywords={config.keywords}
        robots="noindex, follow"
      />
      <Navbar />
      <main className="container-app max-w-3xl py-8 pb-24">
        <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">{config.ctaPost}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free, instant and open to everyone — no account needed. Sign in only if you want to edit it later.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label className={labelClass}>{config.nameLabel} *</label>
            <input className={`${inputClass} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} placeholder={config.namePlaceholder} />
          </div>

          <div>
            <label className={labelClass}>{config.headlineLabel}</label>
            <input className={`${inputClass} mt-1.5`} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={config.headlinePlaceholder} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{config.orgLabel}</label>
              <input className={`${inputClass} mt-1.5`} value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder={config.orgPlaceholder} />
            </div>
            <div>
              <label className={labelClass}>County</label>
              <select className={`${inputClass} mt-1.5`} value={county} onChange={(e) => setCounty(e.target.value)}>
                <option value="">Select county</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Town / area</label>
              <input className={`${inputClass} mt-1.5`} value={town} onChange={(e) => setTown(e.target.value)} placeholder="Westlands" />
            </div>
            <div>
              <label className={labelClass}>{kind === "doctor" ? "Ward / building / floor" : "Exact location (optional)"}</label>
              <input className={`${inputClass} mt-1.5`} value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="ABC Place, 3rd floor" />
            </div>
          </div>

          {kind === "job" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Job type</label>
                <select className={`${inputClass} mt-1.5`} value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  {JOB_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Minimum qualification</label>
                <select className={`${inputClass} mt-1.5`} value={education} onChange={(e) => setEducation(e.target.value)}>
                  {EDUCATION_LEVELS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Experience</label>
                <select className={`${inputClass} mt-1.5`} value={experience} onChange={(e) => setExperience(e.target.value)}>
                  {EXPERIENCE_LEVELS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Application deadline</label>
                <input type="date" className={`${inputClass} mt-1.5`} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Application link or email portal (optional)</label>
                <input className={`${inputClass} mt-1.5`} value={applyLink} onChange={(e) => setApplyLink(e.target.value)} placeholder="https://company.co.ke/careers/apply" />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{config.tagsLabel}</label>
            <p className="mt-0.5 text-xs text-muted-foreground">{config.tagsHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.tagOptions.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    tags.includes(t) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{config.descriptionLabel}</label>
            <textarea
              className="mt-1.5 min-h-[220px] w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write as much detail as you like — there is no limit."
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {wordCount} words · no limit. We generate the Google meta description for you automatically.
            </p>
          </div>

          {kind === "developer" && (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-heading text-sm font-semibold text-foreground">Your portfolio links</p>
                <p className="text-xs text-muted-foreground">
                  Paste the website URLs you built. We pull a live preview image automatically — exactly like the card you see when sharing a link on WhatsApp.
                </p>
              </div>
              {portfolio.map((item, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-border/70 p-3">
                  <div className="flex gap-2">
                    <input
                      className={inputClass}
                      value={item.url}
                      onChange={(e) =>
                        setPortfolio((prev) => prev.map((p, idx) => (idx === i ? { ...p, url: e.target.value } : p)))
                      }
                      placeholder="https://client-site.co.ke"
                    />
                    {portfolio.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPortfolio((prev) => prev.filter((_, idx) => idx !== i))}
                        className="rounded-xl border border-border px-3 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(e) => setPortfolio((prev) => prev.map((p, idx) => (idx === i ? { ...p, title: e.target.value } : p)))}
                    placeholder="Project name (e.g. Nyota Sacco website)"
                  />
                  <input
                    className={inputClass}
                    value={item.description}
                    onChange={(e) => setPortfolio((prev) => prev.map((p, idx) => (idx === i ? { ...p, description: e.target.value } : p)))}
                    placeholder="One line about what you built"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPortfolio((prev) => [...prev, { url: "", title: "", description: "" }])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
              >
                <Plus className="h-4 w-4" /> Add another project
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Phone</label>
              <input className={`${inputClass} mt-1.5`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input className={`${inputClass} mt-1.5`} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0712 345 678" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={`${inputClass} mt-1.5`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className={labelClass}>{kind === "developer" ? "Main website / portfolio" : "Website (optional)"}</label>
              <input className={`${inputClass} mt-1.5`} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbrand.co.ke" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{config.priceLabel}</label>
              <input type="number" min="0" className={`${inputClass} mt-1.5`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Photos {kind === "job" ? "/ company logo" : ""}</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Tap to add photos (up to 8)"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </label>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={img} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish now — free
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default DirectoryPostPage;
