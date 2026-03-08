import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import AdDetailsPage from "./pages/AdDetailsPage";
import PostAdPage from "./pages/PostAdPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import MyAdsPage from "./pages/MyAdsPage";
import CreditsPage from "./pages/CreditsPage";
import FavouritesPage from "./pages/FavouritesPage";
import ChatsPage from "./pages/ChatsPage";
import AlertsPage from "./pages/AlertsPage";
import NotificationsPage from "./pages/NotificationsPage";
import FAQsPage from "./pages/FAQsPage";
import MessagesPage from "./pages/MessagesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BusinessProfilePage from "./pages/BusinessProfilePage";
import AdminPage from "./pages/AdminPage";
import DynamicPage from "./pages/DynamicPage";
const queryClient = new QueryClient();

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Index /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
        <Route path="/ads/:id/:slug?" element={<PageWrapper><AdDetailsPage /></PageWrapper>} />
        <Route path="/post-ad" element={<PageWrapper><PostAdPage /></PageWrapper>} />
        <Route path="/blog" element={<PageWrapper><BlogPage /></PageWrapper>} />
        <Route path="/blog/:slug" element={<PageWrapper><BlogPostPage /></PageWrapper>} />
        <Route path="/my-ads" element={<PageWrapper><MyAdsPage /></PageWrapper>} />
        <Route path="/credits" element={<PageWrapper><CreditsPage /></PageWrapper>} />
        <Route path="/favourites" element={<PageWrapper><FavouritesPage /></PageWrapper>} />
        <Route path="/messages" element={<PageWrapper><MessagesPage /></PageWrapper>} />
        <Route path="/chats" element={<PageWrapper><ChatsPage /></PageWrapper>} />
        <Route path="/alerts" element={<PageWrapper><AlertsPage /></PageWrapper>} />
        <Route path="/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />
        <Route path="/faqs" element={<PageWrapper><FAQsPage /></PageWrapper>} />
        <Route path="/subscriptions" element={<PageWrapper><SubscriptionsPage /></PageWrapper>} />
        <Route path="/business-profile" element={<PageWrapper><BusinessProfilePage /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
        <Route path="/safety-tips" element={<PageWrapper><SafetyTipsPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><TermsPage /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><PrivacyPage /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

import CookieConsent from "@/components/CookieConsent";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AnimatedRoutes />
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
