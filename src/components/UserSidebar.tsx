import {
  X,
  Home,
  FileText,
  PlusCircle,
  History,
  Building2,
  Coins,
  Heart,
  MessagesSquare,
  Bell as BellIcon,
  HelpCircle,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Search,
  Moon,
  Sun,
  Settings,
  Megaphone,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/kenyaadvert-logo.png";

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    label: "MY ACCOUNT",
    items: [
      { icon: FileText, label: "Manage My Ads", to: "/my-ads", auth: true },
      { icon: History, label: "Subscriptions", to: "/subscriptions", auth: true },
      { icon: Building2, label: "Business Profile", to: "/business-profile", auth: true },
      { icon: Coins, label: "Credit Bundles", to: "/credits", auth: true },
    ],
  },
  {
    label: "LISTINGS",
    items: [
      { icon: Home, label: "Home", to: "/" },
      { icon: Search, label: "Browse Ads", to: "/search" },
      { icon: PlusCircle, label: "Post An Ad", to: "/post-ad" },
      { icon: Heart, label: "My Favourites", to: "/favourites", auth: true },
    ],
  },
  {
    label: "MESSAGES",
    items: [
      { icon: MessagesSquare, label: "My Chats", to: "/chats", auth: true },
      { icon: BellIcon, label: "Notifications", to: "/notifications", auth: true },
      { icon: BellIcon, label: "Manage Alerts", to: "/alerts", auth: true },
    ],
  },
  {
    label: "OTHER",
    items: [
      { icon: FileText, label: "Blog", to: "/blog" },
      { icon: HelpCircle, label: "FAQs", to: "/faqs" },
    ],
  },
];

const UserSidebar = ({ open, onClose }: UserSidebarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    onClose();
    toast({ title: "Logged out successfully" });
    navigate("/login");
  };

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    return name
      .split(/[\s@]+/)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 bottom-0 w-[82vw] max-w-[340px] z-50 shadow-2xl flex flex-col overflow-hidden bg-card border-r border-border"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Logo */}
            <div className="pt-5 pb-1 px-5">
              <img src={logo} alt="KenyaAdvert" className="h-12 w-auto" />
            </div>

            {/* User card */}
            <div className="px-4 py-3">
              {user ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm">
                    {getInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {user.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground font-bold text-sm">
                    G
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Guest</p>
                    <p className="text-[11px] text-muted-foreground">Sign in for full access</p>
                  </div>
                </div>
              )}
            </div>

            {/* Auth buttons for guests */}
            {!user && (
              <div className="px-4 pb-2 flex gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-border rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Register
                </Link>
              </div>
            )}

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
              {menuSections.map((section) => {
                const visibleItems = section.items.filter(
                  (item) => !item.auth || user
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={section.label} className="mt-4 first:mt-1">
                    <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/60 uppercase">
                      {section.label}
                    </p>
                    {visibleItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-[11px] rounded-lg transition-all group ${
                          isActive(item.to)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/70 hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className={`w-[18px] h-[18px] transition-colors ${
                          isActive(item.to) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        }`} />
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}

              {isAdmin && (
                <div className="mt-4">
                  <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.15em] text-muted-foreground/60 uppercase">
                    ADMIN
                  </p>
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-[11px] rounded-lg transition-all group ${
                      isActive("/admin")
                        ? "bg-accent/20 text-accent-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <ShieldCheck className="w-[18px] h-[18px]" />
                    <span className="text-[14px] font-medium">Admin Panel</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Bottom section: theme toggle + logout */}
            <div className="border-t border-border p-4 space-y-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-3 text-[13px] font-medium text-foreground/70">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
                <div className={`w-9 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${theme === "dark" ? "left-[18px]" : "left-0.5"}`} />
                </div>
              </button>

              {/* Logout */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[13px] font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserSidebar;
