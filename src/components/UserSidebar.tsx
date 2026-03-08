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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 bottom-0 w-[82vw] max-w-[340px] z-50 shadow-2xl flex flex-col overflow-hidden bg-gradient-to-b from-[#111827] via-[#1a1f2e] to-[#111827]"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Header */}
            <div className="pt-6 pb-2 px-5">
              <img src={logo} alt="KenyaAdvert" className="h-14 w-auto" />
            </div>

            {/* User card */}
            <div className="px-5 py-4">
              {user ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    {getInitials()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-white truncate">
                      {user.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white/50 font-bold text-sm">
                    G
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] text-white">Guest</p>
                    <p className="text-[11px] text-white/35">Sign in for full access</p>
                  </div>
                </div>
              )}
            </div>

            {/* Auth buttons for guests */}
            {!user && (
              <div className="px-5 pb-3 flex gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-white/10 rounded-lg text-[13px] font-medium text-white/70 hover:bg-white/5 transition-colors"
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
                    <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase">
                      {section.label}
                    </p>
                    {visibleItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-[11px] rounded-lg text-white/65 hover:text-white hover:bg-white/[0.06] active:bg-white/10 transition-all group"
                      >
                        <item.icon className="w-[18px] h-[18px] text-white/30 group-hover:text-emerald-400 transition-colors" />
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}

              {isAdmin && (
                <div className="mt-4">
                  <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.15em] text-white/20 uppercase">
                    ADMIN
                  </p>
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-[11px] rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-white/[0.06] transition-all group"
                  >
                    <ShieldCheck className="w-[18px] h-[18px]" />
                    <span className="text-[14px] font-medium">Admin Panel</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Logout */}
            {user && (
              <div className="p-4 border-t border-white/[0.06]">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-semibold transition-colors"
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
