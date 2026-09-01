import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, MessageCircle, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/post", label: "Publish", icon: PlusSquare, primary: true },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/settings", label: "Account", icon: User },
];

const HIDDEN_PREFIXES = ["/login", "/register", "/reset-password", "/admin"];

const MobileBottomNav = () => {
  const location = useLocation();
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, primary, exact }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              end={exact}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  primary
                    ? "text-primary"
                    : isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {primary ? (
                    <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                      <Icon className="h-5 w-5" />
                    </span>
                  ) : (
                    <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                  )}
                  <span className={primary ? "mt-0.5" : ""}>{label}</span>
                  {isActive && !primary && (
                    <span className="absolute -top-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-b-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
