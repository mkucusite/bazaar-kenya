import type { DirectoryKind } from "@/lib/directory";

/**
 * Service landing pages.
 *
 * Instead of hand-building a page per service, every entry here is expanded by
 * `ServicePage` into a full SEO page: matching ads, matching directory listings,
 * county links, FAQs and JSON-LD. Adding a service to this list creates a page.
 */
export interface ServiceTopic {
  slug: string;
  name: string;
  group: string;
  /** Words matched against ad titles/descriptions to pull real listings in. */
  keywords: string[];
  /** Directories searched for professional listings of this service. */
  kinds: DirectoryKind[];
  /** Tags used to filter the directory listings. */
  tags?: string[];
  intro: string;
  priceGuide: string;
  faqs: { q: string; a: string }[];
  image: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const SERVICE_TOPICS: ServiceTopic[] = [
  {
    slug: "room-massage",
    name: "Room Massage (Hotel & Home Service)",
    group: "Massage & Wellness",
    keywords: ["room massage", "hotel massage", "in room massage", "home service massage", "massage at your place"],
    kinds: ["wellness"],
    tags: ["Home Service", "Full Body Massage", "Deep Tissue Massage"],
    intro:
      "Room massage — also called in-room or home-service massage — is a session delivered where you are staying instead of at a spa. The therapist arrives with a portable couch, oils and towels, so you get the same full body treatment in your hotel room, apartment or Airbnb. It is the fastest growing wellness request in Nairobi, Mombasa, Kisumu and Nakuru, mostly from travellers, night-shift workers and anyone who does not want to drive after a deep tissue session.",
    priceGuide:
      "Expect KSh 1,500 – 3,000 for a 60-minute full body room massage in Nairobi, KSh 2,000 – 4,000 at the coast, plus a small transport charge for late-night calls.",
    faqs: [
      { q: "What does a room massage include?", a: "Usually a 60 or 90 minute full body massage with oil, plus optional deep tissue, aromatherapy or sports focus. The therapist brings the couch, oils and clean towels." },
      { q: "Is room massage safe?", a: "Book only listings that show a real phone number, ask for the therapist's name in advance, agree the price before they travel and meet in a hotel with a reception. Never send money before the session." },
      { q: "How soon can a therapist arrive?", a: "Most Nairobi therapists reach Westlands, Kilimani, CBD or Embakasi within an hour. Coast towns are similar; upcountry towns may need a same-day booking." },
      { q: "How do I pay?", a: "Pay after the session, in cash or M-Pesa, directly to the therapist. KenyaAdvert does not take a commission." },
    ],
    image: img("photo-1600334089648-b0d9d3028eb2"),
  },
  {
    slug: "full-body-massage",
    name: "Full Body Massage",
    group: "Massage & Wellness",
    keywords: ["full body massage", "body massage", "massage therapy", "relaxation massage"],
    kinds: ["wellness"],
    tags: ["Full Body Massage", "Swedish Massage"],
    intro:
      "A full body massage works the back, shoulders, arms, legs and feet in one session, using medium pressure and oil. It is the most requested treatment in Kenyan spas, both for stress relief and for the desk-job stiffness that comes with long Nairobi commutes.",
    priceGuide: "KSh 1,000 – 2,500 for 60 minutes in a spa, KSh 1,500 – 3,000 for home or hotel service.",
    faqs: [
      { q: "How long should a full body massage take?", a: "60 minutes covers the whole body comfortably. 90 minutes allows extra time on the back and legs." },
      { q: "How often should I book?", a: "Once a fortnight is enough for general stress. Weekly helps if you train hard or sit at a desk all day." },
    ],
    image: img("photo-1519823551278-64ac92734fb1"),
  },
  {
    slug: "deep-tissue-massage",
    name: "Deep Tissue & Sports Massage",
    group: "Massage & Wellness",
    keywords: ["deep tissue massage", "sports massage", "therapeutic massage", "back pain massage"],
    kinds: ["wellness"],
    tags: ["Deep Tissue Massage", "Sports Massage", "Physiotherapy"],
    intro:
      "Deep tissue and sports massage use firm, slow pressure to release knots in the muscle layers underneath. Runners, gym members, boda riders and anyone with long-term back or neck pain get the most out of it.",
    priceGuide: "KSh 1,500 – 3,500 per session. Physiotherapist-led sessions cost more but can be claimed on some medical covers.",
    faqs: [
      { q: "Does deep tissue massage hurt?", a: "It should feel like strong, tolerable pressure — never sharp pain. Tell the therapist to ease off at any point." },
      { q: "Massage or physiotherapy?", a: "For a sports injury, a nerve problem or pain lasting over a month, see a physiotherapist first. Massage is for tight muscles, not diagnosis." },
    ],
    image: img("photo-1544161515-4ab6ce6db874"),
  },
  {
    slug: "spa-day-packages",
    name: "Spa Day Packages",
    group: "Massage & Wellness",
    keywords: ["spa package", "spa day", "sauna and steam", "jacuzzi", "couples massage"],
    kinds: ["wellness"],
    tags: ["Sauna & Steam", "Jacuzzi", "Couples Package", "Facials"],
    intro:
      "A spa day bundles massage with sauna, steam, jacuzzi and a facial or pedicure. Kenyan hotels and standalone spas sell these as half-day or full-day packages, and couples packages are the most popular weekend booking.",
    priceGuide: "KSh 3,000 – 8,000 per person for a half-day package; hotel spas at the coast go higher on weekends.",
    faqs: [
      { q: "What should I carry to a spa day?", a: "Swimwear for the steam and jacuzzi, a change of clothes and a hair covering. Everything else is provided." },
      { q: "Can we book for two?", a: "Yes — look for listings tagged Couples Package; most spas have a twin room." },
    ],
    image: img("photo-1540555700478-4be289fbecef"),
  },
  {
    slug: "hotel-rooms-and-short-stay",
    name: "Hotel Rooms & Short Stay",
    group: "Stays & Travel",
    keywords: ["hotel room", "airbnb", "short stay", "guest house", "bnb", "lodging"],
    kinds: ["hotel"],
    tags: ["Airbnb / Short Stay", "Family Rooms", "Self Catering"],
    intro:
      "Short-stay rooms, Airbnbs and guest houses booked directly with the owner — no platform commission and no card needed. Compare nightly rates across counties, check the photos, then call or WhatsApp to hold the room.",
    priceGuide: "KSh 1,500 – 4,000 a night upcountry, KSh 2,500 – 8,000 in Nairobi, KSh 3,000 – 15,000 at the coast in high season.",
    faqs: [
      { q: "Do I pay a deposit?", a: "Most owners ask for a partial M-Pesa deposit to hold the room. Confirm the property exists first and keep the message thread." },
      { q: "Is early check-in possible?", a: "Ask when booking — most Kenyan properties will hold a room from midday if it is free." },
    ],
    image: img("photo-1566073771259-6a8506099945"),
  },
  {
    slug: "car-hire",
    name: "Car Hire — Self Drive & Chauffeur",
    group: "Transport",
    keywords: ["car hire", "self drive", "car rental", "chauffeur", "airport transfer", "van hire"],
    kinds: ["vehicle"],
    tags: ["Self Drive", "With Driver", "Airport Transfer"],
    intro:
      "Hire a saloon car, SUV, 4x4, tour van or minibus anywhere in Kenya, with or without a driver. Operators here list daily rates, mileage limits and deposit terms up front.",
    priceGuide: "Saloon from KSh 3,500/day, SUV from KSh 6,000/day, tour van from KSh 10,000/day, driver KSh 1,500 – 2,500/day extra.",
    faqs: [
      { q: "What do I need for self drive?", a: "A valid Kenyan or international licence, national ID or passport, and usually a refundable deposit." },
      { q: "Is insurance included?", a: "Comprehensive cover is usually included but with an excess. Ask for the excess amount in writing before you drive off." },
    ],
    image: img("photo-1552519507-da3b142c6e3d"),
  },
  {
    slug: "safari-packages",
    name: "Safari Packages & Park Trips",
    group: "Stays & Travel",
    keywords: ["safari", "maasai mara", "game drive", "park", "tour package", "team building"],
    kinds: ["tour"],
    tags: ["Game Drive", "National Park", "All Inclusive"],
    intro:
      "Safari and park packages from Kenyan operators — Maasai Mara, Amboseli, Tsavo, Nakuru, Diani and the smaller day-trip parks around Nairobi. Every listing shows the itinerary, what is included and the price per person.",
    priceGuide: "Day trips from KSh 4,500 per person; 3-day Mara packages KSh 22,000 – 45,000 per person depending on the camp.",
    faqs: [
      { q: "Are park fees included?", a: "Not always. Ask whether the quote covers park entry, transport, accommodation and meals." },
      { q: "Can I join a group departure?", a: "Yes — group departures are the cheapest way to travel solo. Look for listings tagged Group Discount." },
    ],
    image: img("photo-1516426122078-c23e76319801"),
  },
  {
    slug: "plumbers-and-electricians",
    name: "Plumbers, Electricians & Fundis",
    group: "Home Services",
    keywords: ["plumber", "electrician", "fundi", "repair", "installation", "welding", "painting"],
    kinds: ["artisan"],
    tags: ["Plumbing", "Electrical", "Masonry"],
    intro:
      "Emergency plumbing, wiring faults, tank installation, welding, painting and general repairs from fundis who list their trade, their area and their call-out rate.",
    priceGuide: "Call-out KSh 500 – 1,500 in town, then a quote per job. Always agree labour and materials separately.",
    faqs: [
      { q: "How do I avoid being overcharged?", a: "Get two quotes, buy the materials yourself where you can, and pay on completion." },
      { q: "Do they work at night?", a: "Many plumbers and electricians handle emergencies at night for a higher call-out fee." },
    ],
    image: img("photo-1607472586893-edb57bdc0e39"),
  },
  {
    slug: "salons-and-braiding",
    name: "Salons, Braiding & Barbers",
    group: "Beauty",
    keywords: ["salon", "braiding", "barber", "dreadlocks", "nails", "wig", "makeup"],
    kinds: ["salon"],
    tags: ["Braiding", "Barber / Haircut", "Nails & Gel"],
    intro:
      "Braiding, wig installation, dreadlock maintenance, nails, barbering and bridal makeup — in-salon or mobile. Prices and work photos are on each listing.",
    priceGuide: "Braiding KSh 800 – 4,000 depending on style, gel nails KSh 800 – 2,000, men's cut KSh 200 – 800.",
    faqs: [
      { q: "Do stylists come home?", a: "Many do — look for listings tagged Mobile / Home Service and confirm the transport charge." },
      { q: "How long does braiding take?", a: "Two to six hours depending on the style and the number of stylists working on your hair." },
    ],
    image: img("photo-1560066984-138dadb4c035"),
  },
  {
    slug: "photographers-and-events",
    name: "Photographers, DJs & Event Hire",
    group: "Events",
    keywords: ["photographer", "videographer", "dj", "tents", "chairs", "decor", "mc", "sound system"],
    kinds: ["event-service"],
    tags: ["Photography", "DJ & Sound", "Tents & Chairs"],
    intro:
      "Wedding and event suppliers across Kenya: photographers, videographers, DJs, MCs, tents and chairs, decor, sound and venues — each with packages and prices.",
    priceGuide: "Wedding photography KSh 25,000 – 150,000, DJ and sound KSh 15,000 – 50,000, tents and chairs from KSh 100 per seat.",
    faqs: [
      { q: "How early should I book?", a: "Two to three months for a December or April wedding; popular photographers fill up faster." },
      { q: "Is a deposit normal?", a: "Yes — usually 30 – 50% to hold the date, with the balance on the event day. Get a written package list." },
    ],
    image: img("photo-1519741497674-611481863552"),
  },
  {
    slug: "gyms-and-personal-trainers",
    name: "Gyms & Personal Trainers",
    group: "Health & Fitness",
    keywords: ["gym", "personal trainer", "fitness", "aerobics", "yoga", "weight loss"],
    kinds: ["fitness"],
    tags: ["Personal Training", "Weight Training", "Yoga"],
    intro:
      "Gyms with real membership prices, plus personal trainers who come to your estate or home. Compare monthly rates, classes and equipment before you commit.",
    priceGuide: "Gym membership KSh 2,000 – 8,000 a month; home personal training KSh 1,000 – 2,500 per session.",
    faqs: [
      { q: "Are there day passes?", a: "Most gyms sell a day pass between KSh 200 and KSh 800 — good for testing the equipment first." },
      { q: "Women-only sessions?", a: "Several Nairobi gyms run women-only hours; look for that tag on the listing." },
    ],
    image: img("photo-1534438327276-14e5300c3a48"),
  },
  {
    slug: "doctors-and-clinics",
    name: "Doctors, Clinics & Specialists",
    group: "Health & Fitness",
    keywords: ["doctor", "clinic", "dentist", "specialist", "hospital", "physiotherapy"],
    kinds: ["doctor"],
    intro:
      "Consultants, general practitioners, dentists and physiotherapists listed by county and specialty, with consultation fees where the practice publishes them.",
    priceGuide: "GP consultation KSh 500 – 2,000; specialist consultation KSh 2,500 – 6,000.",
    faqs: [
      { q: "Do they accept NHIF or insurance?", a: "Ask the practice directly — cover varies by scheme and by facility." },
      { q: "Can I book an appointment?", a: "Yes, call or WhatsApp the number on the listing; most clinics also take walk-ins." },
    ],
    image: img("photo-1576091160399-112ba8d25d1d"),
  },
];

export const SERVICE_BY_SLUG = Object.fromEntries(SERVICE_TOPICS.map((s) => [s.slug, s]));

export const SERVICE_GROUPS = Array.from(new Set(SERVICE_TOPICS.map((s) => s.group)));

export const servicePath = (slug: string, county?: string) =>
  county ? `/services/${slug}?county=${encodeURIComponent(county)}` : `/services/${slug}`;
