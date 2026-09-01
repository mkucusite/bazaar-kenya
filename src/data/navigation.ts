import {
  BriefcaseBusiness, Building2, CalendarDays, Car, Code2, Dumbbell, GraduationCap,
  Hotel, Palmtree, PartyPopper, Scissors, Sparkles, Stethoscope, UtensilsCrossed, Wrench,
  type LucideIcon,
} from "lucide-react";

export type SiteNavLink = { to: string; label: string; desc: string; icon: LucideIcon };

export const DIRECTORY_NAV_LINKS: SiteNavLink[] = [
  { to: "/doctors", label: "Doctors", desc: "Specialists, dentists and clinics", icon: Stethoscope },
  { to: "/developers", label: "Developers", desc: "Web, app and creative portfolios", icon: Code2 },
  { to: "/wellness", label: "Massage & Wellness", desc: "Therapists, spas and wellness studios", icon: Sparkles },
  { to: "/jobs", label: "Jobs", desc: "Vacancies across Kenya", icon: BriefcaseBusiness },
  { to: "/hotels", label: "Hotels & Stays", desc: "Hotels, lodges and short stays", icon: Hotel },
  { to: "/vehicles", label: "Vehicles & Car Hire", desc: "Self-drive, chauffeur and transport", icon: Car },
  { to: "/tours", label: "Tours & Parks", desc: "Safaris, parks and trips", icon: Palmtree },
  { to: "/restaurants", label: "Restaurants", desc: "Food, cafés and catering", icon: UtensilsCrossed },
  { to: "/salons", label: "Salons & Barbers", desc: "Beauty professionals and booking", icon: Scissors },
  { to: "/schools", label: "Schools & Colleges", desc: "Institutions, courses and admissions", icon: GraduationCap },
  { to: "/gyms", label: "Gyms & Fitness", desc: "Gyms, trainers and classes", icon: Dumbbell },
  { to: "/artisans", label: "Fundis & Artisans", desc: "Local trades and repair services", icon: Wrench },
  { to: "/event-services", label: "Event Services", desc: "Photography, DJs, tents and décor", icon: PartyPopper },
];

export const MORE_NAV_LINKS = [
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/banners", label: "Banners", icon: Building2 },
  { to: "/business-profile", label: "Business Profiles", icon: Building2 },
];