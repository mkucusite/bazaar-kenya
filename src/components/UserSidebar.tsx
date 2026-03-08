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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
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
      { icon: History, label: "Subscription History", to: "/subscriptions", auth: true },
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
      { icon: HelpCircle, label: "FAQs", to: "/faqs" },
    ],
  },
];

const UserSidebar = ({ open, onClose }: UserSidebarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed left-0 top-0 bottom-0 w-[82vw] max-w-[360px] z-50 shadow-2xl flex flex-col overflow-hidden"
            style={{ backgroundColor: "#0d2b1e" }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Logo */}
            <div className="flex justify-center pt-6 pb-4 px-6">
              <img src={logo} alt="KenyaAdvert" className="h-20 w-auto" />
            </div>

            {/* User card */}
            <div className="px-5 pb-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {getInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {user.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white/60 font-bold text-sm">
                    G
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">Guest</p>
                    <p className="text-[11px] text-white/40">Sign in for full access</p>
                  </div>
                </div>
              )}
              {/* Gold divider */}
              <div className="mt-4 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />
            </div>

            {/* Auth buttons for guests */}
            {!user && (
              <div className="px-5 pb-3 space-y-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "#1B5E20" }}
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Create Account
                </Link>
              </div>
            )}

            {/* Menu sections */}
            <nav className="flex-1 overflow-y-auto pb-4">
              {menuSections.map((section) => {
                const visibleItems = section.items.filter(
                  (item) => !item.auth || user
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={section.label} className="mt-3">
                    <p className="px-6 mb-1 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                      {section.label}
                    </p>
                    {visibleItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={onClose}
                        className="flex items-center gap-3 px-6 py-[10px] text-white/80 hover:bg-white/10 active:bg-emerald-700/40 transition-colors"
                      >
                        <item.icon className="w-[18px] h-[18px] text-white/50" />
                        <span className="text-[14px]">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}

              {isAdmin && (
                <div className="mt-3">
                  <p className="px-6 mb-1 text-[10px] font-bold tracking-widest text-white/30 uppercase">
                    ADMIN
                  </p>
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 px-6 py-[10px] text-emerald-300 hover:bg-white/10 transition-colors"
                  >
                    <ShieldCheck className="w-[18px] h-[18px]" />
                    <span className="text-[14px] font-medium">Admin Panel</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Logout button */}
            {user && (
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserSidebar;
