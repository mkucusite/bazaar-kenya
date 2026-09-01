/**
 * Intent layer — every page on KenyaAdvert has two audiences:
 *  1. the citizen looking for a service  ("I want to hire a car")
 *  2. the merchant offering it           ("I want to list my car hire")
 *
 * This file gives each vertical the right verbs so headers, CTAs and
 * the global Sell button always say the thing that matches the page.
 */
import type { DirectoryKind } from "@/lib/directory";

export interface IntentConfig {
  /** what the visitor wants to do */
  seekLabel: string;
  seekHref: string;
  /** what a merchant wants to do */
  offerLabel: string;
  offerHref: string;
  /** short label for the global header button */
  buttonLabel: string;
  similarLabel: string;
}

export const DIRECTORY_INTENTS: Record<string, IntentConfig> = {
  doctor: {
    seekLabel: "Find a doctor near me",
    seekHref: "/doctors",
    offerLabel: "List yourself as a doctor",
    offerHref: "/doctors/new",
    buttonLabel: "List clinic",
    similarLabel: "More doctors",
  },
  developer: {
    seekLabel: "Hire a developer",
    seekHref: "/developers",
    offerLabel: "Publish your portfolio",
    offerHref: "/developers/new",
    buttonLabel: "Add portfolio",
    similarLabel: "More developers",
  },
  wellness: {
    seekLabel: "Book a massage or spa",
    seekHref: "/wellness",
    offerLabel: "List your spa or stay",
    offerHref: "/wellness/new",
    buttonLabel: "List spa",
    similarLabel: "More spas & therapists",
  },
  job: {
    seekLabel: "Browse jobs",
    seekHref: "/jobs",
    offerLabel: "Post a job (free)",
    offerHref: "/jobs/new",
    buttonLabel: "Post job",
    similarLabel: "Similar jobs",
  },
  hotel: {
    seekLabel: "Book a room",
    seekHref: "/hotels",
    offerLabel: "List your hotel or Airbnb",
    offerHref: "/hotels/new",
    buttonLabel: "List stay",
    similarLabel: "More stays",
  },
  vehicle: {
    seekLabel: "Hire this vehicle",
    seekHref: "/vehicles",
    offerLabel: "List your car for hire",
    offerHref: "/vehicles/new",
    buttonLabel: "List vehicle",
    similarLabel: "Similar cars for hire",
  },
  tour: {
    seekLabel: "Book this trip",
    seekHref: "/tours",
    offerLabel: "List your tour or park",
    offerHref: "/tours/new",
    buttonLabel: "List tour",
    similarLabel: "More safaris & trips",
  },
  restaurant: {
    seekLabel: "Order or reserve",
    seekHref: "/restaurants",
    offerLabel: "List your restaurant",
    offerHref: "/restaurants/new",
    buttonLabel: "List food place",
    similarLabel: "More places to eat",
  },
  salon: {
    seekLabel: "Book an appointment",
    seekHref: "/salons",
    offerLabel: "List your salon or barbershop",
    offerHref: "/salons/new",
    buttonLabel: "List salon",
    similarLabel: "More salons & barbers",
  },
  school: {
    seekLabel: "Request admission info",
    seekHref: "/schools",
    offerLabel: "List your school or college",
    offerHref: "/schools/new",
    buttonLabel: "List school",
    similarLabel: "More schools nearby",
  },
  fitness: {
    seekLabel: "Join or book a session",
    seekHref: "/gyms",
    offerLabel: "List your gym or training",
    offerHref: "/gyms/new",
    buttonLabel: "List gym",
    similarLabel: "More gyms & trainers",
  },
  artisan: {
    seekLabel: "Request a quote",
    seekHref: "/artisans",
    offerLabel: "List your services",
    offerHref: "/artisans/new",
    buttonLabel: "List service",
    similarLabel: "More service providers",
  },
  "event-service": {
    seekLabel: "Check availability",
    seekHref: "/event-services",
    offerLabel: "List your event service",
    offerHref: "/event-services/new",
    buttonLabel: "List service",
    similarLabel: "More event services",
  },
};

export const intentFor = (kind: DirectoryKind): IntentConfig =>
  DIRECTORY_INTENTS[kind] || {
    seekLabel: "Contact this listing",
    seekHref: "/search",
    offerLabel: "Publish your own listing",
    offerHref: "/post-ad",
    buttonLabel: "Sell",
    similarLabel: "Similar listings",
  };

/** Header button: adapts to whichever section the visitor is browsing. */
export const headerActionFor = (pathname: string): { label: string; href: string } => {
  const match = Object.values(DIRECTORY_INTENTS).find(
    (i) => pathname === i.seekHref || pathname.startsWith(`${i.seekHref}/`),
  );
  if (match) return { label: match.buttonLabel, href: match.offerHref };
  if (pathname.startsWith("/events")) return { label: "Host event", href: "/create-event" };
  if (pathname.startsWith("/politicians") || pathname.startsWith("/politics"))
    return { label: "Campaign", href: "/create-banner" };
  if (pathname.startsWith("/digital-store")) return { label: "Sell file", href: "/digital-store" };
  if (pathname.startsWith("/banners")) return { label: "Advertise", href: "/create-banner" };
  return { label: "Sell", href: "/post-ad" };
};

