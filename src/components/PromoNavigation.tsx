import { CalendarDays, Images, Megaphone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const promoItems = [
  { to: "/advertise", label: "Advertise", detail: "Paid placements", icon: Megaphone },
  { to: "/banners", label: "Showcase Banners", detail: "Free promo pages", icon: Images },
  { to: "/events", label: "Events", detail: "Host & RSVP", icon: CalendarDays },
];

const PromoNavigation = () => {
  const { pathname } = useLocation();

  return (
    <nav className="mb-6 grid gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-3" aria-label="Promotion sections">
      {promoItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight">{item.label}</span>
              <span className={`block text-[11px] leading-tight ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {item.detail}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default PromoNavigation;