import { X, Home, FileText, PlusCircle, History, Building2, Coins, Heart, MessageSquare, MessagesSquare, Bell as BellIcon, HelpCircle, LogOut, User, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: FileText, label: "Manage My Ads", to: "/my-ads", auth: true },
  { icon: PlusCircle, label: "Post An Ad", to: "/post-ad" },
  { icon: History, label: "Subscription History", to: "/subscriptions", auth: true },
  { icon: Building2, label: "Business Profile", to: "/business-profile", auth: true },
  { icon: Coins, label: "Credit Bundles", to: "/credits" },
  { icon: Heart, label: "My Favourites", to: "/favourites", auth: true },
  { icon: MessageSquare, label: "My Messages", to: "/messages", auth: true },
  { icon: MessagesSquare, label: "My Chats", to: "/chats", auth: true },
  { icon: BellIcon, label: "Manage Alerts", to: "/alerts", auth: true },
  { icon: HelpCircle, label: "FAQs", to: "/faqs" },
];

const UserSidebar = ({ open, onClose }: UserSidebarProps) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onClose();
    toast({ title: "Logged out successfully" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground z-50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-card z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/60">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-[10px]">KA</span>
                  </div>
                  <span className="font-heading font-bold text-sm text-foreground">KenyaAdvert</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  {user ? (
                    <>
                      <p className="font-semibold text-sm text-foreground truncate">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-sm text-foreground">Guest</p>
                      <Link to="/login" onClick={onClose} className="text-xs text-primary hover:underline">
                        Sign in to your account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!user && (
              <div className="px-4 py-3 border-b border-border/60 space-y-1.5">
                <Link to="/login" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link to="/register" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <UserPlus className="w-4 h-4" /> Create Account
                </Link>
              </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2">
              {menuItems.map((item) => {
                if (item.auth && !user) return null;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-2.5 text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <item.icon className="w-[18px] h-[18px] text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="border-t border-border/60 p-3">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-destructive hover:bg-destructive/5 rounded-lg transition-colors w-full">
                  <LogOut className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">Logout</span>
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
