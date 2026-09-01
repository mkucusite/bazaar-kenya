export type DirectoryKind =
  | "doctor"
  | "developer"
  | "wellness"
  | "job"
  | "hotel"
  | "vehicle"
  | "tour"
  | "restaurant"
  | "salon"
  | "school"
  | "fitness"
  | "artisan"
  | "event-service";

export interface PortfolioLink {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface DirectoryProfile {
  id: string;
  kind: DirectoryKind;
  slug: string;
  user_id: string | null;
  name: string;
  headline: string | null;
  description: string | null;
  meta_description: string | null;
  seo_title: string | null;
  organisation: string | null;
  county: string | null;
  town: string | null;
  location_name: string | null;
  map_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  price: number | null;
  price_label: string | null;
  images: string[] | null;
  avatar_url: string | null;
  tags: string[] | null;
  details: Record<string, any> | null;
  is_published: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_manual: boolean;
  views_count: number;
  created_at: string;
  updated_at?: string;
}

interface KindConfig {
  kind: DirectoryKind;
  path: string;
  label: string;
  singular: string;
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  nameLabel: string;
  namePlaceholder: string;
  headlineLabel: string;
  headlinePlaceholder: string;
  orgLabel: string;
  orgPlaceholder: string;
  tagsLabel: string;
  tagsHint: string;
  tagOptions: string[];
  priceLabel: string;
  descriptionLabel: string;
  layout: "cards" | "rows" | "portfolio" | "gallery";
  ctaPost: string;
}

export const DIRECTORY_KINDS: Record<DirectoryKind, KindConfig> = {
  doctor: {
    kind: "doctor",
    path: "/doctors",
    label: "Doctors Directory",
    singular: "Doctor",
    tagline: "Find trusted doctors, specialists, dentists and clinics across all 47 counties.",
    seoTitle: "Doctors Directory Kenya — Find Specialists Near You",
    seoDescription:
      "Browse verified doctors and specialists in Kenya by county, hospital and specialty. Cardiologists, gynaecologists, surgeons, dentists, paediatricians and more.",
    keywords:
      "doctors in Kenya, doctors directory Kenya, specialist doctor Nairobi, gynaecologist Kenya, cardiologist Nairobi, orthopaedic surgeon Kenya, dentist Kenya, paediatrician Mombasa, private doctor Kisumu, hospital near me Kenya",
    nameLabel: "Your full name (with title)",
    namePlaceholder: "Dr. Jane Achieng",
    headlineLabel: "Specialty / what you are known for",
    headlinePlaceholder: "Consultant Cardiothoracic Surgeon",
    orgLabel: "Hospital / clinic",
    orgPlaceholder: "Homa Bay County Referral Hospital",
    tagsLabel: "Areas of expertise",
    tagsHint: "Add each service or specialty you handle",
    tagOptions: [
      "General Practice", "Cardiology", "Cardiothoracic Surgery", "Orthopaedics", "Gynaecology & Obstetrics",
      "Paediatrics", "Dentistry", "Dermatology", "ENT", "Neurology", "Neurosurgery", "Oncology",
      "Ophthalmology", "Psychiatry", "Radiology", "Urology", "Nephrology", "Physiotherapy",
      "Nutrition & Dietetics", "Public Health", "Anaesthesiology", "Pathology", "Family Medicine",
    ],
    priceLabel: "Consultation fee (KSh) — optional",
    descriptionLabel: "About you, your training and how patients can reach you",
    layout: "cards",
    ctaPost: "List yourself as a doctor",
  },
  developer: {
    kind: "developer",
    path: "/developers",
    label: "Developers & Creatives",
    singular: "Developer",
    tagline: "Software developers, web designers and IT pros — with live portfolios you can preview.",
    seoTitle: "Web Developers & Software Engineers in Kenya — Portfolios",
    seoDescription:
      "Hire vetted Kenyan web developers, app developers and designers. Browse live portfolios, tech stacks, pricing and contact details in one directory.",
    keywords:
      "web developers Kenya, software developer Nairobi, website design Kenya, app developer Kenya, freelance developer Kenya, hire developer Kenya, portfolio Kenya, WordPress developer Nairobi, Shopify developer Kenya, react developer Kenya",
    nameLabel: "Your name or studio name",
    namePlaceholder: "George Otieno / Pixel Labs",
    headlineLabel: "What do you build?",
    headlinePlaceholder: "Full-stack developer — React, Node & M-Pesa integrations",
    orgLabel: "Company / agency (optional)",
    orgPlaceholder: "Pixel Labs Africa",
    tagsLabel: "Skills & services",
    tagsHint: "Add the stacks and services you offer",
    tagOptions: [
      "Website Design", "E-commerce", "WordPress", "Shopify", "React", "Next.js", "Vue", "Angular",
      "Node.js", "Laravel", "PHP", "Python", "Django", "Flutter", "React Native", "Android", "iOS",
      "UI/UX Design", "Graphic Design", "SEO", "M-Pesa Integration", "API Development", "DevOps",
      "Data Analytics", "AI & Automation", "Cyber Security", "Networking", "Hosting & Domains",
    ],
    priceLabel: "Starting rate (KSh) — optional",
    descriptionLabel: "About your work, process and experience",
    layout: "portfolio",
    ctaPost: "Publish your developer portfolio",
  },
  wellness: {
    kind: "wellness",
    path: "/wellness",
    label: "Wellness, Spa & Booking",
    singular: "Wellness listing",
    tagline: "Massage therapists, spas, salons, wellness studios and hotel bookings — verified and bookable.",
    seoTitle: "Massage, Spa & Hotel Booking in Kenya — Wellness Directory",
    seoDescription:
      "Book massage therapy, spa treatments, wellness studios and hotel stays in Kenya. Compare services, prices and locations, then call or WhatsApp directly.",
    keywords:
      "massage in Nairobi, spa Kenya, massage therapist Kenya, full body massage Nairobi, deep tissue massage Kenya, hotel booking Kenya, guest house Nairobi, wellness centre Kenya, salon Nairobi, sauna and steam Nairobi, airbnb Kenya, Mombasa hotel booking",
    nameLabel: "Business or listing name",
    namePlaceholder: "Serene Touch Wellness Spa",
    headlineLabel: "Main service",
    headlinePlaceholder: "Deep tissue & aromatherapy massage, sauna and steam",
    orgLabel: "Venue / hotel / building",
    orgPlaceholder: "Nyayo Estate, Embakasi",
    tagsLabel: "Services offered",
    tagsHint: "Add every treatment or booking type",
    tagOptions: [
      "Full Body Massage", "Deep Tissue Massage", "Swedish Massage", "Aromatherapy", "Sports Massage",
      "Prenatal Massage", "Reflexology", "Sauna & Steam", "Jacuzzi", "Facials", "Waxing", "Manicure & Pedicure",
      "Hair Salon", "Barber", "Yoga", "Physiotherapy", "Hotel Rooms", "Airbnb / Short Stay",
      "Conference Booking", "Guest House", "Home Service", "Couples Package",
    ],
    priceLabel: "Price from (KSh)",
    descriptionLabel: "Describe your services, opening hours and booking process",
    layout: "gallery",
    ctaPost: "List your spa, massage or stay",
  },
  job: {
    kind: "job",
    path: "/jobs",
    label: "Jobs in Kenya",
    singular: "Job",
    tagline: "Real vacancies posted by real employers. Free to post, free to apply.",
    seoTitle: "Jobs in Kenya 2026 — Latest Vacancies & Careers",
    seoDescription:
      "Latest jobs in Kenya updated daily. Browse vacancies by sector, county and qualification, then apply directly to the employer. Free job posting for employers.",
    keywords:
      "jobs in Kenya, latest jobs Kenya 2026, vacancies Nairobi, NGO jobs Kenya, internships Kenya, government jobs Kenya, graduate jobs Kenya, teaching jobs Kenya, medical jobs Kenya, IT jobs Nairobi, sales jobs Kenya, driver jobs Kenya, job vacancies today Kenya",
    nameLabel: "Job title",
    namePlaceholder: "Sales & Marketing Executive",
    headlineLabel: "Short summary of the role",
    headlinePlaceholder: "Field sales role covering Nairobi and Kiambu, commission plus retainer",
    orgLabel: "Company / employer",
    orgPlaceholder: "Tugende Limited",
    tagsLabel: "Sector & tags",
    tagsHint: "Pick the sectors this role belongs to",
    tagOptions: [
      "Administration", "Agriculture", "Banking", "Construction", "Customer Service", "Data & Analytics",
      "Driving & Logistics", "Education & Teaching", "Engineering", "Finance & Accounting", "Graduate / Entry Level",
      "Hospitality & Catering", "Human Resources", "ICT / Computer", "Insurance", "Internship", "Legal",
      "Manufacturing", "Marketing & Communications", "Medical / Healthcare", "NGO / Non-Profit",
      "Procurement & Supply Chain", "Project Management", "Real Estate", "Research", "Sales & Business Development",
      "Security", "Top Management", "UX & Design", "Volunteer",
    ],
    priceLabel: "Gross salary (KSh / month) — leave blank for negotiable",
    descriptionLabel: "Full job description, duties and requirements",
    layout: "rows",
    ctaPost: "Post a job (free)",
  },
};

export const KIND_BY_PATH: Record<string, DirectoryKind> = {
  doctors: "doctor",
  developers: "developer",
  wellness: "wellness",
  jobs: "job",
};

export const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Internship", "Attachment", "Remote", "Hybrid", "Volunteer"];
export const EDUCATION_LEVELS = ["KCSE", "Certificate", "Diploma", "Degree", "Masters", "PhD", "Professional Certificate", "Any"];
export const EXPERIENCE_LEVELS = ["No experience", "1 - 2 years", "3 - 5 years", "5 - 8 years", "8+ years"];

export const slugifyDirectory = (value: string) =>
  (value || "listing")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70) || "listing";

/** Free, key-less website thumbnail — the same kind of preview card social apps show. */
export const linkThumbnail = (url: string, width = 1200) => {
  try {
    const clean = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(clean.toString())}?w=${width}`;
  } catch {
    return "/placeholder.svg";
  }
};

export const prettyHost = (url: string) => {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const normaliseUrl = (url: string) => {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const stripHtml = (value?: string | null) =>
  (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

/** Auto meta description — no AI key needed, always sane length for Google. */
export const autoMetaDescription = (description?: string | null, fallback = "") => {
  const plain = stripHtml(description) || fallback;
  if (!plain) return "";
  if (plain.length <= 155) return plain;
  const cut = plain.slice(0, 155);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(" "));
  return `${cut.slice(0, lastStop > 80 ? lastStop : 152).trim()}…`;
};

export const directoryPath = (kind: DirectoryKind, slug?: string) =>
  slug ? `${DIRECTORY_KINDS[kind].path}/${slug}` : DIRECTORY_KINDS[kind].path;

export const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo",
  "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
  "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta",
  "Tana River", "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];
