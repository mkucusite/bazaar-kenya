import { Link } from "react-router-dom";
import { BadgeCheck, Briefcase, Clock, MapPin, Stethoscope, ExternalLink, Sparkles, Star } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import {
  DIRECTORY_KINDS,
  directoryPath,
  linkThumbnail,
  prettyHost,
  stripHtml,
  type DirectoryProfile,
} from "@/lib/directory";

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

const initials = (name: string) =>
  name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const Avatar = ({ profile, className = "" }: { profile: DirectoryProfile; className?: string }) => {
  const src = profile.avatar_url || profile.images?.[0];
  if (src) {
    return (
      <OptimizedImage
        src={src}
        alt={profile.name}
        className={`h-full w-full object-cover ${className}`}
        width={320}
        height={320}
      />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-primary/10 font-heading text-lg font-bold text-primary ${className}`}>
      {initials(profile.name)}
    </div>
  );
};

const Location = ({ profile }: { profile: DirectoryProfile }) => {
  const parts = [profile.location_name || profile.organisation, profile.town, profile.county].filter(Boolean);
  if (!parts.length) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{parts.join(" · ")}</span>
    </p>
  );
};

const Tags = ({ tags, max = 3 }: { tags?: string[] | null; max?: number }) => {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, max).map((t) => (
        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t}
        </span>
      ))}
      {tags.length > max && <span className="text-[11px] text-muted-foreground">+{tags.length - max}</span>}
    </div>
  );
};

/* ---------------- Doctors: profile cards ---------------- */
const DoctorCard = ({ profile }: { profile: DirectoryProfile }) => (
  <Link
    to={directoryPath("doctor", profile.slug)}
    className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
  >
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60">
      <Avatar profile={profile} />
    </div>
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex items-start gap-1.5">
        <h3 className="font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary line-clamp-2">
          {profile.name}
        </h3>
        {profile.is_verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
      </div>
      {profile.headline && (
        <p className="flex items-start gap-1 text-xs font-medium text-primary">
          <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{profile.headline}</span>
        </p>
      )}
      <Location profile={profile} />
      <Tags tags={profile.tags} />
      {profile.price ? (
        <p className="text-xs font-semibold text-foreground">Consultation from KSh {Number(profile.price).toLocaleString()}</p>
      ) : null}
    </div>
  </Link>
);

/* ---------------- Developers: portfolio cards with link previews ---------------- */
const DeveloperCard = ({ profile }: { profile: DirectoryProfile }) => {
  const links: any[] = Array.isArray(profile.details?.portfolio) ? profile.details!.portfolio : [];
  const hero = links[0]?.image || links[0]?.url ? links[0].image || linkThumbnail(links[0].url, 800) : profile.images?.[0];
  return (
    <Link
      to={directoryPath("developer", profile.slug)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {hero ? (
          <OptimizedImage src={hero} alt={profile.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" width={800} height={500} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 font-heading text-2xl font-bold text-primary">
            {initials(profile.name)}
          </div>
        )}
        {links.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur">
            {links.length} projects
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start gap-1.5">
          <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary line-clamp-1">{profile.name}</h3>
          {profile.is_verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
        </div>
        {profile.headline && <p className="line-clamp-2 text-xs text-muted-foreground">{profile.headline}</p>}
        <Tags tags={profile.tags} max={4} />
        <div className="flex items-center justify-between pt-1">
          {profile.website ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
              <ExternalLink className="h-3 w-3" /> {prettyHost(profile.website)}
            </span>
          ) : (
            <span />
          )}
          {profile.price ? (
            <span className="text-xs font-bold text-foreground">from KSh {Number(profile.price).toLocaleString()}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

/* ---------------- Wellness: image-forward gallery cards ---------------- */
const WellnessCard = ({ profile }: { profile: DirectoryProfile }) => (
  <Link
    to={directoryPath("wellness", profile.slug)}
    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
      {profile.images?.[0] ? (
        <OptimizedImage src={profile.images[0]} alt={profile.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" width={700} height={525} />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Sparkles className="h-8 w-8 text-primary/60" />
        </div>
      )}
      {profile.is_manual && (
        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          Verified listing
        </span>
      )}
      {profile.price ? (
        <span className="absolute bottom-2 left-2 rounded-lg bg-background/95 px-2 py-1 text-sm font-bold text-foreground backdrop-blur">
          KSh {Number(profile.price).toLocaleString()}
          <span className="text-[10px] font-medium text-muted-foreground"> {profile.price_label || "from"}</span>
        </span>
      ) : null}
    </div>
    <div className="space-y-1.5 p-3.5">
      <h3 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">{profile.name}</h3>
      {profile.headline && <p className="line-clamp-2 text-xs text-muted-foreground">{profile.headline}</p>}
      <Location profile={profile} />
      <Tags tags={profile.tags} />
    </div>
  </Link>
);

/* ---------------- Jobs: MyJobMag-style rows ---------------- */
const JobRow = ({ profile }: { profile: DirectoryProfile }) => {
  const d = profile.details || {};
  return (
    <Link
      to={directoryPath("job", profile.slug)}
      className="group flex gap-4 border-b border-border bg-card p-4 transition-colors last:border-0 hover:bg-muted/40"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background">
        <Avatar profile={profile} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary">
          {profile.name}
          {profile.organisation ? <span className="font-normal text-muted-foreground"> at {profile.organisation}</span> : null}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {profile.headline || stripHtml(profile.description).slice(0, 180)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {(profile.county || profile.town) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {[profile.town, profile.county].filter(Boolean).join(", ")}
            </span>
          )}
          {d.job_type && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {d.job_type}
            </span>
          )}
          {d.experience && <span>{d.experience}</span>}
          {profile.price ? <span className="font-semibold text-foreground">KSh {Number(profile.price).toLocaleString()}/mo</span> : null}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(profile.created_at)}
          </span>
          {profile.tags?.[0] && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">{profile.tags[0]}</span>}
        </div>
      </div>
      {profile.is_featured && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
    </Link>
  );
};

export const DirectoryCard = ({ profile }: { profile: DirectoryProfile }) => {
  switch (profile.kind) {
    case "doctor":
      return <DoctorCard profile={profile} />;
    case "developer":
      return <DeveloperCard profile={profile} />;
    case "wellness":
      return <WellnessCard profile={profile} />;
    case "job":
      return <JobRow profile={profile} />;
    default: {
      // Every other directory (hotels, vehicles, salons, tours, artisans…) renders
      // with the card style its config asks for.
      const layout = DIRECTORY_KINDS[profile.kind]?.layout || "cards";
      if (layout === "rows") return <JobRow profile={profile} />;
      if (layout === "portfolio") return <DeveloperCard profile={profile} />;
      if (layout === "gallery") return <WellnessCard profile={profile} />;
      return <DoctorCard profile={profile} />;
    }
  }
};

export const gridClassFor = (kind: DirectoryProfile["kind"]) => {
  const layout = DIRECTORY_KINDS[kind]?.layout || "cards";
  if (layout === "rows") return "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card";
  if (layout === "gallery") return "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4";
  if (layout === "portfolio") return "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";
  return "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3";
};

export default DirectoryCard;
