import { X, Home, FileText, PlusCircle, History, Building2, Coins, Heart, MessageSquare, MessagesSquare, Bell as BellIcon, HelpCircle, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: FileText, label: "Manage My Ads", to: "/my-ads" },
  { icon: PlusCircle, label: "Post An Ad", to: "/post-ad" },
  { icon: History, label: "History Of My Subscriptions", to: "/subscriptions" },
  { icon: Building2, label: "My Business Profile", to: "/business-profile" },
  { icon: Coins, label: "Credit Bundles", to: "/credits" },
  { icon: Heart, label: "My Favourites", to: "/favourites" },
  { icon: MessageSquare, label: "My Messages", to: "/messages" },
  { icon: MessagesSquare, label: "My Chats", to: "/chats" },
  { icon: BellIcon, label: "Manage Alerts", to: "/alerts" },
  { icon: HelpCircle, label: "FAQs", to: "/faqs" },
];

const UserSidebar = ({ open, onClose }: UserSidebarProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 shadow-2xl overflow-y-auto"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading font-bold text-lg text-foreground">My Account</span>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Guest User</p>
                  <Link to="/login" onClick={onClose} className="text-sm text-primary hover:underline">
                    Login / Register
                  </Link>
                </div>
              </div>
            </div>

            <nav className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-6 py-3 text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                  {item.label === "Manage Alerts" && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border py-2">
              <button className="flex items-center gap-3 px-6 py-3 text-destructive hover:bg-muted transition-colors w-full">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserSidebar;
