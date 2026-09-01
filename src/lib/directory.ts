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

/* ---------- Extra verticals: hotels, vehicles, tours, food, beauty, schools, gyms, artisans, events ---------- */
const EXTRA_KINDS: Record<string, KindConfig> = {
  hotel: {
    kind: "hotel",
    path: "/hotels",
    label: "Hotels, Lodges & Stays",
    singular: "Hotel",
    tagline: "Hotels, lodges, Airbnbs and guest houses across Kenya — book direct with the owner.",
    seoTitle: "Hotels & Lodges in Kenya — Book Direct, No Booking Fees",
    seoDescription:
      "Compare hotels, lodges, Airbnbs, resorts and guest houses in Kenya by county and price. Photos, rates and direct phone or WhatsApp booking — no commission.",
    keywords:
      "hotels in Kenya, hotel booking Kenya, cheap hotels Nairobi, Mombasa beach hotels, lodges Kenya, Airbnb Nairobi, guest house Kisumu, resorts Diani, conference hotels Nairobi, hotels near me Kenya",
    nameLabel: "Hotel / property name",
    namePlaceholder: "Lakeview Resort & Spa",
    headlineLabel: "What kind of stay is it?",
    headlinePlaceholder: "Beachfront resort with pool, spa and free breakfast",
    orgLabel: "Area / road",
    orgPlaceholder: "Diani Beach Road",
    tagsLabel: "Facilities",
    tagsHint: "Pick everything guests get",
    tagOptions: [
      "Free WiFi", "Swimming Pool", "Free Breakfast", "Airport Pickup", "Parking", "Restaurant", "Bar",
      "Conference Room", "Gym", "Spa", "Beachfront", "Family Rooms", "Self Catering", "Pet Friendly",
      "Hot Shower", "Backup Power", "CCTV Security", "Airbnb / Short Stay", "Camping", "Honeymoon Suite",
    ],
    priceLabel: "Price per night (KSh)",
    descriptionLabel: "Rooms, rates, check-in times and how to book",
    layout: "gallery",
    ctaPost: "List your hotel or Airbnb",
  },
  vehicle: {
    kind: "vehicle",
    path: "/vehicles",
    label: "Vehicles & Car Hire",
    singular: "Vehicle",
    tagline: "Car hire, chauffeur services, tour vans, lorries and boda services — verified operators.",
    seoTitle: "Car Hire in Kenya — Self Drive, Chauffeur & Tour Vans",
    seoDescription:
      "Hire cars, 4x4s, tour vans, lorries and buses in Kenya. Compare daily rates, self drive and chauffeur options, then call or WhatsApp the operator directly.",
    keywords:
      "car hire Kenya, self drive car hire Nairobi, chauffeur services Kenya, tour van hire Kenya, lorry for hire Nairobi, wedding cars Kenya, airport transfer Nairobi, 4x4 hire Kenya, bus hire Kenya, matatu for hire",
    nameLabel: "Business or vehicle name",
    namePlaceholder: "Safiri Car Hire — Toyota Prado TX",
    headlineLabel: "What do you offer?",
    headlinePlaceholder: "Self drive and chauffeur car hire, airport transfers countrywide",
    orgLabel: "Company (optional)",
    orgPlaceholder: "Safiri Rentals Ltd",
    tagsLabel: "Vehicles & services",
    tagsHint: "Pick what you provide",
    tagOptions: [
      "Self Drive", "With Driver", "Airport Transfer", "Wedding Cars", "Tour Van", "4x4 / Safari",
      "Saloon Car", "SUV", "Minibus", "Bus Hire", "Lorry / Truck", "Pickup", "Boda Boda", "Tuk Tuk",
      "Long Distance", "Corporate Contracts", "Unlimited Mileage", "Insurance Included",
    ],
    priceLabel: "Rate per day (KSh)",
    descriptionLabel: "Fleet, rates, deposit and hire conditions",
    layout: "cards",
    ctaPost: "List your car hire business",
  },
  tour: {
    kind: "tour",
    path: "/tours",
    label: "Tours, Parks & Safaris",
    singular: "Tour",
    tagline: "Safari packages, national parks, day trips and team-building destinations.",
    seoTitle: "Safari Tours & National Parks in Kenya — Packages & Prices",
    seoDescription:
      "Book Kenyan safaris, park visits, day trips and team building getaways. Compare packages, prices and operators for Maasai Mara, Amboseli, Diani and more.",
    keywords:
      "safari packages Kenya, Maasai Mara safari price, Amboseli tour Kenya, national parks Kenya, day trips Nairobi, team building venues Kenya, honeymoon packages Kenya, Diani holiday packages, tour operators Kenya, park entry fees Kenya",
    nameLabel: "Tour or park name",
    namePlaceholder: "3 Days 2 Nights Maasai Mara Safari",
    headlineLabel: "Short summary",
    headlinePlaceholder: "All-inclusive Mara safari with game drives, transport and full board",
    orgLabel: "Tour company / park authority",
    orgPlaceholder: "Bush Trails Safaris",
    tagsLabel: "Experience type",
    tagsHint: "Pick what the trip includes",
    tagOptions: [
      "Game Drive", "National Park", "Beach Holiday", "Day Trip", "Camping", "Hiking", "Team Building",
      "Honeymoon", "Family Package", "School Trip", "Cultural Tour", "Boat Ride", "Bird Watching",
      "All Inclusive", "Group Discount", "Transport Included", "Full Board", "Photography Safari",
    ],
    priceLabel: "Price per person (KSh)",
    descriptionLabel: "Itinerary, what is included and booking terms",
    layout: "gallery",
    ctaPost: "List your tour or park",
  },
  restaurant: {
    kind: "restaurant",
    path: "/restaurants",
    label: "Restaurants & Food",
    singular: "Restaurant",
    tagline: "Restaurants, nyama choma joints, cafés, bakeries and outside catering.",
    seoTitle: "Restaurants in Kenya — Menus, Prices & Delivery",
    seoDescription:
      "Find restaurants, nyama choma joints, cafés and caterers in Kenya. Browse menus, prices and locations, then call, WhatsApp or order delivery directly.",
    keywords:
      "restaurants in Nairobi, nyama choma Nairobi, best restaurants Kenya, food delivery Nairobi, cafe Nairobi, outside catering Kenya, bakery Kenya, fast food Mombasa, pizza Nairobi, buffet restaurants Kenya",
    nameLabel: "Restaurant / business name",
    namePlaceholder: "Mama Ashley Kitchen & Grill",
    headlineLabel: "What do you serve?",
    headlinePlaceholder: "Nyama choma, ugali, fish and swahili dishes with free delivery",
    orgLabel: "Building / street",
    orgPlaceholder: "Kimathi Street, CBD",
    tagsLabel: "Cuisine & services",
    tagsHint: "Pick your specialities",
    tagOptions: [
      "Nyama Choma", "Swahili Dishes", "Fish", "Fast Food", "Pizza", "Chinese", "Indian", "Vegetarian",
      "Breakfast", "Buffet", "Café & Coffee", "Bakery & Cakes", "Outside Catering", "Delivery",
      "Takeaway", "Bar & Drinks", "Live Band", "Family Friendly", "Halal", "Events Hall",
    ],
    priceLabel: "Average price per plate (KSh)",
    descriptionLabel: "Menu highlights, opening hours and delivery areas",
    layout: "gallery",
    ctaPost: "List your restaurant",
  },
  salon: {
    kind: "salon",
    path: "/salons",
    label: "Salons & Barbers",
    singular: "Salon",
    tagline: "Salons, barbers, nail techs, dreadlock experts and mobile beauty services.",
    seoTitle: "Salons & Barbers in Kenya — Prices, Photos & Booking",
    seoDescription:
      "Find salons, barbershops, nail technicians, braiders and dreadlock specialists in Kenya. Compare prices, see work photos and book by call or WhatsApp.",
    keywords:
      "salon Nairobi, barber shop Kenya, nail salon Nairobi, braiding salon Kenya, dreadlocks Nairobi, wig installation Kenya, mobile hairdresser Nairobi, makeup artist Kenya, pedicure Nairobi, salon near me",
    nameLabel: "Salon or stylist name",
    namePlaceholder: "Glow Studio by Njeri",
    headlineLabel: "Main services",
    headlinePlaceholder: "Braiding, wig installation, nails and bridal makeup",
    orgLabel: "Building / plaza",
    orgPlaceholder: "Ronald Ngala Plaza, 2nd Floor",
    tagsLabel: "Services",
    tagsHint: "Pick everything you do",
    tagOptions: [
      "Braiding", "Weaving", "Wig Installation", "Dreadlocks", "Barber / Haircut", "Kids Haircut",
      "Nails & Gel", "Pedicure", "Manicure", "Makeup", "Bridal Makeup", "Lashes", "Facials",
      "Hair Treatment", "Relaxing & Dyeing", "Mobile / Home Service", "Waxing", "Threading",
    ],
    priceLabel: "Price from (KSh)",
    descriptionLabel: "Services, prices and opening hours",
    layout: "gallery",
    ctaPost: "List your salon or barbershop",
  },
  school: {
    kind: "school",
    path: "/schools",
    label: "Schools & Colleges",
    singular: "School",
    tagline: "Schools, colleges, driving schools and training centres with fees and admissions.",
    seoTitle: "Schools & Colleges in Kenya — Fees, Courses & Admissions",
    seoDescription:
      "Browse schools, colleges, universities, driving schools and training institutes in Kenya. Compare fees, courses and intakes, then contact admissions directly.",
    keywords:
      "schools in Kenya, private schools Nairobi, colleges Kenya, TVET courses Kenya, driving school Nairobi, boarding schools Kenya, university courses Kenya, school fees Kenya, computer college Nairobi, tuition centre Kenya",
    nameLabel: "Institution name",
    namePlaceholder: "Bright Star Academy",
    headlineLabel: "What do you offer?",
    headlinePlaceholder: "CBC primary and junior secondary, day and boarding",
    orgLabel: "Sponsor / group (optional)",
    orgPlaceholder: "Bright Star Education Group",
    tagsLabel: "Programmes",
    tagsHint: "Pick what you teach",
    tagOptions: [
      "Playgroup / PP1", "Primary / CBC", "Junior Secondary", "High School", "Day School", "Boarding",
      "TVET / Diploma", "Certificate", "University Degree", "Driving School", "Computer Packages",
      "Professional Courses", "Online Learning", "Special Needs", "Adult Education", "Tuition & Coaching",
    ],
    priceLabel: "Fees per term (KSh)",
    descriptionLabel: "Courses, fees, intakes and admission requirements",
    layout: "cards",
    ctaPost: "List your school or college",
  },
  fitness: {
    kind: "fitness",
    path: "/gyms",
    label: "Gyms & Fitness",
    singular: "Gym",
    tagline: "Gyms, personal trainers, yoga studios and sports clubs with real membership prices.",
    seoTitle: "Gyms & Personal Trainers in Kenya — Membership Prices",
    seoDescription:
      "Find gyms, personal trainers, yoga studios, aerobics classes and sports clubs in Kenya. Compare membership prices and locations, then book directly.",
    keywords:
      "gyms in Nairobi, gym membership prices Kenya, personal trainer Nairobi, yoga classes Kenya, aerobics Nairobi, home fitness trainer Kenya, weight loss Kenya, boxing gym Nairobi, swimming lessons Nairobi",
    nameLabel: "Gym or trainer name",
    namePlaceholder: "Ironhouse Fitness Centre",
    headlineLabel: "What do you offer?",
    headlinePlaceholder: "Weights, cardio, aerobics classes and personal training",
    orgLabel: "Building / estate",
    orgPlaceholder: "Pioneer House, Moi Avenue",
    tagsLabel: "Training offered",
    tagsHint: "Pick what members get",
    tagOptions: [
      "Weight Training", "Cardio", "Aerobics", "Yoga", "Pilates", "CrossFit", "Boxing", "Martial Arts",
      "Personal Training", "Home Training", "Group Classes", "Swimming", "Sauna & Steam", "Nutrition Coaching",
      "Weight Loss Programme", "Women Only Sessions", "Student Rates", "Day Pass",
    ],
    priceLabel: "Monthly membership (KSh)",
    descriptionLabel: "Equipment, classes, timetable and membership plans",
    layout: "cards",
    ctaPost: "List your gym or training service",
  },
  artisan: {
    kind: "artisan",
    path: "/artisans",
    label: "Artisans & Home Services",
    singular: "Artisan",
    tagline: "Plumbers, electricians, masons, movers, cleaners and fundis you can actually reach.",
    seoTitle: "Plumbers, Electricians & Fundis in Kenya — Home Services",
    seoDescription:
      "Hire trusted plumbers, electricians, masons, welders, painters, movers and cleaners in Kenya. See rates and areas served, then call or WhatsApp the fundi.",
    keywords:
      "plumber Nairobi, electrician Kenya, fundi near me Kenya, mason Nairobi, house movers Nairobi, cleaning services Kenya, welder Kenya, painter Nairobi, carpenter Kenya, borehole drilling Kenya",
    nameLabel: "Your name or business name",
    namePlaceholder: "Kamau Plumbing Works",
    headlineLabel: "What work do you do?",
    headlinePlaceholder: "Plumbing repairs, water tanks and bathroom installation",
    orgLabel: "Workshop / base area",
    orgPlaceholder: "Kawangware, Nairobi",
    tagsLabel: "Skills",
    tagsHint: "Pick every job you handle",
    tagOptions: [
      "Plumbing", "Electrical", "Masonry", "Carpentry", "Welding & Fabrication", "Painting", "Tiling",
      "Roofing", "Ceiling & Gypsum", "Interior Design", "Curtains & Blinds", "House Moving", "Cleaning",
      "Fumigation", "Garbage Collection", "Borehole Drilling", "Solar Installation", "CCTV Installation",
      "Appliance Repair", "Landscaping", "Car Wash", "Laundry",
    ],
    priceLabel: "Call-out rate (KSh) — optional",
    descriptionLabel: "Jobs you handle, areas served and how you charge",
    layout: "rows",
    ctaPost: "List your services as a fundi",
  },
  "event-service": {
    kind: "event-service",
    path: "/event-services",
    label: "Events, Photography & Hire",
    singular: "Event service",
    tagline: "Photographers, DJs, tents and chairs, MCs, decor and event venues for hire.",
    seoTitle: "Event Services in Kenya — Photographers, DJs, Tents & Decor",
    seoDescription:
      "Book photographers, videographers, DJs, MCs, tents and chairs, decor and event venues in Kenya. Compare packages and prices, then contact the supplier directly.",
    keywords:
      "wedding photographer Kenya, videographer Nairobi, DJ hire Nairobi, tents and chairs for hire Kenya, event decor Kenya, MC Kenya, PA system hire Nairobi, wedding planner Kenya, event venues Nairobi, photo booth Kenya",
    nameLabel: "Business or service name",
    namePlaceholder: "Frame Story Photography",
    headlineLabel: "What do you provide?",
    headlinePlaceholder: "Wedding photography and same-day video highlights",
    orgLabel: "Studio / base",
    orgPlaceholder: "Westlands, Nairobi",
    tagsLabel: "Services",
    tagsHint: "Pick everything you supply",
    tagOptions: [
      "Photography", "Videography", "Drone Coverage", "DJ & Sound", "MC / Host", "Live Band",
      "Tents & Chairs", "Decor & Flowers", "Catering", "Cake", "Wedding Planning", "Photo Booth",
      "Lighting", "Stage & Truss", "Venue Hire", "Bridal Makeup", "Transport", "Printing & Branding",
    ],
    priceLabel: "Package from (KSh)",
    descriptionLabel: "Packages, what is included and booking process",
    layout: "gallery",
    ctaPost: "List your event service",
  },
};

Object.assign(DIRECTORY_KINDS, EXTRA_KINDS);

export const KIND_BY_PATH: Record<string, DirectoryKind> = {
  doctors: "doctor",
  developers: "developer",
  wellness: "wellness",
  jobs: "job",
  hotels: "hotel",
  vehicles: "vehicle",
  tours: "tour",
  restaurants: "restaurant",
  salons: "salon",
  schools: "school",
  gyms: "fitness",
  artisans: "artisan",
  "event-services": "event-service",
};

/** Every directory in display order — used by the homepage, navbar and hub pages. */
export const ALL_DIRECTORY_KINDS: DirectoryKind[] = [
  "wellness", "hotel", "doctor", "vehicle", "restaurant", "salon", "tour",
  "artisan", "event-service", "fitness", "school", "developer", "job",
];

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
