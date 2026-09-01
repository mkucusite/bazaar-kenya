/**
 * Search-facing metadata helpers.
 *
 * Every directory hub (doctors, jobs, hotels, salons…), every profile page and
 * every classified ad gets a unique, keyword-rich title + description here so
 * facet URLs (?county=, ?tag=) never share metadata with their parent hub.
 */
import { DIRECTORY_KINDS, type DirectoryKind, type DirectoryProfile } from "@/lib/directory";

export const SITE_URL = "https://www.kenyaadverts.com";

const TOP_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Nyeri", "Kiambu"];

const clean = (v: string, max: number) => {
  const s = (v || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[\s,.;:\-—|]+$/, "")}…`;
};

const dedupe = (list: (string | null | undefined)[], limit = 28) =>
  Array.from(new Set(list.filter(Boolean).map((k) => String(k).trim().toLowerCase()))).slice(0, limit).join(", ");

/** Natural-language noun for a vertical, e.g. "doctors", "jobs", "hotels". */
export const kindNoun = (kind: DirectoryKind) => {
  const map: Record<DirectoryKind, string> = {
    doctor: "doctors",
    developer: "web developers",
    wellness: "spas & massage therapists",
    job: "jobs",
    hotel: "hotels",
    vehicle: "cars for sale",
    tour: "tours & safaris",
    restaurant: "restaurants",
    salon: "salons & barbers",
    school: "schools",
    fitness: "gyms & trainers",
    artisan: "artisans & handymen",
    "event-service": "event services",
  };
  return map[kind] || DIRECTORY_KINDS[kind]?.label || "listings";
};

/** Verb visitors search with, e.g. "Find doctors", "Book a hotel". */
const kindVerb = (kind: DirectoryKind) => {
  const map: Partial<Record<DirectoryKind, string>> = {
    doctor: "Find",
    developer: "Hire",
    wellness: "Book",
    job: "Apply for",
    hotel: "Book",
    vehicle: "Buy",
    tour: "Book",
    restaurant: "Discover",
    salon: "Book",
    school: "Compare",
    fitness: "Join",
    artisan: "Hire",
    "event-service": "Book",
  };
  return map[kind] || "Find";
};

export interface HubSeoInput {
  kind: DirectoryKind;
  county?: string;
  tag?: string;
  q?: string;
  total?: number;
}

export interface HubSeo {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  h1Suffix: string;
}

/**
 * Unique metadata per hub state. County and tag facets are indexable with their
 * own title/description; free-text searches stay out of the index.
 */
export const directoryHubSeo = ({ kind, county, tag, q, total }: HubSeoInput): HubSeo => {
  const config = DIRECTORY_KINDS[kind];
  const noun = kindNoun(kind);
  const verb = kindVerb(kind);
  const place = county ? `${county} County` : "Kenya";
  // Only the unfiltered hub knows an accurate figure; facet views omit counts.
  const count = !county && !tag && total && total > 0 ? total.toLocaleString() : "";

  const parts: string[] = [];
  if (tag) parts.push(tag);
  parts.push(noun);
  const subject = parts.join(" ");

  let title = config.seoTitle;
  let description = config.seoDescription;
  const h1Suffix = [tag, county].filter(Boolean).join(" · ");

  if (tag || county) {
    title = clean(
      `${tag ? `${tag} ` : ""}${noun.replace(/\b\w/, (c) => c.toUpperCase())} in ${county || "Kenya"} | KenyaAdvert`,
      60,
    );
    description = clean(
      `${verb} ${subject} in ${place}. Compare profiles, prices and reviews, then call or WhatsApp directly — no agents, no booking fees, verified listings on KenyaAdvert.`,
      158,
    );
  } else if (count) {
    description = clean(`${config.seoDescription} ${count} live listings updated daily across all 47 counties.`, 158);
  }

  const canonicalParams: string[] = [];
  if (county) canonicalParams.push(`county=${encodeURIComponent(county)}`);
  if (tag) canonicalParams.push(`tag=${encodeURIComponent(tag)}`);
  const canonical = `${SITE_URL}${config.path}${canonicalParams.length ? `?${canonicalParams.join("&")}` : ""}`;

  const longTail = [
    `${subject} in ${county || "Kenya"}`,
    `best ${subject} ${county || "Kenya"}`,
    `${subject} near me`,
    `${noun} near me ${county || "Kenya"}`,
    `affordable ${subject} ${county || "Kenya"}`,
    `top rated ${noun} ${county || "Kenya"}`,
    `${noun} prices in Kenya`,
    `${noun} contacts ${county || "Kenya"}`,
    `verified ${noun} Kenya`,
    tag ? `${tag} Kenya` : "",
    tag && county ? `${tag} ${county}` : "",
    ...(county ? [] : TOP_COUNTIES.map((c) => `${noun} in ${c}`)),
  ];

  return {
    title,
    description,
    keywords: dedupe([...longTail, config.keywords]),
    canonical,
    robots: q ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1",
    h1Suffix,
  };
};

/** Long-tail keywords for a single directory profile. */
export const directoryProfileKeywords = (profile: DirectoryProfile) => {
  const config = DIRECTORY_KINDS[profile.kind];
  const noun = kindNoun(profile.kind);
  const county = profile.county || "Kenya";
  const tags = profile.tags || [];
  return dedupe(
    [
      profile.name,
      profile.organisation,
      `${profile.name} ${county}`,
      `${profile.name} contacts`,
      `${noun} in ${county}`,
      `${noun} near me ${county}`,
      ...tags.map((t) => `${t} ${county}`),
      ...tags.map((t) => `${t} in Kenya`),
      profile.town ? `${noun} in ${profile.town}` : "",
      config.keywords,
    ],
    30,
  );
};

/** Unique, descriptive title for a directory profile. */
export const directoryProfileTitle = (profile: DirectoryProfile) => {
  const config = DIRECTORY_KINDS[profile.kind];
  if (profile.seo_title) return clean(profile.seo_title, 60);
  const context = profile.headline || profile.organisation || config.singular;
  const place = profile.town || profile.county;
  return clean(`${profile.name} — ${context}${place ? ` in ${place}` : " in Kenya"}`, 60);
};

/** Long-tail keywords for a classified ad so listings surface on specific queries. */
export const adKeywords = (ad: {
  title?: string | null;
  category?: string | null;
  county?: string | null;
  town?: string | null;
  condition?: string | null;
  price?: number | null;
}) => {
  const title = (ad.title || "").trim();
  const head = title.split(/\s+/).slice(0, 4).join(" ");
  const cat = ad.category || "classifieds";
  const county = ad.county || "Kenya";
  return dedupe(
    [
      title,
      `${title} price in Kenya`,
      `${head} for sale ${county}`,
      `buy ${head} in ${county}`,
      `${head} price ${county}`,
      `cheap ${head} Kenya`,
      ad.condition ? `${ad.condition} ${head} Kenya` : "",
      `${cat} in ${county}`,
      `${cat} for sale Kenya`,
      `${cat} near me ${county}`,
      ad.town ? `${head} ${ad.town}` : "",
      `second hand ${cat} Kenya`,
      `${county} marketplace`,
      "classified ads Kenya",
      "buy and sell Kenya",
      "KenyaAdvert listing",
    ],
    30,
  );
};