/* ------------------------------------------------------------------ */
/* Per-vertical entry fields — everything a merchant must fill in     */
/* ------------------------------------------------------------------ */

export interface ExtraField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: string[];
  required?: boolean;
}

const OPENING_HOURS: ExtraField = {
  key: "opening_hours",
  label: "Opening hours",
  placeholder: "Mon–Sat 8am–8pm, Sun 10am–6pm",
};
const HOME_SERVICE: ExtraField = {
  key: "home_service",
  label: "Do you offer home / mobile service?",
  type: "select",
  options: ["No", "Yes — within my town", "Yes — countywide", "Yes — countrywide"],
};

export const EXTRA_FIELDS: Partial<Record<DirectoryKind, ExtraField[]>> = {
  doctor: [
    { key: "licence_number", label: "Practising licence / KMPDC number", placeholder: "KMPDC/12345", required: true },
    { key: "years_experience", label: "Years of experience", type: "number", placeholder: "8" },
    { key: "languages", label: "Languages spoken", placeholder: "English, Kiswahili, Kikuyu" },
    { key: "insurance", label: "Insurance accepted", placeholder: "NHIF/SHA, Jubilee, AAR, Britam" },
    OPENING_HOURS,
    HOME_SERVICE,
  ],
  wellness: [
    { key: "therapists", label: "Number of therapists / staff", type: "number", placeholder: "4" },
    { key: "session_length", label: "Session length", placeholder: "60 minutes" },
    { key: "gender_served", label: "Clients served", type: "select", options: ["Everyone", "Women only", "Men only", "Couples"] },
    OPENING_HOURS,
    HOME_SERVICE,
  ],
  vehicle: [
    { key: "vehicle_make", label: "Make & model", placeholder: "Toyota Prado TX 2018", required: true },
    { key: "seats", label: "Seats", type: "number", placeholder: "7" },
    { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
    { key: "fuel", label: "Fuel", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
    { key: "hire_type", label: "Hire type", type: "select", options: ["Self drive", "With driver", "Both"] },
    { key: "deposit", label: "Security deposit (KSh)", type: "number", placeholder: "20000" },
    { key: "mileage_limit", label: "Daily mileage limit", placeholder: "Unlimited within Nairobi" },
  ],
  hotel: [
    { key: "rooms", label: "Number of rooms / units", type: "number", placeholder: "24" },
    { key: "checkin", label: "Check-in / check-out", placeholder: "Check-in 1pm · Check-out 10am" },
    { key: "meals", label: "Meal plan", type: "select", options: ["Room only", "Bed & breakfast", "Half board", "Full board", "All inclusive"] },
    { key: "star_rating", label: "Star rating (if any)", type: "select", options: ["Not rated", "1", "2", "3", "4", "5"] },
  ],
  tour: [
    { key: "duration", label: "Duration", placeholder: "3 days 2 nights", required: true },
    { key: "group_size", label: "Group size", placeholder: "Min 2, max 12 people" },
    { key: "departure", label: "Departure point", placeholder: "Nairobi CBD" },
    { key: "includes", label: "What is included", type: "textarea", placeholder: "Transport, park fees, full board, guide" },
  ],
  restaurant: [
    OPENING_HOURS,
    { key: "delivery", label: "Delivery", type: "select", options: ["No delivery", "Own riders", "Bolt Food / Glovo", "Both"] },
    { key: "seating", label: "Seating capacity", type: "number", placeholder: "60" },
    { key: "menu_link", label: "Menu link (optional)", placeholder: "https://..." },
  ],
  salon: [OPENING_HOURS, HOME_SERVICE, { key: "booking", label: "How clients book", placeholder: "Walk-in or WhatsApp booking" }],
  school: [
    { key: "school_type", label: "Type", type: "select", options: ["Day", "Boarding", "Day & boarding", "Online"] },
    { key: "curriculum", label: "Curriculum", placeholder: "CBC / 8-4-4 / IGCSE" },
    { key: "intake", label: "Next intake", placeholder: "January 2027" },
    { key: "registration", label: "Registration / accreditation number", placeholder: "TVETA/PC/1234" },
  ],
  fitness: [
    OPENING_HOURS,
    { key: "membership", label: "Membership options", placeholder: "Daily 300 · Monthly 3,500 · Annual 30,000" },
    { key: "trainers", label: "Trainers available", type: "select", options: ["Yes", "No"] },
  ],
  artisan: [
    { key: "years_experience", label: "Years of experience", type: "number", placeholder: "6" },
    { key: "callout", label: "Call-out fee (KSh)", type: "number", placeholder: "500" },
    HOME_SERVICE,
  ],
  "event-service": [
    { key: "capacity", label: "Capacity you can handle", placeholder: "Up to 500 guests" },
    { key: "lead_time", label: "Booking lead time", placeholder: "At least 3 days" },
    { key: "deposit", label: "Deposit required (KSh)", type: "number", placeholder: "10000" },
  ],
  developer: [
    { key: "years_experience", label: "Years of experience", type: "number", placeholder: "5" },
    { key: "availability", label: "Availability", type: "select", options: ["Full-time", "Part-time", "Freelance / project", "Open to employment"] },
    { key: "github", label: "GitHub / Behance (optional)", placeholder: "github.com/username" },
  ],
};
